import requests
import re
import urllib.parse

s = requests.Session()
data = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

groups = ['Application Support', 'Email & Collaboration', 'End User Computing', 'Network Services', 'Server Infrastructure', 'Change Approvers']
for g in groups:
    q = urllib.parse.quote(f'name={g}')
    r_g = s.get(f'https://dev364281.service-now.com/api/now/table/sys_user_group?sysparm_query={q}', headers=headers)
    res = r_g.json().get('result', [])
    if res:
        gid = res[0]['sys_id']
        r_m = s.get(f'https://dev364281.service-now.com/api/now/stats/sys_user_grmember?sysparm_count=true&sysparm_query=group={gid}', headers=headers)
        cnt = r_m.json().get('result', {}).get('stats', {}).get('count')
        print(f' - {g}: {cnt} members')
