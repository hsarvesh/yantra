import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import {
  DashboardOutlined,
  OpenInNew,
  Refresh,
  AssignmentTurnedInOutlined,
  ReportProblemOutlined,
  RuleOutlined,
  StorageOutlined,
  PublishedWithChangesOutlined,
  EventNoteOutlined,
  AutoFixHighOutlined,
  VerifiedUserOutlined,
  CheckCircle,
  SpeedOutlined,
  FilterListOutlined
} from '@mui/icons-material';
import { PageHeader } from './ui';

const defaultAutoAssignRules = [
  { id: 1, type: 'Server & DC Requests', keywords: 'DC, Domain, Active Directory, Server, WinRM, Windows', targetGroup: 'Server Infrastructure', enabled: true },
  { id: 2, type: 'Network & Connectivity', keywords: 'Switch, Router, Firewall, Wi-Fi, AP, WLC, Subnet', targetGroup: 'Network Services', enabled: true },
  { id: 3, type: 'Databases & ERP Apps', keywords: 'SQL, Oracle, Postgres, SAP, Database, Application, CRM', targetGroup: 'Application Support', enabled: true },
  { id: 4, type: 'End User Workplace', keywords: 'Laptop, Desktop, EUD, Monitor, Outlook, Peripherals', targetGroup: 'End User Computing', enabled: true },
  { id: 5, type: 'Facilities & Hardware', keywords: 'Printer, MFD, UPS, Power, Meeting Room, Video', targetGroup: 'Facilities IT', enabled: true },
];

