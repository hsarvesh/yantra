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

r_cnt = s.get(f'{SNOW_URL}/api/now/stats/sys_user?sysparm_count=true&sysparm_query=emailLIKE@yash.com', headers=headers)
print('Total @yash.com users in ServiceNow:', r_cnt.json().get('result', {}).get('stats', {}).get('count'))

r_tot = s.get(f'{SNOW_URL}/api/now/stats/sys_user?sysparm_count=true', headers=headers)
print('Total sys_user count in instance:', r_tot.json().get('result', {}).get('stats', {}).get('count'))

# Sample check 5 users with their manager names
r_sample = s.get(f'{SNOW_URL}/api/now/table/sys_user?sysparm_query=emailLIKE@yash.com&sysparm_limit=5&sysparm_fields=user_name,name,title,email,manager.name', headers=headers)
print('\nSample 5 records:')
for u in r_sample.json().get('result', []):
    print(f" - {u.get('user_name')}: {u.get('name')} | {u.get('title')} | Manager: {u.get('manager.name')}")
