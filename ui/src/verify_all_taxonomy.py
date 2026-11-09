from snow_config import SNOW_URL, AUTH_DATA
import requests
import re

s = requests.Session()
data = AUTH_DATA
s.post(f'{SNOW_URL}/login.do', data=data)
r_nav = s.get(f'{SNOW_URL}/navpage.do')
m_ck = re.search(r'g_ck\s*=\s*["\']([a-f0-9]+)["\']', r_nav.text, re.IGNORECASE)
token = m_ck.group(1)
headers = {'X-UserToken': token, 'Accept': 'application/json'}

# 1. Total taxonomy count
r_tax = s.get(f'{SNOW_URL}/api/now/stats/u_itsm_taxonomy?sysparm_count=true', headers=headers)
tax_count = r_tax.json().get('result', {}).get('stats', {}).get('count')

# 2. Sample from different categories
r_samples = s.get(f'{SNOW_URL}/api/now/table/u_itsm_taxonomy?sysparm_limit=5&sysparm_fields=u_category,u_subcategory,u_classification,u_ticket_type,u_support_group.name', headers=headers)

# 3. Workgroup counts per group
r_grps = s.get(f'{SNOW_URL}/api/now/table/sys_user_group?sysparm_query=nameINApplication Support,Email & Collaboration,End User Computing,Network Services,Server Infrastructure,Change Approvers&sysparm_fields=name,sys_id', headers=headers)
grp_stats = {}
for g in r_grps.json().get('result', []):
    r_m = s.get(f"{SNOW_URL}/api/now/stats/sys_user_grmember?sysparm_count=true&sysparm_query=group={g['sys_id']}", headers=headers)
    grp_stats[g['name']] = r_m.json().get('result', {}).get('stats', {}).get('count')

print("TAXONOMY_COUNT:", tax_count)
print("GROUP_STATS:", grp_stats)
print("SAMPLES:")
for sm in r_samples.json().get('result', []):
    print(" -", sm)
