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

# Check sample groups
r = s.get(f'{SNOW_URL}/api/now/table/sys_user_group?sysparm_limit=2&sysparm_fields=name,description,type,active', headers=headers)
print('Sample groups:', r.json().get('result'))

# Check group types (e.g. itil or catalog)
r_types = s.get(f'{SNOW_URL}/api/now/table/sys_user_group_type?sysparm_limit=10&sysparm_fields=name,sys_id', headers=headers)
print('Group types in instance:', r_types.json().get('result'))
