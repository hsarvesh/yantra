from snow_config import SNOW_URL, AUTH_DATA
import requests
import re


s = requests.Session()
s.post(f'{SNOW_URL}/login.do', data=AUTH_DATA)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text)
token = m.group(1)
s.headers.update({'X-UserToken': token, 'Accept': 'application/json'})

tables = [
    ('cmdb_ci_win_server', 'Domain Controllers'),
    ('cmdb_ci_esx_server', 'VMware ESXi Hosts'),
    ('cmdb_ci_vm_instance', 'Virtual Machines'),
    ('cmdb_ci_storage_server', 'NetApp SAN Arrays'),
    ('cmdb_ci_db_instance', 'Database Instances'),
    ('cmdb_ci_appl', 'Enterprise Applications'),
    ('cmdb_ci_ip_firewall', 'Firewalls'),
    ('cmdb_ci_ip_router', 'Routers'),
    ('cmdb_ci_ip_switch', 'Switches'),
    ('cmdb_ci_netgear', 'WLCs'),
    ('cmdb_ci_wap_network', 'Access Points'),
    ('cmdb_ci_computer', 'End User Devices'),
    ('cmdb_ci_printer', 'Network Printers'),
    ('cmdb_ci_comm', 'Meeting Room Kits'),
    ('cmdb_ci_ups', 'Smart UPS')
]

print("=== ServiceNow Live CMDB CI Counts for Imported Inventory ===")
total_verified = 0
for tbl, label in tables:
    query = 'nameSTARTSWITHBLR^ORnameSTARTSWITHPNE^ORnameSTARTSWITHHYD^ORnameSTARTSWITHIND^ORnameSTARTSWITHDEL'
    r = s.get(f'{SNOW_URL}/api/now/stats/{tbl}?sysparm_count=true&sysparm_query={query}')
    res = r.json().get('result', {}).get('stats', {})
    cnt = int(res.get('count', 0))
    total_verified += cnt
    print(f" - {label:<28} ({tbl:<22}): {cnt:>5}")

print("-------------------------------------------------------------")
print(f"Total Imported CIs Verified in ServiceNow: {total_verified}")

# Check sample linkages (location and support group references)
print("\nSample CI Verification (Checking location & support group reference):")
r_sample = s.get(f'{SNOW_URL}/api/now/table/cmdb_ci?sysparm_limit=3&sysparm_fields=name,sys_class_name,location.name,support_group.name,ip_address,serial_number&sysparm_query=nameSTARTSWITHBLR-DC^ORnameSTARTSWITHBLR-SAN')
for ci in r_sample.json().get('result', []):
    print(f"CI: {ci.get('name')} | Class: {ci.get('sys_class_name')} | Loc: {ci.get('location.name')} | Group: {ci.get('support_group.name')} | IP: {ci.get('ip_address')}")
