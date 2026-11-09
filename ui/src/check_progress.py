from snow_config import SNOW_URL, AUTH_DATA
import requests
import re

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

r = s.get(f'{SNOW_URL}/api/now/stats/u_itsm_taxonomy?sysparm_count=true', headers=headers)
print('Current count in u_itsm_taxonomy:', r.json().get('result', {}).get('stats', {}).get('count'))

r_mem = s.get(f'{SNOW_URL}/api/now/stats/sys_user_grmember?sysparm_count=true', headers=headers)
print('Current count in sys_user_grmember:', r_mem.json().get('result', {}).get('stats', {}).get('count'))
