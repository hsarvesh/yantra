import csv

with open(r'D:\dev\YASH\Yantra\ui\EMP_list.csv', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

emp_names = set(r['Employee Name'].strip() for r in rows)
emp_ids = set(r['user_id'].strip() for r in rows)
emp_emails = set(r['Email'].strip() for r in rows)

irms = set(r['IRM'].strip() for r in rows if r['IRM'].strip())
in_list = irms.intersection(emp_names)
not_in_list = irms - emp_names

print(f"Total employees: {len(rows)}")
print(f"Unique Employee Names: {len(emp_names)}")
print(f"Unique IRMs: {len(irms)}")
print(f"IRMs present in Employee List: {len(in_list)}")
print(f"IRMs NOT in Employee List: {len(not_in_list)}")
print(f"Sample IRMs not in list: {list(not_in_list)[:10]}")
