from snow_config import SNOW_URL, AUTH_DATA
import openpyxl

wb = openpyxl.load_workbook(r'D:\dev\YASH\Yantra\ui\Enterprise_ITSM_Taxonomy.xlsx', data_only=True)

# 1. Inspect Sheet: ITSM Taxonomy
tax_sheet = wb['ITSM Taxonomy']
tax_rows = list(tax_sheet.iter_rows(values_only=True))
tax_header = tax_rows[0]
tax_data = tax_rows[1:]

categories = set(r[0] for r in tax_data if r[0])
subcategories = set(r[1] for r in tax_data if r[1])
classifications = set(r[2] for r in tax_data if r[2])
ticket_types = set(r[3] for r in tax_data if r[3])
support_groups = set(r[4] for r in tax_data if r[4])

print("=== ITSM Taxonomy Sheet ===")
print("Total rows:", len(tax_data))
print("Unique Categories:", len(categories), sorted(categories))
print("Unique Subcategories:", len(subcategories))
print("Unique Classifications:", sorted(classifications))
print("Unique TicketTypes:", sorted(ticket_types))
print("Unique SupportGroups referenced:", len(support_groups), sorted(support_groups))

# 2. Inspect Sheet: Workgroups
wg_sheet = wb['Workgroups']
wg_rows = list(wg_sheet.iter_rows(values_only=True))
wg_header = wg_rows[0]
wg_data = wg_rows[1:]

wg_users = [r for r in wg_data if r[0]]
wg_groups = set(r[7] for r in wg_users if r[7])
change_approvers = [r for r in wg_users if str(r[8]).lower() == 'yes']

print("\n=== Workgroups Sheet ===")
print("Total rows:", len(wg_users))
print("Unique SupportGroups:", sorted(wg_groups))
print("Total Change Approvers:", len(change_approvers))
print("Sample Change Approvers:", [(r[0], r[1], r[7]) for r in change_approvers[:5]])
