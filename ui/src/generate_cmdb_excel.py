from snow_config import SNOW_URL, AUTH_DATA
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

EXCEL_PATH = r'D:\dev\YASH\Yantra\ui\Enterprise_CMDB_Inventory.xlsx'

def build_inventory():
    print("Generating Complete Enterprise CMDB Inventory dataset...")
    
    locations = [
        {'code': 'BLR', 'name': 'Bangalore', 'ip_prefix': '10.10'},
        {'code': 'PNE', 'name': 'Pune', 'ip_prefix': '10.20'},
        {'code': 'HYD', 'name': 'Hyderabad', 'ip_prefix': '10.30'},
        {'code': 'IND', 'name': 'Indore', 'ip_prefix': '10.40'},
        {'code': 'DEL', 'name': 'Delhi', 'ip_prefix': '10.50'},
    ]

    all_records = []
    servers_records = []
    db_app_records = []
    network_records = []
    eud_records = []
    facilities_records = []

    # ----------------------------------------------------
    # 1. Domain Controllers (10 total: BLR 001..004, PNE 005..009, BLR 010)
    # ----------------------------------------------------
    dc_configs = [
        ('BLR', 1), ('BLR', 2), ('BLR', 3), ('BLR', 4),
        ('PNE', 5), ('PNE', 6), ('PNE', 7), ('PNE', 8), ('PNE', 9),
        ('BLR', 10)
    ]
    for loc_code, num in dc_configs:
        loc_info = next(l for l in locations if l['code'] == loc_code)
        name = f"{loc_code}-DC-{num:03d}"
        rec = {
            'Name': name,
            'Class': 'cmdb_ci_win_server',
            'Category': 'Server',
            'Location': loc_info['name'],
            'Location Code': loc_code,
            'IP Address': f"{loc_info['ip_prefix']}.1.{num + 10}",
            'Subnet Mask': '255.255.255.0',
            'Manufacturer': 'Dell',
            'Model': 'PowerEdge R750',
            'Serial Number': f"SN-DC-{loc_code}-{num:04d}",
            'Operating System': 'Windows Server 2022 Datacenter',
            'Status': 'Installed',
            'Operational Status': 'Operational',
            'Support Group': 'Server Infrastructure',
            'Environment': 'Production',
            'Short Description': f"Enterprise Domain Controller ({loc_info['name']} Node {num})"
        }
        all_records.append(rec)
        servers_records.append(rec)

    # ----------------------------------------------------
    # 2. VMware Physical ESXi Servers (20 total: 12 in BLR 001..012, 8 in PNE 013..020)
    # ----------------------------------------------------
    vmw_configs = [('BLR', i) for i in range(1, 13)] + [('PNE', i) for i in range(13, 21)]
    for loc_code, num in vmw_configs:
        loc_info = next(l for l in locations if l['code'] == loc_code)
        name = f"{loc_code}-VMW-{num:03d}"
        rec = {
            'Name': name,
            'Class': 'cmdb_ci_esx_server',
            'Category': 'Server',
            'Location': loc_info['name'],
            'Location Code': loc_code,
            'IP Address': f"{loc_info['ip_prefix']}.2.{num + 10}",
            'Subnet Mask': '255.255.255.0',
            'Manufacturer': 'Dell',
            'Model': 'PowerEdge R840 (ESXi)',
            'Serial Number': f"SN-ESX-{loc_code}-{num:04d}",
            'Operating System': 'VMware ESXi 7.0 Update 3',
            'Status': 'Installed',
            'Operational Status': 'Operational',
            'Support Group': 'Server Infrastructure',
            'Environment': 'Production',
            'Short Description': f"VMware Physical Hypervisor Host ({loc_info['name']} Node {num})"
        }
        all_records.append(rec)
        servers_records.append(rec)

    # ----------------------------------------------------
    # 3. Virtual Machines (50 per location across 5 locations = 250 VMs)
    # ----------------------------------------------------
    vm_os_list = [
        ('Canonical', 'Ubuntu Linux 22.04 LTS', 'Linux VM Host'),
        ('Red Hat', 'Red Hat Enterprise Linux 9.2', 'RHEL Application Host'),
        ('Microsoft', 'Windows Server 2022 Datacenter', 'Windows Workload Host'),
        ('Canonical', 'Ubuntu Linux 24.04 LTS', 'Microservices Node')
    ]
    for loc in locations:
        loc_code = loc['code']
        loc_name = loc['name']
        prefix = loc['ip_prefix']
        for i in range(1, 51):
            name = f"{loc_code}-VM-{i:03d}"
            mfg, os_name, desc_type = vm_os_list[(i - 1) % len(vm_os_list)]
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_vm_instance',
                'Category': 'Virtualization',
                'Location': loc_name,
                'Location Code': loc_code,
                'IP Address': f"{prefix}.50.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': 'VMware',
                'Model': 'Virtual Machine (vSphere 7.0)',
                'Serial Number': f"VMWARE-{loc_code}-{i:04d}",
                'Operating System': os_name,
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Server Infrastructure',
                'Environment': 'Production',
                'Short Description': f"Virtual Guest Machine ({desc_type} {loc_name} #{i:02d})"
            }
            all_records.append(rec)
            servers_records.append(rec)

    # ----------------------------------------------------
    # 4. NetApp SAN Storage Arrays (2 per location = 10 SANs)
    # ----------------------------------------------------
    for loc in locations:
        loc_code = loc['code']
        loc_name = loc['name']
        prefix = loc['ip_prefix']
        for i in range(1, 3):
            name = f"{loc_code}-SAN-{i:03d}"
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_storage_server',
                'Category': 'Storage',
                'Location': loc_name,
                'Location Code': loc_code,
                'IP Address': f"{prefix}.5.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': 'NetApp',
                'Model': 'AFF A400 All-Flash SAN Storage Array',
                'Serial Number': f"SN-NTAP-{loc_code}-{i:04d}",
                'Operating System': 'NetApp ONTAP 9.12',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Server Infrastructure',
                'Environment': 'Production',
                'Short Description': f"NetApp All-Flash SAN Storage Controller ({loc_name} Controller #{i})"
            }
            all_records.append(rec)
            servers_records.append(rec)

    # ----------------------------------------------------
    # 5. Database Servers (60 total: BLR 16, PNE 16, HYD 12, IND 8, DEL 8)
    # ----------------------------------------------------
    db_distribution = [
        ('BLR', 16),
        ('PNE', 16),
        ('HYD', 12),
        ('IND', 8),
        ('DEL', 8)
    ]
    db_engines = [
        ('Microsoft', 'SQL Server 2022 Enterprise', 'MSSQL Database Server'),
        ('Oracle', 'Oracle Database 19c Enterprise', 'Oracle Database Instance'),
        ('PostgreSQL Global', 'PostgreSQL 16 High-Availability', 'PostgreSQL Cluster Node'),
        ('Oracle', 'MySQL Enterprise Edition 8.0', 'MySQL Database Host')
    ]
    for loc_code, db_count in db_distribution:
        loc_info = next(l for l in locations if l['code'] == loc_code)
        loc_name = loc_info['name']
        prefix = loc_info['ip_prefix']
        for i in range(1, db_count + 1):
            name = f"{loc_code}-DB-{i:03d}"
            mfg, engine, desc_type = db_engines[(i - 1) % len(db_engines)]
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_db_instance',
                'Category': 'Database',
                'Location': loc_name,
                'Location Code': loc_code,
                'IP Address': f"{prefix}.60.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': mfg,
                'Model': engine,
                'Serial Number': f"SN-DB-{loc_code}-{i:04d}",
                'Operating System': 'RHEL 9.2' if 'Oracle' in engine or 'Postgre' in engine else 'Windows Server 2022',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Application Support',
                'Environment': 'Production',
                'Short Description': f"Enterprise Database Server ({desc_type} {loc_name} #{i:02d})"
            }
            all_records.append(rec)
            db_app_records.append(rec)

    # ----------------------------------------------------
    # 6. Enterprise Applications (80 total: BLR 20, PNE 20, HYD 16, IND 12, DEL 12)
    # ----------------------------------------------------
    app_distribution = [
        ('BLR', 20),
        ('PNE', 20),
        ('HYD', 16),
        ('IND', 12),
        ('DEL', 12)
    ]
    app_catalog = [
        ('SAP', 'SAP S/4HANA ERP Core', 'Enterprise ERP Financials'),
        ('Salesforce', 'Salesforce Integration Gateway', 'CRM Cloud Connector'),
        ('Workday', 'Workday HRMS Sync Engine', 'Human Resources Sync'),
        ('YASH', 'Yantra Execution Platform', 'Automated Request Fulfilment Engine'),
        ('Microsoft', 'PowerBI Gateway Server', 'Enterprise Business Intelligence'),
        ('GitLab', 'GitLab Enterprise CI/CD Runner', 'DevOps Continuous Deployment'),
        ('Microsoft', 'Active Directory Federation (ADFS)', 'Identity & SSO Provider'),
        ('HashiCorp', 'Vault Enterprise Cluster', 'Secrets Management'),
        ('Kong', 'Enterprise API Gateway', 'Core API Proxy'),
        ('Elastic', 'Elasticsearch Logging Cluster', 'Distributed Log Search'),
    ]
    for loc_code, app_count in app_distribution:
        loc_info = next(l for l in locations if l['code'] == loc_code)
        loc_name = loc_info['name']
        prefix = loc_info['ip_prefix']
        for i in range(1, app_count + 1):
            name = f"{loc_code}-APP-{i:03d}"
            vendor, app_title, app_desc = app_catalog[(i - 1) % len(app_catalog)]
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_appl',
                'Category': 'Application',
                'Location': loc_name,
                'Location Code': loc_code,
                'IP Address': f"{prefix}.70.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': vendor,
                'Model': app_title,
                'Serial Number': f"APP-LIC-{loc_code}-{i:04d}",
                'Operating System': 'Linux (Containerized)' if i % 2 == 0 else 'Windows Server 2022',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Application Support',
                'Environment': 'Production',
                'Short Description': f"{app_title} - {app_desc} ({loc_name} Instance #{i:02d})"
            }
            all_records.append(rec)
            db_app_records.append(rec)

    # ----------------------------------------------------
    # 7. Network Devices across all 5 locations (295 total)
    # 4 Firewalls, 4 Routers, 20 Switches, 1 WLC, 30 APs = 59 per site * 5 = 295
    # ----------------------------------------------------
    for loc in locations:
        code = loc['code']
        prefix = loc['ip_prefix']
        loc_name = loc['name']

        # 4 Firewalls
        for i in range(1, 5):
            name = f"{code}-FW-{i:03d}"
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_ip_firewall',
                'Category': 'Network',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.10.{i}",
                'Subnet Mask': '255.255.255.240',
                'Manufacturer': 'Palo Alto Networks',
                'Model': 'PA-3220 Next-Gen Firewall',
                'Serial Number': f"SN-FW-{code}-{i:04d}",
                'Operating System': 'PAN-OS 10.2',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Network Services',
                'Environment': 'Production',
                'Short Description': f"Perimeter Next-Gen Firewall HA Node {i} ({loc_name})"
            }
            all_records.append(rec)
            network_records.append(rec)

        # 4 Routers
        for i in range(1, 5):
            name = f"{code}-RTR-{i:03d}"
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_ip_router',
                'Category': 'Network',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.10.{i + 10}",
                'Subnet Mask': '255.255.255.240',
                'Manufacturer': 'Cisco',
                'Model': 'Catalyst 8300 Edge Router',
                'Serial Number': f"SN-RTR-{code}-{i:04d}",
                'Operating System': 'Cisco IOS-XE 17.9',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Network Services',
                'Environment': 'Production',
                'Short Description': f"Core WAN Edge Router {i} ({loc_name})"
            }
            all_records.append(rec)
            network_records.append(rec)

        # 20 Switches
        for i in range(1, 21):
            name = f"{code}-SW-{i:03d}"
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_ip_switch',
                'Category': 'Network',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.20.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': 'Cisco',
                'Model': 'Catalyst 9300-48P PoE+ Switch',
                'Serial Number': f"SN-SW-{code}-{i:04d}",
                'Operating System': 'Cisco IOS-XE 17.6',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Network Services',
                'Environment': 'Production',
                'Short Description': f"Access Layer Switch {i} ({loc_name})"
            }
            all_records.append(rec)
            network_records.append(rec)

        # 1 WLC
        name = f"{code}-WLC-001"
        rec = {
            'Name': name,
            'Class': 'cmdb_ci_netgear',
            'Category': 'Network',
            'Location': loc_name,
            'Location Code': code,
            'IP Address': f"{prefix}.30.1",
            'Subnet Mask': '255.255.255.0',
            'Manufacturer': 'Cisco',
            'Model': 'Catalyst 9800-40 Wireless Controller',
            'Serial Number': f"SN-WLC-{code}-0001",
            'Operating System': 'Cisco IOS-XE 17.6',
            'Status': 'Installed',
            'Operational Status': 'Operational',
            'Support Group': 'Network Services',
            'Environment': 'Production',
            'Short Description': f"Central Wireless LAN Controller ({loc_name})"
        }
        all_records.append(rec)
        network_records.append(rec)

        # 30 Access Points
        for i in range(1, 31):
            name = f"{code}-AP-{i:03d}"
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_wap_network',
                'Category': 'Network',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.30.{i + 10}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': 'Cisco',
                'Model': 'Catalyst 9120AX Series Wi-Fi 6 AP',
                'Serial Number': f"SN-AP-{code}-{i:04d}",
                'Operating System': 'Capwap Lightweight AP',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Network Services',
                'Environment': 'Production',
                'Short Description': f"Indoor Wi-Fi 6 Access Point {i} ({loc_name})"
            }
            all_records.append(rec)
            network_records.append(rec)

    # ----------------------------------------------------
    # 8. End User Devices (2,000 total across 5 sites: 400 per site)
    # [LOC]-EUD-0001 .. [LOC]-EUD-0400
    # ----------------------------------------------------
    eud_sites = ['BLR', 'PNE', 'HYD', 'IND', 'DEL']
    eud_models = [
        ('Lenovo', 'ThinkPad T14 Gen 4', 'Laptop'),
        ('Dell', 'Latitude 5540', 'Laptop'),
        ('HP', 'EliteBook 840 G10', 'Laptop'),
        ('Dell', 'OptiPlex 7010 Micro', 'Desktop'),
    ]

    for loc_code in eud_sites:
        loc_info = next(l for l in locations if l['code'] == loc_code)
        prefix = loc_info['ip_prefix']
        loc_name = loc_info['name']

        for i in range(1, 401):
            name = f"{loc_code}-EUD-{i:04d}"
            mfg, model, dev_type = eud_models[(i - 1) % len(eud_models)]
            ip_third = 100 + ((i - 1) // 250)
            ip_fourth = ((i - 1) % 250) + 1
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_computer',
                'Category': 'End User Computing',
                'Location': loc_name,
                'Location Code': loc_code,
                'IP Address': f"{prefix}.{ip_third}.{ip_fourth}",
                'Subnet Mask': '255.255.252.0',
                'Manufacturer': mfg,
                'Model': model,
                'Serial Number': f"SN-EUD-{loc_code}-{i:04d}",
                'Operating System': 'Windows 11 Enterprise (64-bit)',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'End User Computing',
                'Environment': 'Production',
                'Short Description': f"Corporate {dev_type} ({loc_name} Workplace Device {i:03d})"
            }
            all_records.append(rec)
            eud_records.append(rec)

    # ----------------------------------------------------
    # 9. Facilities IT & Peripherals
    # 6 Printers, 8 Meeting Room Kits, 4 Smart UPS per location across 5 locations
    # Printers = 30, Meeting Rooms = 40, Smart UPS = 20 (Total = 90)
    # ----------------------------------------------------
    printer_models = [
        ('HP', 'LaserJet Enterprise Flow MFP M635', 'Black/White High-Speed Network MFD'),
        ('Canon', 'imageRUNNER ADVANCE DX C3835i', 'Color Multi-Function Printer'),
        ('Xerox', 'VersaLink C7020 Multifunction', 'Office Floor Departmental Printer')
    ]
    mtr_models = [
        ('Poly', 'Poly Studio X50 Video Bar & TC8', 'Executive Boardroom Video Conference Kit'),
        ('Cisco', 'Cisco Webex Room Kit Plus', 'Medium Meeting Room Video Endpoint'),
        ('Logitech', 'Rally Plus Teams Room Kit', 'Conference Room Audio/Video Solution')
    ]

    for loc in locations:
        code = loc['code']
        prefix = loc['ip_prefix']
        loc_name = loc['name']

        # 6 Network Printers / MFDs per location
        for i in range(1, 7):
            name = f"{code}-PRN-{i:03d}"
            mfg, model, p_desc = printer_models[(i - 1) % len(printer_models)]
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_printer',
                'Category': 'Peripherals',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.80.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': mfg,
                'Model': model,
                'Serial Number': f"SN-PRN-{code}-{i:04d}",
                'Operating System': 'Printer Firmware v4.8',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Facilities IT',
                'Environment': 'Production',
                'Short Description': f"{p_desc} ({loc_name} Floor Device #{i})"
            }
            all_records.append(rec)
            facilities_records.append(rec)

        # 8 Meeting Room Kits per location
        for i in range(1, 9):
            name = f"{code}-MTR-{i:03d}"
            mfg, model, m_desc = mtr_models[(i - 1) % len(mtr_models)]
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_comm',
                'Category': 'Telephony & Collaboration',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.85.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': mfg,
                'Model': model,
                'Serial Number': f"SN-MTR-{code}-{i:04d}",
                'Operating System': 'Teams Room OS 5.1 / Android AOSP',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Telephony',
                'Environment': 'Production',
                'Short Description': f"{m_desc} ({loc_name} Room #{i})"
            }
            all_records.append(rec)
            facilities_records.append(rec)

        # 4 Smart UPS per location
        for i in range(1, 5):
            name = f"{code}-UPS-{i:03d}"
            rec = {
                'Name': name,
                'Class': 'cmdb_ci_ups',
                'Category': 'Facilities IT',
                'Location': loc_name,
                'Location Code': code,
                'IP Address': f"{prefix}.90.{i}",
                'Subnet Mask': '255.255.255.0',
                'Manufacturer': 'Schneider Electric / APC',
                'Model': 'Smart-UPS RT 10kVA On-Line Power Backup',
                'Serial Number': f"SN-UPS-{code}-{i:04d}",
                'Operating System': 'NMC3 Network Management Firmware 2.5',
                'Status': 'Installed',
                'Operational Status': 'Operational',
                'Support Group': 'Facilities IT',
                'Environment': 'Production',
                'Short Description': f"Smart Uninterruptible Power Supply ({loc_name} Rack #{i})"
            }
            all_records.append(rec)
            facilities_records.append(rec)

    print(f"\nTotal CIs generated: {len(all_records)}")
    print(f" - Servers & Virtualization: {len(servers_records)} (10 DC, 20 ESXi, 250 VM, 10 SAN)")
    print(f" - Databases & Applications: {len(db_app_records)} (60 DB, 80 Apps)")
    print(f" - Network Infrastructure: {len(network_records)} (20 FW, 20 RTR, 100 SW, 5 WLC, 150 AP)")
    print(f" - End User Devices: {len(eud_records)} (2000 Workplace Laptops & Desktops)")
    print(f" - Facilities & Peripherals: {len(facilities_records)} (30 Printers, 40 Meeting Kits, 20 Smart UPS)")

    # Create Excel Workbook
    wb = openpyxl.Workbook()
    wb.remove(wb.active) # Remove default sheet

    headers = [
        'Name', 'Class', 'Category', 'Location', 'Location Code',
        'IP Address', 'Subnet Mask', 'Manufacturer', 'Model',
        'Serial Number', 'Operating System', 'Status', 'Operational Status',
        'Support Group', 'Environment', 'Short Description'
    ]

    header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='0284C7', end_color='0284C7', fill_type='solid') # ServiceNow Blue
    row_font = Font(name='Segoe UI', size=10)
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    def write_sheet(sheet_title, records, custom_header_color=None):
        ws = wb.create_sheet(title=sheet_title)
        fill = PatternFill(start_color=custom_header_color, end_color=custom_header_color, fill_type='solid') if custom_header_color else header_fill
        
        # Write headers
        for col_idx, h in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=h)
            cell.font = header_font
            cell.fill = fill
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.border = thin_border
        ws.row_dimensions[1].height = 28

        # Write data rows
        for row_idx, rec in enumerate(records, 2):
            for col_idx, h in enumerate(headers, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=rec.get(h, ''))
                cell.font = row_font
                cell.border = thin_border
                if h in ['Name', 'Serial Number', 'IP Address']:
                    cell.alignment = Alignment(horizontal='left', vertical='center')
                elif h in ['Class', 'Status', 'Operational Status', 'Location Code']:
                    cell.alignment = Alignment(horizontal='center', vertical='center')
                else:
                    cell.alignment = Alignment(horizontal='left', vertical='center')
            ws.row_dimensions[row_idx].height = 20

        # Adjust column widths
        for col_idx, h in enumerate(headers, 1):
            max_len = max(len(str(h)), max((len(str(r.get(h, ''))) for r in records[:100]), default=10))
            col_letter = get_column_letter(col_idx)
            ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 40)
        
        ws.freeze_panes = 'A2'

    # Write Category Sheets
    write_sheet('All_CMDB_Inventory', all_records, '0284C7')           # Blue
    write_sheet('Servers_Virtualization', servers_records, '3730A3')    # Indigo
    write_sheet('Databases_Applications', db_app_records, '7C3AED')    # Purple
    write_sheet('Network_Devices', network_records, '047857')          # Emerald
    write_sheet('End_User_Devices', eud_records, 'D97706')             # Amber
    write_sheet('Facilities_Peripherals', facilities_records, 'BE185D') # Pink/Rose

    # Create Summary Sheet
    ws_sum = wb.create_sheet(title='CMDB_Summary_Metrics', index=0)
    sum_header_font = Font(name='Segoe UI', size=14, bold=True, color='0F172A')
    ws_sum.cell(row=2, column=2, value="Enterprise CMDB Inventory Summary").font = sum_header_font
    ws_sum.cell(row=3, column=2, value="Configured for ServiceNow Instance Enterprise (Total CIs: 2,815)").font = Font(name='Segoe UI', size=11, color='64748B')

    metrics_headers = ['Device / CI Category', 'Target ServiceNow Table', 'Count', 'Primary Distribution', 'Assigned Support Group']
    for col_idx, h in enumerate(metrics_headers, 2):
        cell = ws_sum.cell(row=5, column=col_idx, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center')
    ws_sum.row_dimensions[5].height = 26

    summary_rows = [
        ('Domain Controllers', 'cmdb_ci_win_server', len(dc_configs), 'Bangalore (5), Pune (5)', 'Server Infrastructure'),
        ('VMware Physical Hosts (ESXi)', 'cmdb_ci_esx_server', len(vmw_configs), 'Bangalore (12), Pune (8)', 'Server Infrastructure'),
        ('Virtual Machines (Guest OS)', 'cmdb_ci_vm_instance', 250, '50 per site across BLR, PNE, HYD, IND, DEL', 'Server Infrastructure'),
        ('NetApp All-Flash SAN Storage', 'cmdb_ci_storage_server', 10, '2 per site across BLR, PNE, HYD, IND, DEL', 'Server Infrastructure'),
        ('Enterprise Database Servers', 'cmdb_ci_db_instance', 60, 'BLR (16), PNE (16), HYD (12), IND (8), DEL (8)', 'Application Support'),
        ('Enterprise Applications', 'cmdb_ci_appl', 80, 'BLR (20), PNE (20), HYD (16), IND (12), DEL (12)', 'Application Support'),
        ('Perimeter Firewalls', 'cmdb_ci_ip_firewall', 20, '4 per site across BLR, PNE, HYD, IND, DEL', 'Network Services'),
        ('Core Edge Routers', 'cmdb_ci_ip_router', 20, '4 per site across BLR, PNE, HYD, IND, DEL', 'Network Services'),
        ('Access Layer Switches', 'cmdb_ci_ip_switch', 100, '20 per site across BLR, PNE, HYD, IND, DEL', 'Network Services'),
        ('Wireless LAN Controllers (WLC)', 'cmdb_ci_netgear', 5, '1 per site across BLR, PNE, HYD, IND, DEL', 'Network Services'),
        ('Wi-Fi 6 Access Points (AP)', 'cmdb_ci_wap_network', 150, '30 per site across BLR, PNE, HYD, IND, DEL', 'Network Services'),
        ('End User Workplace Devices', 'cmdb_ci_computer', 2000, '400 per site across BLR, PNE, HYD, IND, DEL', 'End User Computing'),
        ('Network Printers / MFDs', 'cmdb_ci_printer', 30, '6 per site across BLR, PNE, HYD, IND, DEL', 'Facilities IT'),
        ('Meeting Room Collaboration Kits', 'cmdb_ci_comm', 40, '8 per site across BLR, PNE, HYD, IND, DEL', 'Telephony'),
        ('Smart Datacenter UPS Power', 'cmdb_ci_ups', 20, '4 per site across BLR, PNE, HYD, IND, DEL', 'Facilities IT'),
        ('TOTAL CONFIGURATION ITEMS (CIs)', 'cmdb_ci (All Tables)', len(all_records), 'All 5 Enterprise Locations (India)', '100% Fully Mapped')
    ]

    for row_idx, r in enumerate(summary_rows, 6):
        is_total = (row_idx == 6 + len(summary_rows) - 1)
        r_font = Font(name='Segoe UI', size=10, bold=is_total, color='0F172A')
        r_fill = PatternFill(start_color='E2E8F0' if is_total else 'FFFFFF', end_color='E2E8F0' if is_total else 'FFFFFF', fill_type='solid')

        for col_idx, val in enumerate(r, 2):
            cell = ws_sum.cell(row=row_idx, column=col_idx, value=val)
            cell.font = r_font
            cell.fill = r_fill
            cell.border = thin_border
            if col_idx == 4: # Count
                cell.alignment = Alignment(horizontal='center', vertical='center')
            else:
                cell.alignment = Alignment(horizontal='left', vertical='center')
        ws_sum.row_dimensions[row_idx].height = 24

    for col_idx in range(2, 7):
        col_letter = get_column_letter(col_idx)
        ws_sum.column_dimensions[col_letter].width = 34

    wb.save(EXCEL_PATH)
    print(f"Successfully generated: {EXCEL_PATH}")

if __name__ == '__main__':
    build_inventory()
