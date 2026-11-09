import csv

with open(r'D:\dev\YASH\Yantra\ui\EMP_list.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

non_yash = [r for r in rows if '@yash.com' not in r['Email'].lower()]
print('Non @yash.com count:', len(non_yash))
for r in non_yash:
    print(' -', r['user_id'], r['Employee Name'], '|', r['Email'])
