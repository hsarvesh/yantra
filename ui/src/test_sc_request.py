import requests
import re

s = requests.Session()
data = {
    'user_name': 'admin',
    'user_password': 'nm6uC9vSG%$X',
    'sys_action': 'sysverb_login'
}
s.post('https://dev364281.service-now.com/login.do', data=data)
r_nav = s.get('https://dev364281.service-now.com/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json', 'Content-Type': 'application/json'}

# Test creating a sample sc_request
req_payload = {
    'short_description': 'Service Request: Automated Operations Execution POC',
    'description': 'POC Service Request for Yantra Platform',
    'urgency': '2',
    'impact': '2'
}
r_req = s.post('https://dev364281.service-now.com/api/now/table/sc_request', headers=headers, json=req_payload)
print('sc_request status:', r_req.status_code)
if r_req.status_code in [200, 201]:
    req_res = r_req.json()['result']
    req_sys_id = req_res.get('sys_id')
    req_number = req_res.get('number')
    print('Created sc_request:', req_number, req_sys_id)
    
    # Test creating sc_req_item linked to this request
    ritm_payload = {
        'request': req_sys_id,
        'short_description': 'Restart Spooler Service on PRD-APP-SRV01',
        'description': 'Procedure: PROC-WIN-001 | Target: PRD-APP-SRV01 | Service: Spooler',
        'stage': 'request_approved',
        'state': '1' # Open
    }
    r_ritm = s.post('https://dev364281.service-now.com/api/now/table/sc_req_item', headers=headers, json=ritm_payload)
    print('sc_req_item status:', r_ritm.status_code)
    if r_ritm.status_code in [200, 201]:
        ritm_res = r_ritm.json()['result']
        print('Created sc_req_item:', ritm_res.get('number'), ritm_res.get('sys_id'))
    else:
        print('ritm error:', r_ritm.text[:300])
else:
    print('req error:', r_req.text[:300])
