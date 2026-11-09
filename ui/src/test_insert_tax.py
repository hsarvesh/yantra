import requests
import re

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

rec = {
    'u_category': 'End User Computing',
    'u_subcategory': 'Desktop',
    'u_classification': 'Incident',
    'u_ticket_type': 'Incident'
}
r = s.post('https://dev364281.service-now.com/api/now/table/u_itsm_taxonomy', headers=headers, json=rec)
print('Test insert status:', r.status_code)
if r.status_code in [200, 201]:
    res = r.json().get('result')
    print('Inserted successfully! sys_id:', res.get('sys_id'))
    # Clean up test record
    s.delete(f"https://dev364281.service-now.com/api/now/table/u_itsm_taxonomy/{res.get('sys_id')}", headers=headers)
else:
    print('Error:', r.text[:300])
