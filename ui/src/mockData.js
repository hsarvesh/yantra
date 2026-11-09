export const initialProcedures = [
  {
    id: 'PROC-WIN-001',
    name: 'Windows Service Clean Restart',
    category: 'Server Operations',
    version: '1.2.0',
    targetType: 'Windows Server',
    riskLevel: 'Medium',
    defaultExecutionMode: 'Supervised Automation',
    consecutiveSuccesses: 98,
    maturityState: 'supervised', // supervised, eligible, trusted, requalification
    owner: 'Infrastructure Engineering Team',
    serviceOwner: 'Alex Morgan (Service Owner)',
    rollbackSupported: true,
    rollbackScript: 'Start-Service -Name $ServiceName -ErrorAction Stop',
    scriptSnippet: '# Pre-check\n$svc = Get-Service -Name $ServiceName\nStop-Service -Name $ServiceName -Force\nStart-Sleep -Seconds 5\nStart-Service -Name $ServiceName\nGet-Service -Name $ServiceName | Select-Object Status, Name',
    inputs: [
      { name: 'TargetHost', type: 'String', mandatory: true, fromCMDB: true, example: 'PRD-APP-SRV01' },
      { name: 'ServiceName', type: 'String', mandatory: true, fromCMDB: false, example: 'W3SVC' },
      { name: 'RestartGraceSeconds', type: 'Integer', mandatory: false, fromCMDB: false, example: '15' }
    ]
  },
  {
    id: 'PROC-IAM-002',
    name: 'Active Directory User Account Unlock & Reset',
    category: 'Identity & Access',
    version: '2.1.0',
    targetType: 'Active Directory Domain Controller',
    riskLevel: 'High',
    defaultExecutionMode: 'Trusted Automation',
    consecutiveSuccesses: 100,
    maturityState: 'trusted',
    owner: 'IAM Security Operations',
    serviceOwner: 'Sarah Jenkins (IAM Owner)',
    rollbackSupported: false,
    rollbackScript: 'N/A (Irreversible Access Operation)',
    scriptSnippet: 'Unlock-ADAccount -Identity $UserPrincipalName\nSet-ADUser -Identity $UserPrincipalName -ChangePasswordAtLogon $true\nWrite-Output "User account unlocked successfully and flag set."',
    inputs: [
      { name: 'UserPrincipalName', type: 'Email', mandatory: true, fromCMDB: false, example: 'sarvesh.h@corp.yash.com' },
      { name: 'JustificationCode', type: 'Choice', mandatory: true, fromCMDB: false, example: 'INC-PASSWORD-FORGOT' }
    ]
  },
  {
    id: 'PROC-LNX-003',
    name: 'Linux Filesystem Clean & Log Truncate',
    category: 'Server Operations',
    version: '1.0.4',
    targetType: 'Linux Server (RHEL/Ubuntu)',
    riskLevel: 'Low',
    defaultExecutionMode: 'Supervised Automation',
    consecutiveSuccesses: 34,
    maturityState: 'supervised',
    owner: 'Linux Ops Team',
    serviceOwner: 'Alex Morgan (Service Owner)',
    rollbackSupported: true,
    rollbackScript: 'cp -r /var/log/archive_backup/* /var/log/',
    scriptSnippet: 'journalctl --vacuum-size=200M\nfind /var/log/app -name "*.log.gz" -mtime +14 -exec rm -f {} \\;\ndf -h /var/log',
    inputs: [
      { name: 'TargetHost', type: 'String', mandatory: true, fromCMDB: true, example: 'PRD-LNX-AP02' },
      { name: 'ThresholdPercent', type: 'Integer', mandatory: true, fromCMDB: false, example: '85' }
    ]
  },
  {
    id: 'PROC-DB-004',
    name: 'Oracle Database RMAN Backup Re-run',
    category: 'Database Operations',
    version: '1.1.0',
    targetType: 'Oracle Enterprise Server',
    riskLevel: 'Critical',
    defaultExecutionMode: 'Exception Mode',
    consecutiveSuccesses: 0,
    maturityState: 'requalification',
    owner: 'Database Administration Team',
    serviceOwner: 'David Zhang (DBA Lead)',
    rollbackSupported: false,
    rollbackScript: 'rman target / cmdfile=abort_backup.rcv',
    scriptSnippet: 'rman target / <<EOF\nRUN {\n  ALLOCATE CHANNEL ch1 DEVICE TYPE DISK;\n  BACKUP INCREMENTAL LEVEL 1 DATABASE PLUS ARCHIVELOG;\n  RELEASE CHANNEL ch1;\n}\nEOF',
    inputs: [
      { name: 'DatabaseSID', type: 'String', mandatory: true, fromCMDB: true, example: 'ORCLPRD' },
      { name: 'BackupType', type: 'Choice', mandatory: true, fromCMDB: false, example: 'Level-1 Incremental' }
    ]
  }
];

