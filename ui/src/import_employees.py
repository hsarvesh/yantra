from snow_config import SNOW_URL, AUTH_DATA
import csv
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

CSV_PATH = r'D:\dev\YASH\Yantra\ui\EMP_list.csv'

def get_auth_session():
    s = requests.Session()
    s.post(f'{SNOW_URL}/login.do', data=AUTH_DATA)
    r_nav = s.get(f'{SNOW_URL}/navpage.do')
    m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
    if not m_ck:
        raise Exception("Could not obtain ServiceNow g_ck token")
    token = m_ck.group(1)
    s.headers.update({
        'X-UserToken': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    })
    return s

def split_name(full_name):
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], ''
    first = parts[0]
    last = ' '.join(parts[1:])
    return first, last

def main():
    print("=== Starting ServiceNow Employee & Manager Import ===")
    start_time = time.time()
    
    # 1. Read CSV
    with open(CSV_PATH, encoding='utf-8') as f:
        employees = list(csv.DictReader(f))
    print(f"Loaded {len(employees)} employee records from CSV.")

    emp_names_set = set(e['Employee Name'].strip() for e in employees)
    all_irms_set = set(e['IRM'].strip() for e in employees if e.get('IRM', '').strip())
    missing_managers = all_irms_set - emp_names_set
    print(f"Unique IRMs referenced: {len(all_irms_set)}")
    print(f"IRMs already in employee list: {len(all_irms_set - missing_managers)}")
    print(f"External IRMs to create (Option A): {len(missing_managers)}")

    session = get_auth_session()
    print("Authenticated successfully with ServiceNow.")

    # Name/UserID to sys_id lookup
    name_to_sysid = {}
    
    # 2. Check existing users in instance first to avoid duplicates
    print("Checking existing users in ServiceNow...")
    r_existing = session.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_limit=2000&sysparm_fields=sys_id,user_name,name,email')
    existing_users = r_existing.json().get('result', [])
    for u in existing_users:
        if u.get('user_name'):
            name_to_sysid[u['user_name']] = u['sys_id']
        if u.get('name'):
            name_to_sysid[u['name']] = u['sys_id']
    print(f"Found {len(existing_users)} existing users in instance.")

    # 3. Create the 32 missing external managers first
    print("\n--- Phase 1: Creating External Reporting Managers ---")
    created_mgrs = 0
    for mgr_name in sorted(missing_managers):
        if mgr_name in name_to_sysid:
            continue
        first, last = split_name(mgr_name)
        # Generate user_name for manager, e.g. first3+last3
        clean_user_name = re.sub(r'[^a-zA-Z0-9]', '', mgr_name).lower()
        if not clean_user_name:
            clean_user_name = f"mgr_{int(time.time()*1000)%100000}"

        mgr_payload = {
            'user_name': clean_user_name,
            'first_name': first,
            'last_name': last,
            'name': mgr_name,
            'title': 'Reporting Manager',
            'active': 'true'
        }
        res = session.post(f'{SNOW_URL}/api/now/table/sys_user', json=mgr_payload)
        if res.status_code in [200, 201]:
            s_id = res.json()['result']['sys_id']
            name_to_sysid[mgr_name] = s_id
            name_to_sysid[clean_user_name] = s_id
            created_mgrs += 1
        else:
            print(f"Failed to create manager {mgr_name}: {res.status_code} {res.text[:100]}")
    print(f"External managers created: {created_mgrs} (Total available: {len(missing_managers)})")

    # 4. Create all 349 Employees (Concurrent Pool)
    print("\n--- Phase 2: Inserting 349 Employees ---")
    def create_employee(emp):
        user_name = emp['user_id'].strip()
        full_name = emp['Employee Name'].strip()
        
        # Check if already exists
        if user_name in name_to_sysid:
            return {'user_name': user_name, 'name': full_name, 'sys_id': name_to_sysid[user_name], 'status': 'already_exists'}

        payload = {
            'user_name': user_name,
            'first_name': emp.get('First_Name', '').strip(),
            'last_name': emp.get('Last_Name', '').strip(),
            'name': full_name,
            'title': emp.get('Designation', '').strip(),
            'email': emp.get('Email', '').strip(),
            'active': 'true'
        }
        
        # Worker dedicated session or shared session
        r = session.post(f'{SNOW_URL}/api/now/table/sys_user', json=payload)
        if r.status_code in [200, 201]:
            sys_id = r.json()['result']['sys_id']
            return {'user_name': user_name, 'name': full_name, 'sys_id': sys_id, 'status': 'created'}
        else:
            return {'user_name': user_name, 'name': full_name, 'error': f"{r.status_code} {r.text[:100]}", 'status': 'error'}

    emp_success = 0
    emp_errors = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(create_employee, emp): emp for emp in employees}
        for future in as_completed(futures):
            res = future.result()
            if res['status'] in ['created', 'already_exists']:
                name_to_sysid[res['name']] = res['sys_id']
                name_to_sysid[res['user_name']] = res['sys_id']
                emp_success += 1
            else:
                print(f"Error creating {res['user_name']}: {res.get('error')}")
                emp_errors += 1

    print(f"Employee insertion complete: {emp_success} succeeded, {emp_errors} errors.")

    # 5. Phase 3: Link Manager (IRM) references
    print("\n--- Phase 3: Linking Reporting Managers (sys_user.manager) ---")
    def update_manager(emp):
        user_name = emp['user_id'].strip()
        irm_name = emp.get('IRM', '').strip()
        if not irm_name:
            return {'user': user_name, 'status': 'no_irm'}

        user_sys_id = name_to_sysid.get(user_name)
        mgr_sys_id = name_to_sysid.get(irm_name)

        if not user_sys_id:
            return {'user': user_name, 'status': 'user_not_found'}
        if not mgr_sys_id:
            return {'user': user_name, 'status': 'mgr_not_found', 'irm': irm_name}

        r = session.patch(f'{SNOW_URL}/api/now/table/sys_user/{user_sys_id}', json={'manager': mgr_sys_id})
        if r.status_code in [200, 201]:
            return {'user': user_name, 'status': 'linked'}
        else:
            return {'user': user_name, 'status': 'link_failed', 'error': r.status_code}

    mgr_linked = 0
    mgr_failed = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(update_manager, emp): emp for emp in employees}
        for future in as_completed(futures):
            res = future.result()
            if res['status'] == 'linked':
                mgr_linked += 1
            elif res['status'] != 'no_irm':
                mgr_failed += 1

    print(f"Manager linking complete: {mgr_linked} employees successfully linked to their manager ({mgr_failed} skipped/failed).")

    # 6. Final verification
    total_time = round(time.time() - start_time, 2)
    print(f"\n=== Import Completed in {total_time}s ===")
    
    # Query sample user with manager expanded
    r_check = session.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_query=emailLIKE@yash.com&sysparm_limit=3&sysparm_fields=user_name,name,title,email,manager.name')
    print("Sample imported records from ServiceNow:")
    for u in r_check.json().get('result', []):
        mgr_display = u.get('manager.name') or u.get('manager', '')
        print(f"  - {u.get('user_name')}: {u.get('name')} | {u.get('title')} | Manager: {mgr_display}")

if __name__ == '__main__':
    main()
