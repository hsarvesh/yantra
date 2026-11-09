from snow_config import SNOW_URL, AUTH_DATA
import requests
import re

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

fields = [
    {'name': 'u_itsm_taxonomy', 'element': 'u_category', 'column_label': 'Category', 'internal_type': 'string', 'max_length': 100},
    {'name': 'u_itsm_taxonomy', 'element': 'u_subcategory', 'column_label': 'Subcategory', 'internal_type': 'string', 'max_length': 100},
    {'name': 'u_itsm_taxonomy', 'element': 'u_classification', 'column_label': 'Classification', 'internal_type': 'string', 'max_length': 100},
    {'name': 'u_itsm_taxonomy', 'element': 'u_ticket_type', 'column_label': 'Ticket Type', 'internal_type': 'string', 'max_length': 50},
    {'name': 'u_itsm_taxonomy', 'element': 'u_support_group', 'column_label': 'Support Group', 'internal_type': 'reference', 'reference': 'sys_user_group'}
]

for f in fields:
    # check if element exists
    r_chk = s.get(f"{SNOW_URL}/api/now/table/sys_dictionary?sysparm_query=name=u_itsm_taxonomy^element={f['element']}", headers=headers)
    if not r_chk.json().get('result'):
        r_f = s.post(f'{SNOW_URL}/api/now/table/sys_dictionary', headers=headers, json=f)
        print(f"Added field {f['element']}: {r_f.status_code}")
    else:
        print(f"Field {f['element']} already exists")