export const initialActiveRequests = [
  {
    ritm: 'RITM0010892',
    shortDescription: 'Restart Print Spooler and Web Service on PRD-APP-SRV01',
    procedureId: 'PROC-WIN-001',
    procedureName: 'Windows Service Clean Restart',
    requester: 'Johnathan Miller (IT Support Lead)',
    targetCi: 'PRD-APP-SRV01.corp.internal',
    status: 'Pending Engineer Approval',
    executionMode: 'Supervised Mode',
    businessApprovals: {
      requesterManager: { status: 'Approved', by: 'Robert Davis', at: '2026-11-04 14:15' },
      systemOwner: { status: 'Approved', by: 'Alex Morgan', at: '2026-11-04 14:32' },
      security: { status: 'Not Required', by: 'System Policy' },
      changeControl: { status: 'Approved (Std Change CHG00921)', by: 'ServiceNow CAB', at: '2026-11-04 14:40' }
    },
    engineerExecutionApproval: 'Pending',
    preValidations: {
      networkConnectivity: { pass: true, latency: '2ms (WinRM 5985)' },
      credentialVault: { pass: true, alias: 'VAULT-SVC-LOCALADMIN', masked: true },
      maintenanceWindow: { pass: true, window: 'Scheduled Standard Window (Daily 14:00-16:00 UTC)' },
      cmdbFacts: { pass: true, os: 'Windows Server 2022 Datacenter', cluster: 'PRD-CLUSTER-A' }
    },
    parameters: {
      TargetHost: 'PRD-APP-SRV01',
      ServiceName: 'Spooler',
      RestartGraceSeconds: '10'
    }
  },
  {
    ritm: 'RITM0010895',
    shortDescription: 'Active Directory User Unlock for finance contractor',
    procedureId: 'PROC-IAM-002',
    procedureName: 'Active Directory User Account Unlock & Reset',
    requester: 'Emily Watson (Finance Director)',
    targetCi: 'DC01.corp.internal',
    status: 'Ready for Trusted Execution',
    executionMode: 'Trusted Automation (Auto-Approved)',
    businessApprovals: {
      requesterManager: { status: 'Approved', by: 'Emily Watson', at: '2026-11-04 15:00' },
      systemOwner: { status: 'Approved', by: 'Sarah Jenkins', at: '2026-11-04 15:10' },
      security: { status: 'Approved (MFA Verified)', by: 'Okta Sec Policy', at: '2026-11-04 15:11' },
      changeControl: { status: 'Standard Policy Exception', by: 'Auto-CAB' }
    },
    engineerExecutionApproval: 'Auto-Approved by Trusted Governance',
    preValidations: {
      networkConnectivity: { pass: true, latency: '1ms (LDAPS 636)' },
      credentialVault: { pass: true, alias: 'VAULT-AD-DOMADMIN', masked: true },
      maintenanceWindow: { pass: true, window: '24x7 Standard Identity Operations' },
      cmdbFacts: { pass: true, os: 'Windows Server 2019 DC', cluster: 'CORP-AD-FOREST' }
    },
    parameters: {
      UserPrincipalName: 'claire.daniels@corp.yash.com',
      JustificationCode: 'INC-ACCOUNT-LOCKED'
    }
  }
];

