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

# Check incident categories in sys_choice
r_choice = s.get(f'{SNOW_URL}/api/now/table/sys_choice?sysparm_query=name=incident^element=category&sysparm_limit=10&sysparm_fields=label,value,sequence', headers=headers)
print('Current incident category choices:', r_choice.json().get('result'))

# Check if u_itsm_taxonomy table exists
r_tbl = s.get(f'{SNOW_URL}/api/now/table/sys_db_object?sysparm_query=name=u_itsm_taxonomy', headers=headers)
print('u_itsm_taxonomy exists:', len(r_tbl.json().get('result', [])) > 0)
