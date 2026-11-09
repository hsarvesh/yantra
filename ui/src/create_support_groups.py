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

groups = [
    {
        'name': 'End User Computing',
        'description': 'Support group responsible for workplace technology, workstations, peripherals, and end-user device support.'
    },
    {
        'name': 'Access Management',
        'description': 'Support group managing identity provisioning, account unlocks, role grants, and privilege requests.'
    },
    {
        'name': 'Email & Collaboration',
        'description': 'Support group managing Exchange, Microsoft 365, Teams, mail routing, and collaboration tools.'
    },
    {
        'name': 'Network Services',
        'description': 'Support group managing routers, switches, firewalls, VPN, DNS, DHCP, and corporate connectivity.'
    },
    {
        'name': 'Server Infrastructure',
        'description': 'Support group managing Windows and Linux physical and virtual server infrastructure, OS patching, and storage.'
    },
    {
        'name': 'Application Support',
        'description': 'Support group responsible for tier-2/3 business application maintenance, service restarts, and application incident triage.'
    },
    {
        'name': 'Cloud Services',
        'description': 'Support group managing cloud subscriptions, compute instances, Kubernetes clusters, and cloud storage.'
    },
    {
        'name': 'Security',
        'description': 'Support group managing cybersecurity operations, vulnerability management, security incident response, and access audits.'
    },
    {
        'name': 'Telephony',
        'description': 'Support group managing VoIP, PBX systems, telephony routing, SIP trunks, and call center headsets.'
    },
    {
        'name': 'Asset Management',
        'description': 'Support group managing hardware and software asset lifecycle, inventory tracking, licenses, and decommissioning.'
    },
    {
        'name': 'Monitoring & Operations',
        'description': 'Support group overseeing 24x7 infrastructure monitoring, synthetic checks, alert triage, and operations scheduling.'
    },
    {
        'name': 'Facilities IT',
        'description': 'Support group handling meeting room AV systems, badge access integration, datacenter facilities, and cabling.'
    }
]

# Get itil group type sys_id
r_types = s.get(f"{SNOW_URL}/api/now/table/sys_user_group_type?sysparm_query=name=itil", headers=headers)
itil_type_id = ''
if r_types.status_code == 200 and r_types.json().get('result'):
    itil_type_id = r_types.json()['result'][0]['sys_id']
    print("Found itil group type sys_id:", itil_type_id)

# Get itil role sys_id
r_role = s.get(f"{SNOW_URL}/api/now/table/sys_user_role?sysparm_query=name=itil", headers=headers)
itil_role_id = ''
if r_role.status_code == 200 and r_role.json().get('result'):
    itil_role_id = r_role.json()['result'][0]['sys_id']
    print("Found itil role sys_id:", itil_role_id)

print("\n--- Creating Support Groups in ServiceNow ---")
created_groups = []
for g in groups:
    # Check if exists
    chk_res = s.get(f"{SNOW_URL}/api/now/table/sys_user_group?sysparm_query=name={g['name']}", headers=headers)
    existing = chk_res.json().get('result', [])
    if existing:
        grp_id = existing[0]['sys_id']
        print(f"Group already exists: {g['name']} (sys_id: {grp_id})")
        created_groups.append({'name': g['name'], 'sys_id': grp_id, 'status': 'already_exists'})
    else:
        payload = {
            'name': g['name'],
            'description': g['description'],
            'active': 'true',
            'type': itil_type_id
        }
        create_res = s.post(f'{SNOW_URL}/api/now/table/sys_user_group', headers=headers, json=payload)
        if create_res.status_code in [200, 201]:
            grp_data = create_res.json()['result']
            grp_id = grp_data['sys_id']
            print(f"Created Group: {g['name']} (sys_id: {grp_id})")
            created_groups.append({'name': g['name'], 'sys_id': grp_id, 'status': 'created'})
            
            # Assign itil role to group
            if itil_role_id:
                role_payload = {
                    'group': grp_id,
                    'role': itil_role_id
                }
                s.post(f'{SNOW_URL}/api/now/table/sys_group_has_role', headers=headers, json=role_payload)
        else:
            print(f"Failed to create group {g['name']}: {create_res.status_code} {create_res.text[:100]}")

print(f"\nCompleted! Total processed: {len(created_groups)}")