export const executionNodes = [
  { id: 'MID-CUST-PROD-01', name: 'US-East Production MID Cluster Node 1', status: 'Online', version: 'Zurich Patch 10', activeThreads: 3, maxConcurrency: 10, uptime: '45d 12h' },
  { id: 'MID-CUST-PROD-02', name: 'US-East Production MID Cluster Node 2', status: 'Online', version: 'Zurich Patch 10', activeThreads: 1, maxConcurrency: 10, uptime: '45d 12h' },
  { id: 'MID-CUST-DMZ-01', name: 'Isolated Perimeter DMZ Execution Worker', status: 'Online', version: 'Zurich Patch 10', activeThreads: 0, maxConcurrency: 5, uptime: '12d 4h' }
];

export const bulkTargetServers = [
  { id: 'SRV-WIN-001', hostname: 'PRD-APP-SRV01', ip: '10.240.12.11', env: 'Production', os: 'Windows Server 2022', status: 'Healthy' },
  { id: 'SRV-WIN-002', hostname: 'PRD-APP-SRV02', ip: '10.240.12.12', env: 'Production', os: 'Windows Server 2022', status: 'Healthy' },
  { id: 'SRV-WIN-003', hostname: 'PRD-APP-SRV03', ip: '10.240.12.13', env: 'Production', os: 'Windows Server 2022', status: 'Healthy' },
  { id: 'SRV-WIN-004', hostname: 'STG-APP-SRV01', ip: '10.240.15.21', env: 'Staging', os: 'Windows Server 2022', status: 'Healthy' },
  { id: 'SRV-WIN-005', hostname: 'STG-APP-SRV02', ip: '10.240.15.22', env: 'Staging', os: 'Windows Server 2022', status: 'Healthy' }
];

export const initialAuditLogs = [
  {
    runId: 'RUN0009841',
    ritm: 'RITM0010880',
    procedureId: 'PROC-WIN-001',
    procedureName: 'Windows Service Clean Restart',
    target: 'PRD-APP-SRV02',
    engineer: 'Sarvesh Huddedar',
    mode: 'Supervised',
    counterBefore: 97,
    counterAfter: 98,
    result: 'Success',
    duration: '14.2s',
    timestamp: '2026-11-04 14:12:05',
    hash: 'SHA256:8f4c2b9a103e67...d491'
  },
  {
    runId: 'RUN0009840',
    ritm: 'RITM0010875',
    procedureId: 'PROC-IAM-002',
    procedureName: 'Active Directory User Account Unlock & Reset',
    target: 'DC01.corp.internal',
    engineer: 'Auto-Approved (Trusted Governance)',
    mode: 'Trusted',
    counterBefore: 100,
    counterAfter: 100,
    result: 'Success',
    duration: '4.8s',
    timestamp: '2026-11-04 13:45:18',
    hash: 'SHA256:3a1b9c8d7e6f50...a120'
  },
  {
    runId: 'RUN0009838',
    ritm: 'RITM0010862',
    procedureId: 'PROC-DB-004',
    procedureName: 'Oracle Database RMAN Backup Re-run',
    target: 'ORCLPRD01',
    engineer: 'David Zhang',
    mode: 'Supervised (Qualification Run 1)',
    counterBefore: 12,
    counterAfter: 0,
    result: 'REVOCATION TRIGGERED (Exit Code 255: RMAN-03002)',
    duration: '42.1s',
    timestamp: '2026-11-04 11:20:00',
    hash: 'SHA256:e0b74129ca4589...ff12'
  }
];
