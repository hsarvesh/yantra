import requests
import re

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

# Test creating a choice in sys_choice
test_choice = {
    'name': 'incident',
    'element': 'category',
    'label': 'End User Computing',
    'value': 'End User Computing',
    'language': 'en',
    'inactive': 'false'
}
r_ch = s.post('https://dev364281.service-now.com/api/now/table/sys_choice', headers=headers, json=test_choice)
print('Choice insert status:', r_ch.status_code)
if r_ch.status_code in [200, 201]:
    print('Created choice successfully! sys_id:', r_ch.json().get('result', {}).get('sys_id'))
