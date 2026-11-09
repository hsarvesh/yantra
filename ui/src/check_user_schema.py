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
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

r = s.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_limit=2&sysparm_fields=user_name,first_name,last_name,name,email,title,manager', headers=headers)
print('sys_user sample:', r.json().get('result'))

# Check count of sys_user
r_count = s.get(f'{SNOW_URL}/api/now/stats/sys_user?sysparm_count=true', headers=headers)
print('Current sys_user count:', r_count.json().get('result', {}).get('stats', {}).get('count'))
