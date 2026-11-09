from snow_config import SNOW_URL, AUTH_DATA
import csv
import requests
import re

with open(r'D:\dev\YASH\Yantra\ui\EMP_list.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
csv_uids = set(r['user_id'].strip() for r in rows)

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

r = s.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_limit=2000&sysparm_fields=user_name,email', headers=headers)
snow_users = r.json().get('result', [])
snow_uids = set(u.get('user_name') for u in snow_users)

missing_uids = csv_uids - snow_uids
print(f"Total CSV uids: {len(csv_uids)}")
print(f"Found in ServiceNow: {len(csv_uids.intersection(snow_uids))}")
print(f"Missing uids: {len(missing_uids)}")
if missing_uids:
    print("Missing:", list(missing_uids))
