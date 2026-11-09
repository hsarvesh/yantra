import requests
import re

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

# In ServiceNow, custom tables are created via sys_db_object or scripts-background
# Let's test if sys_db_object can be inserted via REST or if we can use sys.scripts / processor
r_db = s.post('https://dev364281.service-now.com/api/now/table/sys_db_object', headers=headers, json={
    'name': 'u_itsm_taxonomy',
    'label': 'ITSM Taxonomy'
})
print('sys_db_object status:', r_db.status_code, r_db.text[:200])