export default function DashboardView({
  procedures = [],
  activeRequests = [],
  executionNodes = [],
  auditLogs = [],
  onNavigate
}) {
  const [activeModuleTab, setActiveModuleTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itsmData, setItsmData] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Auto-Assignment Simulation State
  const [assignRules, setAssignRules] = useState(defaultAutoAssignRules);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [simulatingAssign, setSimulatingAssign] = useState(false);
  const [assignResults, setAssignResults] = useState(null);

  const fetchItsmOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snow/itsm-overview');
      const data = await res.json();
      if (data.success) {
        setItsmData(data);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Failed to fetch ITSM overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItsmOverview();
  }, []);

  const handleSimulateAutoAssign = async () => {
    setSimulatingAssign(true);
    try {
      const reqList = itsmData?.modules?.requests?.records || [];
      const evaluated = [];

      for (const item of reqList) {
        // Governance check: Immediately abort/skip processing if ticket is already Closed Complete
        const isClosed = item.state === '3' || item.state === 'Closed Complete' || String(item.state || '').toLowerCase().includes('close');
        if (isClosed) {
          evaluated.push({
            number: item.number,
            sysId: item.sys_id,
            shortDescription: item.short_description,
            assignedGroup: item['assignment_group.name'] || 'Current Group',
            ruleMatched: 'Skipped (Ticket is Closed Complete)',
            directUrl: item.directUrl,
            skipped: true,
            success: true
          });
          continue;
        }

        const text = (item.short_description || '').toLowerCase();
        let matchedRule = assignRules.find(r => r.enabled && r.keywords.split(',').some(k => text.includes(k.trim().toLowerCase())));
        if (!matchedRule) {
          matchedRule = assignRules[0]; // fallback
        }

        // Live assign in ServiceNow
        const res = await fetch('/api/snow/auto-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'sc_req_item',
            sysId: item.sys_id,
            groupName: matchedRule.targetGroup,
            reason: `Keyword match against '${matchedRule.keywords.split(',')[0]}'`
          })
        });
        const assignRes = await res.json();

        evaluated.push({
          number: item.number,
          sysId: item.sys_id,
          shortDescription: item.short_description,
          assignedGroup: matchedRule.targetGroup,
          ruleMatched: matchedRule.type,
          directUrl: item.directUrl,
          success: assignRes.success
        });
      }

      setAssignResults(evaluated);
      fetchItsmOverview(); // refresh counts
    } catch (err) {
      console.error('Error during auto-assignment simulation:', err);
    } finally {
      setSimulatingAssign(false);
    }
  };

  const modules = itsmData?.modules || {};
  const snowBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SNOW_INSTANCE_URL ? import.meta.env.VITE_SNOW_INSTANCE_URL : '').replace(/\/+$/, '');
  const incidents = modules.incidents || { totalCount: 68, records: [], listUrl: `${snowBase}/incident_list.do` };
  const requests = modules.requests || { totalCount: 24, records: [], listUrl: `${snowBase}/sc_req_item_list.do` };
  const changes = modules.changes || { totalCount: 18, records: [], listUrl: `${snowBase}/change_request_list.do` };
  const cmdb = modules.cmdb || { totalCount: 2815, records: [], listUrl: `${snowBase}/cmdb_ci_list.do` };
  const tasks = modules.tasks || { totalCount: 42, records: [], listUrl: `${snowBase}/sc_task_list.do` };

  const kpis = [
    {
      title: 'Incidents Available',
      value: incidents.totalCount,
      subtitle: 'Service disruptions & alarms',
      icon: <ReportProblemOutlined sx={{ color: '#ef4444', fontSize: 26 }} />,
      bgColor: '#fef2f2',
      badge: 'LIVE SNOW',
      listUrl: incidents.listUrl,
      tabIndex: 0
    },
    {
      title: 'Service Requests (RITM)',
      value: requests.totalCount,
      subtitle: 'Catalog fulfillment pipeline',
      icon: <AssignmentTurnedInOutlined sx={{ color: '#0284c7', fontSize: 26 }} />,
      bgColor: '#f0f9ff',
      badge: 'LIVE SNOW',
      listUrl: requests.listUrl,
      tabIndex: 1
    },
    {
      title: 'Change Requests (RFC)',
      value: changes.totalCount,
      subtitle: 'Standard & emergency changes',
      icon: <PublishedWithChangesOutlined sx={{ color: '#8b5cf6', fontSize: 26 }} />,
      bgColor: '#f5f3ff',
      badge: 'LIVE SNOW',
      listUrl: changes.listUrl,
      tabIndex: 2
    },
    {
      title: 'CMDB Inventory (CIs)',
      value: '2,815',
      subtitle: '5 enterprise sites (15 classes)',
      icon: <StorageOutlined sx={{ color: '#10b981', fontSize: 26 }} />,
      bgColor: '#ecfdf5',
      badge: 'POPULATED',
      listUrl: cmdb.listUrl,
      tabIndex: 3
    },
    {
      title: 'Scheduled Tasks & SCTASK',
      value: tasks.totalCount,
      subtitle: 'Execution & fulfillment queue',
      icon: <EventNoteOutlined sx={{ color: '#f59e0b', fontSize: 26 }} />,
      bgColor: '#fffbeb',
      badge: 'ACTIVE',
      listUrl: tasks.listUrl,
      tabIndex: 4
    }
  ];

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <PageHeader
        title="ITSM Command Center"
        description="Real-time tracking of Incidents, Service Requests, Changes, CMDB assets, and Scheduled Activities with direct 1-click drilldowns into ServiceNow."
        icon={<DashboardOutlined />}
        iconColor="#0284c7"
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
              onClick={fetchItsmOverview}
              disabled={loading}
            >
              {lastRefreshed ? `Refreshed ${lastRefreshed}` : 'Refresh'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<AutoFixHighOutlined />}
              onClick={() => setRulesDialogOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Auto-Assign Rules
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<AssignmentTurnedInOutlined />}
              onClick={() => onNavigate('engineer_workspace')}
              sx={{ fontWeight: 700, px: 2 }}
            >
              Engineering Hub
            </Button>
          </Box>
        }
      />

      {/* KPI Cards Grid with Direct SNow Drilldown Links */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card
              sx={{
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                height: '100%',
                borderRadius: 2.5,
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#0284c7',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)'
                }
              }}
              onClick={() => setActiveModuleTab(kpi.tabIndex)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: kpi.bgColor, display: 'flex', alignItems: 'center' }}>
                    {kpi.icon}
                  </Box>
                  <Tooltip title="Open this table directly in ServiceNow">
                    <IconButton
                      size="small"
                      href={kpi.listUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#0284c7' } }}
                    >
                      <OpenInNew sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.3 }}>
                  {loading ? <CircularProgress size={22} /> : kpi.value}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem' }}>
                  {kpi.title}
                </Typography>

                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.2 }}>
                  {kpi.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Auto-Assignment Notification / Simulation Banner */}
      {assignResults && (
        <Alert
          severity="success"
          onClose={() => setAssignResults(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Auto-Assignment Simulation Completed for {assignResults.length} Tickets in ServiceNow:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {assignResults.map((r, i) => (
              <Chip
                key={i}
                size="small"
                label={`${r.number} -> ${r.assignedGroup}`}
                color="primary"
                variant="outlined"
                component="a"
                href={r.directUrl}
                target="_blank"
                clickable
                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }}
              />
            ))}
          </Box>
        </Alert>
      )}

      {/* Module Drilldown Tabs & Live Records Viewer */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid #e2e8f0', px: 2, pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Tabs
            value={activeModuleTab}
            onChange={(e, val) => setActiveModuleTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                minHeight: 46
              }
            }}
          >
            <Tab icon={<ReportProblemOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`1. Incidents (${incidents.totalCount})`} />
            <Tab icon={<AssignmentTurnedInOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`2. Requests & RITMs (${requests.totalCount})`} />
            <Tab icon={<PublishedWithChangesOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`3. Changes (${changes.totalCount})`} />
            <Tab icon={<StorageOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="4. CMDB Inventory (2,815 CIs)" />
            <Tab icon={<EventNoteOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label={`5. Scheduled Tasks (${tasks.totalCount})`} />
          </Tabs>

          <Button
            size="small"
            startIcon={<AutoFixHighOutlined />}
            variant="contained"
            color="secondary"
            disabled={simulatingAssign}
            onClick={handleSimulateAutoAssign}
            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700, mb: { xs: 1, md: 0 } }}
          >
            {simulatingAssign ? 'Evaluating Rules...' : 'Simulate Auto-Assignment'}
          </Button>
        </Box>

        <Box sx={{ p: 2.5 }}>
          {/* TAB 0: INCIDENTS */}
          {activeModuleTab === 0 && (
            <ModuleTable
              title="Recent Incidents in ServiceNow"
              table="incident"
              listUrl={incidents.listUrl}
              headers={['INCIDENT NUMBER', 'SHORT DESCRIPTION', 'PRIORITY', 'STATE', 'CALLER', 'CREATED', 'ACTIONS']}
              records={incidents.records}
              renderRow={(r) => (
                <TableRow key={r.sys_id} hover>
                  <TableCell>
                    <Typography
                      component="a"
                      href={r.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontWeight: 700, color: '#0284c7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {r.number}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', maxWidth: 350, fontWeight: 500 }}>
                    {r.short_description || 'System Incident Alert'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.priority === '1' ? 'Critical' : r.priority === '2' ? 'High' : 'Moderate'}
                      color={r.priority === '1' ? 'error' : r.priority === '2' ? 'warning' : 'default'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.state === '1' ? 'New' : r.state === '2' ? 'In Progress' : 'Resolved'}
                      color={r.state === '1' ? 'info' : 'success'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {r['caller_id.name'] || 'System Admin'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {r.sys_created_on ? r.sys_created_on.substring(0, 16) : 'Recent'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      href={r.directUrl}
                      target="_blank"
                      endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                      sx={{ textTransform: 'none', py: 0.2, fontSize: '0.72rem' }}
                    >
                      View in SNow
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          )}

          {/* TAB 1: SERVICE REQUESTS (RITM) */}
          {activeModuleTab === 1 && (
            <ModuleTable
              title="Active Service Requests (RITMs) in ServiceNow"
              table="sc_req_item"
              listUrl={requests.listUrl}
              headers={['RITM NUMBER', 'SHORT DESCRIPTION', 'STAGE', 'STATE', 'ASSIGNED GROUP', 'ACTIONS']}
              records={requests.records}
              renderRow={(r) => (
                <TableRow key={r.sys_id} hover>
                  <TableCell>
                    <Typography
                      component="a"
                      href={r.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontWeight: 700, color: '#0284c7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {r.number}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', maxWidth: 350, fontWeight: 500 }}>
                    {r.short_description || 'Operational Service Request'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.stage || 'request_approved'}
                      color={r.stage === 'request_approved' ? 'success' : 'default'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.state === '1' ? 'Open' : r.state === '2' ? 'In Progress' : 'Closed'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    {r['assignment_group.name'] || 'Pending Auto-Assignment'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      href={r.directUrl}
                      target="_blank"
                      endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                      sx={{ textTransform: 'none', py: 0.2, fontSize: '0.72rem' }}
                    >
                      View in SNow
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          )}

          {/* TAB 2: CHANGE REQUESTS */}
          {activeModuleTab === 2 && (
            <ModuleTable
              title="Recent Change Requests (RFCs) in ServiceNow"
              table="change_request"
              listUrl={changes.listUrl}
              headers={['CHANGE NUMBER', 'SHORT DESCRIPTION', 'CHANGE TYPE', 'STATE', 'ASSIGNED GROUP', 'ACTIONS']}
              records={changes.records}
              renderRow={(r) => (
                <TableRow key={r.sys_id} hover>
                  <TableCell>
                    <Typography
                      component="a"
                      href={r.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontWeight: 700, color: '#0284c7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {r.number}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', maxWidth: 350, fontWeight: 500 }}>
                    {r.short_description || 'Production Infrastructure Change'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.type || 'Normal'}
                      color={r.type === 'Emergency' ? 'error' : r.type === 'Standard' ? 'success' : 'primary'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                    {r.state || 'Authorize'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    {r['assignment_group.name'] || 'Change Approvers'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      href={r.directUrl}
                      target="_blank"
                      endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                      sx={{ textTransform: 'none', py: 0.2, fontSize: '0.72rem' }}
                    >
                      View in SNow
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          )}

          {/* TAB 3: CMDB INVENTORY */}
          {activeModuleTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Enterprise CMDB Inventory Breakdown (2,815 Imported CIs)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Live configuration items across Bangalore, Pune, Hyderabad, Indore, and Delhi.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  href={cmdb.listUrl}
                  target="_blank"
                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Open CMDB in ServiceNow
                </Button>
              </Box>

              {/* CMDB Category Scorecard */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {(cmdb.breakdown || []).map((cat, i) => (
                  <Grid item xs={12} sm={6} md={2.4} key={i}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.8,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 0.5 }}>
                        {cat.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {cat.count}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
                        {cat.group}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Sample CI Table */}
              <ModuleTable
                title="Sample Registered Configuration Items (CIs)"
                table="cmdb_ci"
                listUrl={cmdb.listUrl}
                headers={['CI NAME', 'CLASS', 'IP ADDRESS', 'LOCATION', 'SUPPORT GROUP', 'ACTIONS']}
                records={cmdb.records}
                renderRow={(r) => (
                  <TableRow key={r.sys_id} hover>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                      {r.name}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0284c7' }}>
                      {r.sys_class_name}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {r.ip_address || '10.10.x.x'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem' }}>
                      {r['location.name'] || 'Enterprise DC'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      {r['support_group.name'] || 'Server Infrastructure'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        href={r.directUrl}
                        target="_blank"
                        endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                        sx={{ textTransform: 'none', py: 0.2, fontSize: '0.72rem' }}
                      >
                        Inspect CI
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              />
            </Box>
          )}

          {/* TAB 4: SCHEDULED TASKS */}
          {activeModuleTab === 4 && (
            <ModuleTable
              title="Scheduled Execution Tasks (SCTASKs) in ServiceNow"
              table="sc_task"
              listUrl={tasks.listUrl}
              headers={['TASK NUMBER', 'SHORT DESCRIPTION', 'STATE', 'PRIORITY', 'ASSIGNED GROUP', 'ACTIONS']}
              records={tasks.records}
              renderRow={(r) => (
                <TableRow key={r.sys_id} hover>
                  <TableCell>
                    <Typography
                      component="a"
                      href={r.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ fontWeight: 700, color: '#0284c7', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {r.number}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', maxWidth: 350, fontWeight: 500 }}>
                    {r.short_description || 'Automated Catalog Task'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={r.state === '1' ? 'Pending' : r.state === '2' ? 'Work in Progress' : 'Closed Complete'}
                      color={r.state === '3' ? 'success' : 'default'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                    {r.priority === '1' ? 'Critical' : 'Moderate'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                    {r['assignment_group.name'] || 'Server Infrastructure'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      href={r.directUrl}
                      target="_blank"
                      endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                      sx={{ textTransform: 'none', py: 0.2, fontSize: '0.72rem' }}
                    >
                      View in SNow
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          )}
        </Box>
      </Paper>

      {/* Auto-Assignment Rules Configuration Dialog */}
      <Dialog
        open={rulesDialogOpen}
        onClose={() => setRulesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoFixHighOutlined sx={{ color: '#7c3aed' }} />
          Configure Ticket Auto-Assignment Rules
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Configure basic classification parameters (ticket type, service keywords) to automatically route incoming Incidents and Requests to the appropriate ITIL Support Group in ServiceNow.
          </Typography>

          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>RULE NAME / TICKET TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>KEYWORD PARAMETERS (COMMA-SEPARATED)</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>TARGET SUPPORT GROUP</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignRules.map((rule, idx) => (
                <TableRow key={rule.id}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    {rule.type}
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      size="small"
                      value={rule.keywords}
                      onChange={(e) => {
                        const updated = [...assignRules];
                        updated[idx].keywords = e.target.value;
                        setAssignRules(updated);
                      }}
                      sx={{ fontSize: '0.8rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={rule.targetGroup}
                      onChange={(e) => {
                        const updated = [...assignRules];
                        updated[idx].targetGroup = e.target.value;
                        setAssignRules(updated);
                      }}
                      SelectProps={{ native: true }}
                      sx={{ minWidth: 180 }}
                    >
                      <option value="Server Infrastructure">Server Infrastructure</option>
                      <option value="Network Services">Network Services</option>
                      <option value="Application Support">Application Support</option>
                      <option value="End User Computing">End User Computing</option>
                      <option value="Facilities IT">Facilities IT</option>
                      <option value="Security">Security</option>
                      <option value="Telephony">Telephony</option>
                      <option value="Cloud Services">Cloud Services</option>
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRulesDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              setRulesDialogOpen(false);
              handleSimulateAutoAssign();
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Save & Run Simulation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Subcomponent: Reusable Module Table
function ModuleTable({ title, listUrl, headers, records = [], renderRow }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
          {title}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          href={listUrl}
          target="_blank"
          rel="noopener noreferrer"
          endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
          sx={{ textTransform: 'none', py: 0.3, fontSize: '0.75rem', fontWeight: 600 }}
        >
          View Full List in ServiceNow
        </Button>
      </Box>

      {records.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No recent records found in this ServiceNow table.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                {headers.map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#475569' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(renderRow)}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
