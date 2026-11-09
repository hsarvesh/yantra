from snow_config import SNOW_URL, AUTH_DATA
import openpyxl
import requests
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

EXCEL_PATH = r'D:\dev\YASH\Yantra\ui\Enterprise_ITSM_Taxonomy.xlsx'

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
    return s

def main():
    print("=== Starting Enterprise ITSM Taxonomy & Workgroups Import ===")
    total_start = time.time()
    
    session = get_auth_session()
    print("Authenticated successfully with ServiceNow configured instance.")

    # 1. Load Excel Data
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    tax_rows = list(wb['ITSM Taxonomy'].iter_rows(values_only=True))[1:]
    wg_rows = [r for r in list(wb['Workgroups'].iter_rows(values_only=True))[1:] if r[0]]

    print(f"Loaded {len(tax_rows)} Taxonomy rows and {len(wg_rows)} Workgroup rows from Excel.")

    # 2. Cache Groups & Users
    print("\n--- Phase 1: Resolving Group and User SysIDs ---")
    group_map = {}
    r_grp = session.get(f"{SNOW_URL}/api/now/table/sys_user_group?sysparm_limit=200&sysparm_fields=name,sys_id")
    for g in r_grp.json().get('result', []):
        group_map[g['name']] = g['sys_id']
    print(f"Cached {len(group_map)} Support Groups from ServiceNow.")

    # Check / Create "Change Approvers" group for the 7 designated change approvers
    if 'Change Approvers' not in group_map:
        res_ca = session.post(f"{SNOW_URL}/api/now/table/sys_user_group", json={
            'name': 'Change Approvers',
            'description': 'Designated IT Change Approvers identified from Enterprise ITSM Taxonomy Workgroups.',
            'active': 'true'
        })
        if res_ca.status_code in [200, 201]:
            group_map['Change Approvers'] = res_ca.json()['result']['sys_id']
            print("Created dedicated group 'Change Approvers'.")

    user_map = {}
    r_usr = session.get(f"{SNOW_URL}/api/now/table/sys_user?sysparm_limit=3000&sysparm_fields=user_name,name,email,sys_id")
    for u in r_usr.json().get('result', []):
        if u.get('user_name'):
            user_map[u['user_name']] = u['sys_id']
        if u.get('email'):
            user_map[u['email'].lower()] = u['sys_id']
    print(f"Cached {len(user_map)} User SysIDs from ServiceNow.")

    # 3. Phase 2: Import Workgroups (sys_user_grmember)
    print("\n--- Phase 2: Importing Workgroup Memberships (sys_user_grmember) ---")
    # Check existing memberships to avoid duplicates
    existing_memberships = set()
    r_mem = session.get(f"{SNOW_URL}/api/now/table/sys_user_grmember?sysparm_limit=1000&sysparm_fields=user,group")
    for m in r_mem.json().get('result', []):
        u_val = m.get('user', {}).get('value') if isinstance(m.get('user'), dict) else m.get('user')
        g_val = m.get('group', {}).get('value') if isinstance(m.get('group'), dict) else m.get('group')
        if u_val and g_val:
            existing_memberships.add((u_val, g_val))

    wg_created = 0
    change_approvers_added = 0
    for r in wg_rows:
        uid = r[0]
        name = r[1]
        email = (r[5] or '').strip().lower()
        support_grp_name = r[7]
        is_change_approver = str(r[8]).strip().lower() == 'yes'

        user_sys_id = user_map.get(uid) or user_map.get(email)
        grp_sys_id = group_map.get(support_grp_name)

        if not user_sys_id:
            print(f"User not found for workgroup: {uid} ({name})")
            continue
        if not grp_sys_id:
            print(f"Group not found: {support_grp_name}")
            continue

        if (user_sys_id, grp_sys_id) not in existing_memberships:
            r_add = session.post(f"{SNOW_URL}/api/now/table/sys_user_grmember", json={
                'user': user_sys_id,
                'group': grp_sys_id
            })
            if r_add.status_code in [200, 201]:
                existing_memberships.add((user_sys_id, grp_sys_id))
                wg_created += 1

        # If Change Approver, add to Change Approvers group as well
        if is_change_approver and 'Change Approvers' in group_map:
            ca_grp_id = group_map['Change Approvers']
            if (user_sys_id, ca_grp_id) not in existing_memberships:
                session.post(f"{SNOW_URL}/api/now/table/sys_user_grmember", json={
                    'user': user_sys_id,
                    'group': ca_grp_id
                })
                existing_memberships.add((user_sys_id, ca_grp_id))
                change_approvers_added += 1

    print(f"Workgroup memberships processed: {wg_created} Support Group members added.")
    print(f"Change Approvers added to 'Change Approvers' group: {change_approvers_added}.")

    # 4. Phase 3: Setup Category and Subcategory in sys_choice
    print("\n--- Phase 3: Populating Incident Category & Subcategory Choices (sys_choice) ---")
    unique_cats = sorted(set(r[0] for r in tax_rows if r[0]))
    cat_sub_pairs = sorted(set((r[0], r[1]) for r in tax_rows if r[0] and r[1]))

    # Cache existing choices
    r_ch = session.get(f"{SNOW_URL}/api/now/table/sys_choice?sysparm_query=name=incident&sysparm_limit=1000&sysparm_fields=element,value,dependent_value")
    existing_choices = set()
    for ch in r_ch.json().get('result', []):
        existing_choices.add((ch.get('element'), ch.get('value'), ch.get('dependent_value', '')))

    choices_added = 0
    # Add Categories
    for idx, cat in enumerate(unique_cats):
        if ('category', cat, '') not in existing_choices:
            r_c = session.post(f"{SNOW_URL}/api/now/table/sys_choice", json={
                'name': 'incident',
                'element': 'category',
                'label': cat,
                'value': cat,
                'sequence': idx + 10,
                'language': 'en',
                'inactive': 'false'
            })
            if r_c.status_code in [200, 201]:
                choices_added += 1
                existing_choices.add(('category', cat, ''))

    # Add Dependent Subcategories
    for cat, sub in cat_sub_pairs:
        if ('subcategory', sub, cat) not in existing_choices:
            r_s = session.post(f"{SNOW_URL}/api/now/table/sys_choice", json={
                'name': 'incident',
                'element': 'subcategory',
                'label': sub,
                'value': sub,
                'dependent_value': cat,
                'language': 'en',
                'inactive': 'false'
            })
            if r_s.status_code in [200, 201]:
                choices_added += 1
                existing_choices.add(('subcategory', sub, cat))

    print(f"Choices populated: {choices_added} new category/subcategory options created in sys_choice.")

    # 5. Phase 4: Import all 2,668 Taxonomy Records into u_itsm_taxonomy
    print(f"\n--- Phase 4: Populating {len(tax_rows)} Records into u_itsm_taxonomy ---")
    
    def insert_taxonomy_record(row):
        cat = row[0]
        sub = row[1]
        cls = row[2]
        ttype = row[3]
        sgrp_name = row[4]
        sgrp_sys_id = group_map.get(sgrp_name, '')

        payload = {
            'u_category': cat,
            'u_subcategory': sub,
            'u_classification': cls,
            'u_ticket_type': ttype,
            'u_support_group': sgrp_sys_id
        }

        r = session.post(f"{SNOW_URL}/api/now/table/u_itsm_taxonomy", json=payload)
        return r.status_code in [200, 201]

    tax_success = 0
    tax_errors = 0
    start_tax = time.time()
    
    with ThreadPoolExecutor(max_workers=14) as executor:
        futures = [executor.submit(insert_taxonomy_record, r) for r in tax_rows]
        for f in as_completed(futures):
            if f.result():
                tax_success += 1
            else:
                tax_errors += 1
            if (tax_success + tax_errors) % 500 == 0:
                print(f"  Progress: {tax_success + tax_errors} / {len(tax_rows)} records inserted...")

    tax_duration = round(time.time() - start_tax, 2)
    print(f"Taxonomy insertion finished in {tax_duration}s: {tax_success} succeeded, {tax_errors} errors.")

    # 6. Verification & Sample Check
    total_duration = round(time.time() - total_start, 2)
    print(f"\n=== Entire Import Completed in {total_duration}s ===")

    # Verify count in u_itsm_taxonomy
    r_cnt = session.get(f"{SNOW_URL}/api/now/stats/u_itsm_taxonomy?sysparm_count=true")
    count_in_db = r_cnt.json().get('result', {}).get('stats', {}).get('count')
    print(f"Total records in u_itsm_taxonomy table: {count_in_db}")

    # Sample query
    r_sample = session.get(f"{SNOW_URL}/api/now/table/u_itsm_taxonomy?sysparm_limit=3&sysparm_fields=u_category,u_subcategory,u_classification,u_ticket_type,u_support_group.name")
    print("Sample records from u_itsm_taxonomy:")
    for rec in r_sample.json().get('result', []):
        grp = rec.get('u_support_group.name') or rec.get('u_support_group', '')
        print(f" - [{rec.get('u_category')}] > [{rec.get('u_subcategory')}] > [{rec.get('u_classification')}] ({rec.get('u_ticket_type')}) -> Group: {grp}")

if __name__ == '__main__':
    main()
