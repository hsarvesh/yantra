from snow_config import SNOW_URL, AUTH_DATA
import openpyxl
import requests
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

EXCEL_PATH = r'D:\dev\YASH\Yantra\ui\Enterprise_CMDB_Inventory.xlsx'

thread_local = threading.local()

def get_auth_session():
    s = requests.Session()
    s.post(f'{SNOW_URL}/login.do', data=AUTH_DATA)
    r_nav = s.get(f'{SNOW_URL}/navpage.do')
    m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
    if not m_ck:
        raise Exception("Could not get g_ck token")
    token = m_ck.group(1)
    s.headers.update({
        'X-UserToken': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    })
    return s, token

def get_worker_session(main_session, token):
    if not hasattr(thread_local, 'session'):
        s = requests.Session()
        s.cookies.update(main_session.cookies)
        s.headers.update({
            'X-UserToken': token,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        thread_local.session = s
    return thread_local.session

def main():
    print("=== Starting Enterprise CMDB Inventory Import to ServiceNow ===")
    total_start = time.time()
    main_session, token = get_auth_session()
    print("Authenticated successfully with ServiceNow.")

    # 1. Cache Groups
    r_grp = main_session.get(f"{SNOW_URL}/api/now/table/sys_user_group?sysparm_limit=200&sysparm_fields=name,sys_id")
    group_map = {g['name']: g['sys_id'] for g in r_grp.json().get('result', [])}
    print(f"Cached {len(group_map)} Support Groups.")

    # 2. Cache Locations
    r_loc = main_session.get(f"{SNOW_URL}/api/now/table/cmn_location?sysparm_limit=200&sysparm_fields=name,sys_id")
    loc_map = {l['name']: l['sys_id'] for l in r_loc.json().get('result', [])}
    print(f"Cached {len(loc_map)} Locations.")

    # 3. Read Excel rows
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb['All_CMDB_Inventory']
    headers = [cell.value for cell in ws[1]]
    records = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        records.append(dict(zip(headers, row)))

    print(f"Loaded {len(records)} CIs from Excel sheet 'All_CMDB_Inventory'.")

    # 4. Check already existing CIs in cmdb_ci to ensure idempotency
    print("Checking for existing CIs in cmdb_ci...")
    r_existing = main_session.get(f"{SNOW_URL}/api/now/table/cmdb_ci?sysparm_fields=name&sysparm_limit=10000")
    existing_names = set(ci['name'] for ci in r_existing.json().get('result', []))
    print(f"Found {len(existing_names)} existing CIs currently in CMDB.")

    to_import = [r for r in records if r['Name'] not in existing_names]
    print(f"Records to import: {len(to_import)} (Skipping {len(records) - len(to_import)} already present)")

    if not to_import:
        print("All CIs already imported into ServiceNow CMDB!")
        return

    # 5. Concurrent Import
    success_count = 0
    fail_count = 0

    def import_single_ci(rec):
        target_table = rec.get('Class', 'cmdb_ci')
        loc_id = loc_map.get(rec.get('Location'))
        grp_id = group_map.get(rec.get('Support Group'))

        payload = {
            'name': rec.get('Name'),
            'ip_address': rec.get('IP Address'),
            'serial_number': rec.get('Serial Number'),
            'short_description': rec.get('Short Description'),
            'os': rec.get('Operating System'),
            'install_status': '1',     # 1 = Installed
            'operational_status': '1', # 1 = Operational
        }
        if loc_id:
            payload['location'] = loc_id
        if grp_id:
            payload['support_group'] = grp_id
        if rec.get('Manufacturer'):
            payload['manufacturer'] = rec.get('Manufacturer')
        if rec.get('Model'):
            payload['model_number'] = rec.get('Model')

        s_worker = get_worker_session(main_session, token)
        
        # Retry loop for resilience
        for attempt in range(3):
            try:
                res = s_worker.post(f"{SNOW_URL}/api/now/table/{target_table}", json=payload, timeout=20)
                if res.status_code in (200, 201):
                    return True, rec.get('Name'), res.status_code, ""
                elif res.status_code == 429:
                    time.sleep(1.0 * (attempt + 1))
                else:
                    return False, rec.get('Name'), res.status_code, res.text[:200]
            except Exception as e:
                time.sleep(0.5 * (attempt + 1))
                if attempt == 2:
                    return False, rec.get('Name'), 0, str(e)
        return False, rec.get('Name'), 0, "Max retries exceeded"

    workers = 12
    print(f"Starting multi-threaded import of {len(to_import)} CIs (Worker pool = {workers})...")
    batch_start = time.time()
    
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(import_single_ci, rec): rec for rec in to_import}
        for idx, f in enumerate(as_completed(futures), 1):
            ok, name, status, err_text = f.result()
            if ok:
                success_count += 1
            else:
                fail_count += 1
                if fail_count <= 5:
                    print(f"Failed to import {name}: Status {status} - {err_text[:120]}")

            if idx % 100 == 0 or idx == len(to_import):
                elapsed = time.time() - batch_start
                rate = idx / elapsed if elapsed > 0 else 0
                pct = (idx / len(to_import)) * 100
                print(f"[{pct:5.1f}%] {idx}/{len(to_import)} CIs ({success_count} success, {fail_count} failed) - {rate:.1f} CIs/sec")

    total_time = time.time() - total_start
    print(f"\n=======================================================")
    print(f"=== CMDB Bulk Import Completed in {total_time:.1f}s ({total_time/60:.2f} mins) ===")
    print(f"Total Successfully Imported: {success_count}")
    print(f"Total Failed: {fail_count}")
    print(f"=======================================================")

if __name__ == '__main__':
    main()
