from snow_config import SNOW_URL, AUTH_DATA
import requests
import re
import csv

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

# Check sample user_name like DakVen, AkaKum, etc.
sample_ids = ['DakVen', 'AkaKum', 'AriMoh']
for uid in sample_ids:
    r = s.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_query=user_name={uid}^ORemailLIKEyash.com&sysparm_fields=user_name,email', headers=headers)
    print(f"Check {uid}:", r.json().get('result'))
