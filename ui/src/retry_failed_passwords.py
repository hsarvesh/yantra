import requests
import re

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

# Query all yash.com users
r_all = s.get('https://dev364281.service-now.com/api/now/table/sys_user?sysparm_query=emailLIKE@yash.com&sysparm_limit=1000&sysparm_fields=sys_id,user_name', headers=headers)
users = r_all.json().get('result', [])

# Update all or retry with sequential to catch the 3 that timed out or had lock
retry_count = 0
for u in users:
    uid = u['sys_id']
    payload = {'user_password': 'P@ssw0rd', 'password_needs_reset': 'false'}
    r = s.patch(f"https://dev364281.service-now.com/api/now/table/sys_user/{uid}", headers=headers, json=payload)
    if r.status_code in [200, 201]:
        retry_count += 1
    else:
        print(f"Failed user {u.get('user_name')}: {r.status_code} {r.text[:100]}")

print(f"Total confirmed updated: {retry_count} / {len(users)}")
