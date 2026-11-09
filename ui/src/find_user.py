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

r = s.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_query=nameLIKEChandramohan&sysparm_fields=user_name,name,email,title,manager.name', headers=headers)
print(r.json().get('result'))
