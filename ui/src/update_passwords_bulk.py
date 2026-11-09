from snow_config import SNOW_URL, AUTH_DATA
import requests
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

TARGET_PASSWORD = 'P@ssw0rd'

def get_auth_session():
    s = requests.Session()
    s.post(f'{SNOW_URL}/login.do', data=AUTH_DATA)
    r_nav = s.get(f'{SNOW_URL}/navpage.do')
    m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
    if not m_ck:
        raise Exception("Could not get g_ck token")
    token = m_ck.group(1)
    s.headers.update({
        'X-UserToken': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    })
    return s

def main():
    print(f"=== Updating Default Password for all @yash.com users to '{TARGET_PASSWORD}' ===")
    start_time = time.time()
    
    session = get_auth_session()
    print("Authenticated successfully with ServiceNow configured instance.")

    # 1. Fetch all users with email @yash.com
    r_users = session.get(f"{SNOW_URL}/api/now/table/sys_user?sysparm_query=emailLIKE@yash.com&sysparm_limit=1000&sysparm_fields=sys_id,user_name,name,email")
    users = r_users.json().get('result', [])
    print(f"Found {len(users)} users with @yash.com email in ServiceNow.")

    if not users:
        print("No users found to update.")
        return

    # 2. Update each user password concurrently
    payload = {
        'user_password': TARGET_PASSWORD,
        'password_needs_reset': 'false'
    }

    def update_user(u):
        uid = u['sys_id']
        uname = u.get('user_name')
        r = session.patch(f"{SNOW_URL}/api/now/table/sys_user/{uid}", json=payload)
        return {'uname': uname, 'success': r.status_code in [200, 201]}

    success_count = 0
    fail_count = 0

    with ThreadPoolExecutor(max_workers=14) as executor:
        futures = [executor.submit(update_user, u) for u in users]
        for f in as_completed(futures):
            res = f.result()
            if res['success']:
                success_count += 1
            else:
                fail_count += 1
            if (success_count + fail_count) % 50 == 0:
                print(f"  Progress: {success_count + fail_count} / {len(users)} passwords updated...")

    duration = round(time.time() - start_time, 2)
    print(f"\n=== Completed Password Update in {duration}s ===")
    print(f"Successfully updated: {success_count} users")
    print(f"Failed: {fail_count} users")

    # 3. Test verification on a second user, e.g. AkaKum (Akash Kumar Singh)
    test_user = 'AkaKum'
    s_test = requests.Session()
    r_test_login = s_test.post(f"{SNOW_URL}/login.do", data={
        'user_name': test_user,
        'user_password': TARGET_PASSWORD,
        'sys_action': 'sysverb_login'
    })
    print(f"\nVerification test login for {test_user}: HTTP {r_test_login.status_code}")
    r_test_nav = s_test.get(f"{SNOW_URL}/navpage.do")
    if 'g_ck' in r_test_nav.text:
        print(f"Verified: {test_user} successfully logged in using default password '{TARGET_PASSWORD}'!")

if __name__ == '__main__':
    main()
