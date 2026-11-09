import requests
import re

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

test_payload = {
    'user_name': 'test.import.user',
    'first_name': 'Test',
    'last_name': 'ImportUser',
    'email': 'test.import@yash.com',
    'title': 'Test Engineer',
    'active': 'true'
}

r = s.post('https://dev364281.service-now.com/api/now/table/sys_user', headers=headers, json=test_payload)
print('Insert status:', r.status_code)
if r.status_code in [200, 201]:
    res = r.json()['result']
    print('Inserted successfully! sys_id:', res.get('sys_id'), 'name:', res.get('name'))
    
    # Delete the test record
    r_del = s.delete(f"https://dev364281.service-now.com/api/now/table/sys_user/{res.get('sys_id')}", headers=headers)
    print('Delete status:', r_del.status_code)
else:
    print('Error:', r.text[:300])
