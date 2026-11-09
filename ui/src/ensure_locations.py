import requests, re

SNOW_URL = 'https://dev364281.service-now.com'
AUTH_DATA = {'user_name': 'admin', 'user_password': 'nm6uC9vSG%$X', 'sys_action': 'sysverb_login'}

s = requests.Session()
s.post(f'{SNOW_URL}/login.do', data=AUTH_DATA)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
s.headers.update({'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'})

target_locs = [
    {'name': 'Bangalore', 'city': 'Bangalore', 'country': 'India'},
    {'name': 'Pune', 'city': 'Pune', 'country': 'India'},
    {'name': 'Hyderabad', 'city': 'Hyderabad', 'country': 'India'},
    {'name': 'Indore', 'city': 'Indore', 'country': 'India'},
    {'name': 'Delhi', 'city': 'Delhi', 'country': 'India'},
]

loc_map = {}
for loc in target_locs:
    # check existing
    r = s.get(f"{SNOW_URL}/api/now/table/cmn_location?name={loc['name']}")
    res = r.json().get('result', [])
    if res:
        print(f"Location {loc['name']} already exists: {res[0]['sys_id']}")
        loc_map[loc['name']] = res[0]['sys_id']
    else:
        r_post = s.post(f"{SNOW_URL}/api/now/table/cmn_location", json=loc)
        created = r_post.json().get('result', {})
        print(f"Created location {loc['name']}: {created.get('sys_id')}")
        loc_map[loc['name']] = created.get('sys_id')

print("All locations ready:", loc_map)
