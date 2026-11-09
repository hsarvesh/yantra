import requests
import re

test_users = ['DakVen', 'JasKau', 'AriMoh']
for u in test_users:
    s = requests.Session()
    r = s.post('https://dev364281.service-now.com/login.do', data={
        'user_name': u,
        'user_password': 'P@ssw0rd',
        'sys_action': 'sysverb_login'
    })
    r_nav = s.get('https://dev364281.service-now.com/navpage.do')
    m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
    print(f"User {u}: HTTP {r.status_code} | Login Verified: {bool(m_ck)}")
