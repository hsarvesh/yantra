from snow_config import SNOW_URL, AUTH_DATA
import requests
import re

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

# Find sys_id of DakVen
r_usr = s.get(f"{SNOW_URL}/api/now/table/sys_user?sysparm_query=user_name=DakVen", headers=headers)
results = r_usr.json().get('result', [])
if not results:
    print("User DakVen not found")
    exit(1)

dakven_id = results[0]['sys_id']
print(f"DakVen sys_id: {dakven_id}")

# Update password
patch_payload = {
    'user_password': 'P@ssw0rd',
    'password_needs_reset': 'false'
}
r_patch = s.patch(f"{SNOW_URL}/api/now/table/sys_user/{dakven_id}", headers=headers, json=patch_payload)
print(f"Password update status: {r_patch.status_code}")

# Now test logging in as DakVen with P@ssw0rd
s_dak = requests.Session()
login_data = {
    'user_name': 'DakVen',
    'user_password': 'P@ssw0rd',
    'sys_action': 'sysverb_login'
}
r_login = s_dak.post(f'{SNOW_URL}/login.do', data=login_data)
print(f"Login status: {r_login.status_code}")

# Check navpage to verify DakVen is authenticated
r_dak_nav = s_dak.get(f'{SNOW_URL}/navpage.do')
m_user = re.search(r'userName\s*:\s*["\']([^"\']+)["\']', r_dak_nav.text)
if m_user:
    print(f"Successfully authenticated as: {m_user.group(1)}")
else:
    # check g_ck
    m_ck_dak = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_dak_nav.text, re.IGNORECASE)
    if m_ck_dak:
        print("Logged in successfully! g_ck found.")
    else:
        print("Login check snippet:", r_dak_nav.text[:300])
