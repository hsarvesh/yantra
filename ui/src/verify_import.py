import requests
import re

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

r_cnt = s.get('https://dev364281.service-now.com/api/now/stats/sys_user?sysparm_count=true&sysparm_query=emailLIKE@yash.com', headers=headers)
print('Total @yash.com users in ServiceNow:', r_cnt.json().get('result', {}).get('stats', {}).get('count'))

r_tot = s.get('https://dev364281.service-now.com/api/now/stats/sys_user?sysparm_count=true', headers=headers)
print('Total sys_user count in instance:', r_tot.json().get('result', {}).get('stats', {}).get('count'))

# Sample check 5 users with their manager names
r_sample = s.get('https://dev364281.service-now.com/api/now/table/sys_user?sysparm_query=emailLIKE@yash.com&sysparm_limit=5&sysparm_fields=user_name,name,title,email,manager.name', headers=headers)
print('\nSample 5 records:')
for u in r_sample.json().get('result', []):
    print(f" - {u.get('user_name')}: {u.get('name')} | {u.get('title')} | Manager: {u.get('manager.name')}")
