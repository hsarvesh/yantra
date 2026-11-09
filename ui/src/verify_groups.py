from snow_config import SNOW_URL, AUTH_DATA
import requests
import re
import urllib.parse

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

names = [
    'End User Computing', 'Access Management', 'Email & Collaboration', 
    'Network Services', 'Server Infrastructure', 'Application Support', 
    'Cloud Services', 'Security', 'Telephony', 'Asset Management', 
    'Monitoring & Operations', 'Facilities IT'
]

raw_query = f"nameIN{','.join(names)}"
encoded_query = urllib.parse.quote(raw_query)

r = s.get(f'{SNOW_URL}/api/now/table/sys_user_group?sysparm_query={encoded_query}&sysparm_fields=name,sys_id,active,type', headers=headers)
results = r.json().get('result', [])
print(f'Verified {len(results)} of {len(names)} Support Groups in ServiceNow:')
for g in sorted(results, key=lambda x: x.get('name')):
    print(f" - {g.get('name')} | SysID: {g.get('sys_id')}")
