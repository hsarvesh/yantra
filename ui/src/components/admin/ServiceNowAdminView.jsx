import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Alert,
  AlertTitle,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Paper,
  CircularProgress,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  SettingsSuggestOutlined,
  LanOutlined,
  LockOutlined,
  StorageOutlined,
  TuneOutlined,
  CheckCircle,
  WarningAmber,
  ErrorOutline,
  SpeedOutlined,
  Refresh,
  SaveOutlined,
  FileDownloadOutlined,
  Visibility,
  VisibilityOff,
  PlayArrow,
  DnsOutlined,
  VerifiedUserOutlined,
  TerminalOutlined,
  HubOutlined,
  FactCheckOutlined,
  Check,
  ContentCopy,
  KeyboardArrowDown,
  KeyboardArrowUp
} from '@mui/icons-material';

const STORAGE_KEY = 'yantra_snow_config_v1';

export const defaultSnowConfig = {
  connection: {
    instanceUrl: 'https://dev364281.service-now.com',
    authType: 'session_gck',
    username: 'admin',
    password: 'nm6uC9vSG%$X',
    proxyEnabled: true,
    socketTimeoutSec: 20,
    workerPoolSize: 12
  },
  schema: {
    requestTable: 'sc_request',
    ritmTable: 'sc_req_item',
    taskTable: 'sc_task',
    incidentTable: 'incident',
    changeTable: 'change_request',
    taxonomyTable: 'u_itsm_taxonomy',
    supportGroupTable: 'sys_user_group',
    locationTable: 'cmn_location',
    enforceApprovalGate: true,
    stateMapping: {
      open: '1',
      workInProgress: '2',
      closedComplete: '3',
      closedIncomplete: '4'
    }
  },
  cmdb: {
    autoResolveLocations: true,
    reconciliationKey: 'name_and_serial',
    totalRegisteredCis: 2815,
    locations: ['Bangalore', 'Pune', 'Hyderabad', 'Indore', 'Delhi'],
    trackedClasses: [
      { id: 'cmdb_ci_win_server', name: 'Domain Controllers (Windows Server)', count: 10, group: 'Server Infrastructure' },
      { id: 'cmdb_ci_esx_server', name: 'VMware Physical Hosts (ESXi)', count: 20, group: 'Server Infrastructure' },
      { id: 'cmdb_ci_vm_instance', name: 'Virtual Machines (Guest OS)', count: 250, group: 'Server Infrastructure' },
      { id: 'cmdb_ci_storage_server', name: 'NetApp SAN Storage Arrays', count: 10, group: 'Server Infrastructure' },
      { id: 'cmdb_ci_db_instance', name: 'Enterprise Database Instances', count: 60, group: 'Application Support' },
      { id: 'cmdb_ci_appl', name: 'Enterprise Applications', count: 80, group: 'Application Support' },
      { id: 'cmdb_ci_ip_firewall', name: 'Perimeter Firewalls', count: 20, group: 'Network Services' },
      { id: 'cmdb_ci_ip_router', name: 'Core Edge Routers', count: 20, group: 'Network Services' },
      { id: 'cmdb_ci_ip_switch', name: 'Access Layer Switches', count: 100, group: 'Network Services' },
      { id: 'cmdb_ci_netgear', name: 'Wireless LAN Controllers (WLC)', count: 5, group: 'Network Services' },
      { id: 'cmdb_ci_wap_network', name: 'Wi-Fi 6 Access Points', count: 150, group: 'Network Services' },
      { id: 'cmdb_ci_computer', name: 'End User Workplace Devices', count: 2000, group: 'End User Computing' },
      { id: 'cmdb_ci_printer', name: 'Network Printers / MFDs', count: 30, group: 'Facilities IT' },
      { id: 'cmdb_ci_comm', name: 'Meeting Room Kits', count: 40, group: 'Telephony' },
      { id: 'cmdb_ci_ups', name: 'Smart Datacenter UPS Power', count: 20, group: 'Facilities IT' }
    ]
  },
  automation: {
    autoCloseTasks: true,
    postWorkNotes: true,
    publishSha256Evidence: true,
    revertOnFailure: true,
    pollingIntervalSec: 15,
    maxRetries: 3
  }
};

export default function ServiceNowAdminView({ onNotification }) {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState(defaultSnowConfig);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Connection Telemetry
  const [connectionStatus, setConnectionStatus] = useState({
    state: 'unknown', // online, offline, testing, unknown
    latencyMs: null,
    lastChecked: null,
    message: ''
  });

  // Diagnostic Test States
  const [testStates, setTestStates] = useState({
    connection: { loading: false, result: null },
    schema: { loading: false, result: null },
    cmdb: { loading: false, result: null },
    worknotes: { loading: false, result: null },
    e2e: { loading: false, result: null }
  });

  const [expandedLog, setExpandedLog] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read config from localStorage', e);
    }
    // Run an initial quick connection ping
    runTest('connection');
  }, []);

  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasUnsavedChanges(false);
      if (onNotification) onNotification('ServiceNow configuration saved successfully to localStorage.', 'success');
    } catch (e) {
      if (onNotification) onNotification('Failed to save configuration: ' + e.message, 'error');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `yantra_servicenow_config_${new Date().toISOString().substring(0, 10)}.json`);
    dlAnchor.click();
    dlAnchor.remove();
    if (onNotification) onNotification('Configuration exported as JSON.', 'info');
  };

  const handleResetDefaults = () => {
    setConfig(defaultSnowConfig);
    setHasUnsavedChanges(true);
    if (onNotification) onNotification('Reset settings to default configuration.', 'warning');
  };

  // Run specific diagnostic test
  const runTest = async (testType) => {
    setTestStates(prev => ({
      ...prev,
      [testType]: { loading: true, result: null }
    }));

    if (testType === 'connection') {
      setConnectionStatus(prev => ({ ...prev, state: 'testing' }));
    }

    try {
      const endpoint = `/api/snow/test-${testType}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceUrl: config.connection.instanceUrl,
          username: config.connection.username,
          password: config.connection.password,
          authType: config.connection.authType
        })
      });

      const data = await res.json();
      setTestStates(prev => ({
        ...prev,
        [testType]: { loading: false, result: data }
      }));

      if (testType === 'connection') {
        if (data.success) {
          setConnectionStatus({
            state: 'online',
            latencyMs: data.latencyMs,
            lastChecked: new Date().toLocaleTimeString(),
            message: `Connected as ${data.authenticatedUser} (${data.tokenRetrieved ? 'Valid g_ck' : 'No token'})`
          });
        } else {
          setConnectionStatus({
            state: 'offline',
            latencyMs: null,
            lastChecked: new Date().toLocaleTimeString(),
            message: data.error || 'Connection failed'
          });
        }
      }

      if (onNotification) {
        if (data.success) {
          onNotification(`Test ${testType.toUpperCase()} Passed successfully!`, 'success');
        } else {
          onNotification(`Test ${testType.toUpperCase()} Failed: ${data.error || 'Unknown error'}`, 'error');
        }
      }
    } catch (err) {
      setTestStates(prev => ({
        ...prev,
        [testType]: { loading: false, result: { success: false, error: err.message } }
      }));
      if (testType === 'connection') {
        setConnectionStatus({
          state: 'offline',
          latencyMs: null,
          lastChecked: new Date().toLocaleTimeString(),
          message: err.message
        });
      }
      if (onNotification) onNotification(`Test ${testType.toUpperCase()} encountered an error: ${err.message}`, 'error');
    }
  };

  // Run all diagnostic tests sequentially
  const runAllTests = async () => {
    setActiveTab(4); // Switch to Diagnostic Suite tab
    await runTest('connection');
    await runTest('schema');
    await runTest('cmdb');
    await runTest('worknotes');
    await runTest('e2e');
    if (onNotification) onNotification('Full Diagnostic Test Suite execution completed.', 'info');
  };

  const toggleLogExpand = (key) => {
    setExpandedLog(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Top Breadcrumb & Title */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', fontSize: '0.8rem', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>ADMINISTRATION</Typography>
          <span>/</span>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>TOOLS CONFIGURATION</Typography>
          <span>/</span>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7' }}>SERVICENOW INTEGRATION</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsSuggestOutlined sx={{ color: '#0284c7', fontSize: 30 }} />
              ServiceNow Integration & Platform Admin
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Configure instance connectivity, ITSM table schemas, CMDB asset bindings, automation sync policies, and execute interactive diagnostic tests.
            </Typography>
          </Box>

          {/* Action Bar */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            {hasUnsavedChanges && (
              <Chip label="Unsaved Changes" color="warning" size="small" sx={{ fontWeight: 700 }} />
            )}
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadOutlined />}
              onClick={handleExportJson}
              sx={{ textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
            >
              Export JSON
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleResetDefaults}
              sx={{ textTransform: 'none' }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              onClick={runAllTests}
              sx={{ textTransform: 'none', bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
            >
              Run Full Diagnostics
            </Button>
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<SaveOutlined />}
              onClick={handleSave}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Save Configuration
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Live Status Telemetry Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          bgcolor: connectionStatus.state === 'online' ? '#f0fdf4' : connectionStatus.state === 'offline' ? '#fef2f2' : '#f8fafc',
          border: '1px solid',
          borderColor: connectionStatus.state === 'online' ? '#bbf7d0' : connectionStatus.state === 'offline' ? '#fecaca' : '#e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: connectionStatus.state === 'online' ? '#22c55e' : connectionStatus.state === 'offline' ? '#ef4444' : '#94a3b8',
              boxShadow: connectionStatus.state === 'online' ? '0 0 0 3px rgba(34, 197, 94, 0.2)' : 'none'
            }}
          />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                Instance: {config.connection.instanceUrl}
              </Typography>
              <Chip
                size="small"
                label={connectionStatus.state.toUpperCase()}
                color={connectionStatus.state === 'online' ? 'success' : connectionStatus.state === 'offline' ? 'error' : 'default'}
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {connectionStatus.message || 'Connecting to ServiceNow instance...'}
              {connectionStatus.lastChecked && ` • Checked at ${connectionStatus.lastChecked}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {connectionStatus.latencyMs !== null && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Gateway Ping</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: connectionStatus.latencyMs < 500 ? '#16a34a' : '#d97706' }}>
                {connectionStatus.latencyMs} ms
              </Typography>
            </Box>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={connectionStatus.state === 'testing' ? <CircularProgress size={14} /> : <Refresh />}
            disabled={connectionStatus.state === 'testing'}
            onClick={() => runTest('connection')}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            Quick Ping
          </Button>
        </Box>
      </Paper>

      {/* Tabs Bar */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: 48,
              py: 1
            }
          }}
        >
          <Tab icon={<LanOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Connection & Auth" />
          <Tab icon={<HubOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="2. ITSM & Schema Mapping" />
          <Tab icon={<StorageOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="3. CMDB & Asset Classes" />
          <Tab icon={<TuneOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="4. Automation & Evidence" />
          <Tab
            icon={<FactCheckOutlined sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="5. Diagnostic Test Suite"
          />
        </Tabs>

        {/* TAB 0: CONNECTION & AUTH */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#0f172a' }}>
              ServiceNow Instance Credentials & Gateway Connection
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Specify the connection coordinates, authentication mode, and proxy settings used by the Yantra execution layer to communicate with the ServiceNow REST API.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  label="ServiceNow Instance URL"
                  value={config.connection.instanceUrl}
                  onChange={(e) => handleConfigChange('connection', 'instanceUrl', e.target.value)}
                  placeholder="https://devXXXXX.service-now.com"
                  helperText="Primary developer or enterprise ServiceNow instance address"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  select
                  fullWidth
                  label="Authentication Mode"
                  value={config.connection.authType}
                  onChange={(e) => handleConfigChange('connection', 'authType', e.target.value)}
                  size="small"
                  SelectProps={{ native: true }}
                  helperText="Session token (g_ck) provides high-performance CSRF protected API access"
                >
                  <option value="session_gck">Interactive Session + g_ck Token (Recommended)</option>
                  <option value="basic_auth">Direct Basic Authentication (Base64)</option>
                  <option value="oauth2">OAuth 2.0 Client Credentials (Token grant)</option>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Service Account / Admin Username"
                  value={config.connection.username}
                  onChange={(e) => handleConfigChange('connection', 'username', e.target.value)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="API Password / Client Secret"
                  value={config.connection.password}
                  onChange={(e) => handleConfigChange('connection', 'password', e.target.value)}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.connection.proxyEnabled}
                      onChange={(e) => handleConfigChange('connection', 'proxyEnabled', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Backend API Proxy</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Route through local Node/Vite proxy to prevent CORS issues</Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="HTTP Socket Timeout (Seconds)"
                  value={config.connection.socketTimeoutSec}
                  onChange={(e) => handleConfigChange('connection', 'socketTimeoutSec', parseInt(e.target.value))}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Concurrent Worker Pool Size"
                  value={config.connection.workerPoolSize}
                  onChange={(e) => handleConfigChange('connection', 'workerPoolSize', parseInt(e.target.value))}
                  size="small"
                  helperText="Default 12 threads for parallel ticket batch processing"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<LanOutlined />}
                onClick={() => runTest('connection')}
                sx={{ textTransform: 'none' }}
              >
                Test Connection & Auth
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 1: ITSM & SCHEMA MAPPING */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#0f172a' }}>
              ITSM Data Model & Table Schema Bindings
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Map the core ServiceNow service catalog tables, state values, and governance rules that orchestrate RITMs, SCTASKs, and approval tracking.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HubOutlined fontSize="small" /> Primary Table Mappings
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Parent Request Table"
                        value={config.schema.requestTable}
                        onChange={(e) => handleConfigChange('schema', 'requestTable', e.target.value)}
                        helperText="Service catalog header container (sc_request)"
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Requested Item Table (RITM)"
                        value={config.schema.ritmTable}
                        onChange={(e) => handleConfigChange('schema', 'ritmTable', e.target.value)}
                        helperText="Individual line item request tracking (sc_req_item)"
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Catalog Task Table (SCTASK)"
                        value={config.schema.taskTable}
                        onChange={(e) => handleConfigChange('schema', 'taskTable', e.target.value)}
                        helperText="Engineer execution & fulfillment task (sc_task)"
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Enterprise Taxonomy Table"
                        value={config.schema.taxonomyTable}
                        onChange={(e) => handleConfigChange('schema', 'taxonomyTable', e.target.value)}
                        helperText="Dedicated custom taxonomy table (2,668 categories)"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUserOutlined fontSize="small" /> Governance & State Code Normalization
                    </Typography>

                    <Box sx={{ mb: 2.5 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.schema.enforceApprovalGate}
                            onChange={(e) => handleConfigChange('schema', 'enforceApprovalGate', e.target.checked)}
                            color="success"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Enforce Pre-Execution Approval Gate</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              BRD Rule: Never execute any task until business stage is 'request_approved'.
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1.5 }}>
                      STANDARD TICKET STATE CODE VALUES:
                    </Typography>

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State: Open"
                          value={config.schema.stateMapping.open}
                          onChange={(e) => handleConfigChange('schema', 'stateMapping', { ...config.schema.stateMapping, open: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State: Work in Progress"
                          value={config.schema.stateMapping.workInProgress}
                          onChange={(e) => handleConfigChange('schema', 'stateMapping', { ...config.schema.stateMapping, workInProgress: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State: Closed Complete"
                          value={config.schema.stateMapping.closedComplete}
                          onChange={(e) => handleConfigChange('schema', 'stateMapping', { ...config.schema.stateMapping, closedComplete: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="State: Closed Incomplete"
                          value={config.schema.stateMapping.closedIncomplete}
                          onChange={(e) => handleConfigChange('schema', 'stateMapping', { ...config.schema.stateMapping, closedIncomplete: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<HubOutlined />}
                onClick={() => runTest('schema')}
                sx={{ textTransform: 'none' }}
              >
                Test Table ACL & Schema Permissions
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 2: CMDB & ASSET CLASSES */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  CMDB Classes & Inventory Scope
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Configuration for the 15 CI classes populated across our 2,815 enterprise assets in Bangalore, Pune, Hyderabad, Indore, and Delhi.
                </Typography>
              </Box>
              <Chip
                label="2,815 CIs Registered"
                color="success"
                sx={{ fontWeight: 700, fontSize: '0.8rem' }}
              />
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>DEVICE / CI CATEGORY</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>SERVICENOW CLASS (TABLE)</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>CI COUNT</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>ASSIGNED SUPPORT GROUP</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {config.cmdb.trackedClasses.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#0f172a' }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#0284c7' }}>
                        {item.id}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.82rem' }}>
                        {item.count}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                        {item.group}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip size="small" label="Imported" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Enterprise Locations Resolver</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.8rem' }}>
                      Auto-resolves incoming CI location references to registered records in <code>cmn_location</code>:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {config.cmdb.locations.map(loc => (
                        <Chip key={loc} label={loc} color="primary" variant="outlined" size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Reconciliation & Identity Rule</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.8rem' }}>
                      Defines how Yantra identifies target CIs during service request parameter binding:
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={config.cmdb.reconciliationKey}
                      onChange={(e) => handleConfigChange('cmdb', 'reconciliationKey', e.target.value)}
                      SelectProps={{ native: true }}
                    >
                      <option value="name_and_serial">CI Name + Serial Number (Recommended)</option>
                      <option value="ip_address">IP Address Binding</option>
                      <option value="sys_id">Direct Sys_ID Lookup</option>
                    </TextField>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<StorageOutlined />}
                onClick={() => runTest('cmdb')}
                sx={{ textTransform: 'none' }}
              >
                Test CMDB Classes & Locations
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 3: AUTOMATION & EVIDENCE */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#0f172a' }}>
              Automation Synchronization & Audit Evidence Policies
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Configure how automated executions write back to ServiceNow tickets, update task states, and attach cryptographic proof.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7', mb: 2 }}>
                      Task Lifecycle Automation
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.automation.autoCloseTasks}
                            onChange={(e) => handleConfigChange('automation', 'autoCloseTasks', e.target.checked)}
                            color="success"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Auto-Close Catalog Tasks (SCTASK)</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              On verified execution completion, automatically set SCTASK state to 'Closed Complete' (3).
                            </Typography>
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.automation.revertOnFailure}
                            onChange={(e) => handleConfigChange('automation', 'revertOnFailure', e.target.checked)}
                            color="error"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Auto-Mark Incomplete on Validation Failure</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              If pre/post execution checks fail, set SCTASK state to 'Closed Incomplete' (4) and reset qualification counter.
                            </Typography>
                          </Box>
                        }
                      />

                      <Divider sx={{ my: 1 }} />

                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        label="RITM Polling Frequency (Seconds)"
                        value={config.automation.pollingIntervalSec}
                        onChange={(e) => handleConfigChange('automation', 'pollingIntervalSec', parseInt(e.target.value))}
                        helperText="Frequency for monitoring incoming service requests"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0284c7', mb: 2 }}>
                      Evidence & Work Notes Publication
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.automation.postWorkNotes}
                            onChange={(e) => handleConfigChange('automation', 'postWorkNotes', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Publish Step Execution Work Notes</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Post human-readable execution transcript into ServiceNow ticket activity stream.
                            </Typography>
                          </Box>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.automation.publishSha256Evidence}
                            onChange={(e) => handleConfigChange('automation', 'publishSha256Evidence', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>Embed Cryptographic SHA-256 Digest</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Attach tamper-evident cryptographic hash for ITIL auditor verification.
                            </Typography>
                          </Box>
                        }
                      />

                      <Divider sx={{ my: 1 }} />

                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        label="Maximum API Retry Attempts"
                        value={config.automation.maxRetries}
                        onChange={(e) => handleConfigChange('automation', 'maxRetries', parseInt(e.target.value))}
                        helperText="Maximum retry attempts on transient network timeouts"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<TuneOutlined />}
                onClick={() => runTest('worknotes')}
                sx={{ textTransform: 'none' }}
              >
                Live Work Notes & Evidence Injection Test
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 4: DIAGNOSTIC TEST SUITE */}
        {activeTab === 4 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Interactive ServiceNow Diagnostic Test Suite
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Execute real-time live diagnostics against ServiceNow instance <code>dev364281</code> across each functional area.
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={runAllTests}
                sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 700 }}
              >
                Run All 5 Diagnostic Tests
              </Button>
            </Box>

            {/* Diagnostic Test Cards Grid */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Test 1: Connection & Auth */}
              <DiagnosticCard
                title="1. Gateway Connectivity & Session Auth Test"
                description="Verifies TCP handshake, login credentials, and retrieves valid g_ck security token."
                loading={testStates.connection.loading}
                result={testStates.connection.result}
                onRun={() => runTest('connection')}
                expanded={expandedLog['conn']}
                onToggleExpand={() => toggleLogExpand('conn')}
              />

              {/* Test 2: Schema Permissions */}
              <DiagnosticCard
                title="2. ITSM Table Schema & ACL Permissions Test"
                description="Probes sc_request, sc_req_item, sc_task, and verifies 2,668-row u_itsm_taxonomy access."
                loading={testStates.schema.loading}
                result={testStates.schema.result}
                onRun={() => runTest('schema')}
                expanded={expandedLog['schema']}
                onToggleExpand={() => toggleLogExpand('schema')}
              />

              {/* Test 3: CMDB Classes & Locations */}
              <DiagnosticCard
                title="3. CMDB Inventory & Location Resolver Test"
                description="Validates all 15 CI classes and confirms location bindings for BLR, PNE, HYD, IND, DEL."
                loading={testStates.cmdb.loading}
                result={testStates.cmdb.result}
                onRun={() => runTest('cmdb')}
                expanded={expandedLog['cmdb']}
                onToggleExpand={() => toggleLogExpand('cmdb')}
              />

              {/* Test 4: Live Work Notes Injection */}
              <DiagnosticCard
                title="4. Live Work Notes & Audit Evidence Posting Test"
                description="Creates a temporary test record, injects SHA-256 evidence note, verifies write, and tears down the test record."
                loading={testStates.worknotes.loading}
                result={testStates.worknotes.result}
                onRun={() => runTest('worknotes')}
                expanded={expandedLog['notes']}
                onToggleExpand={() => toggleLogExpand('notes')}
              />

              {/* Test 5: End-to-End RITM Lifecycle */}
              <DiagnosticCard
                title="5. End-to-End Synthetic RITM Execution Lifecycle Test"
                description="Steps through 5-stage workflow: connect, query RITM, verify approval gate, bind CMDB CI, and generate execution digest."
                loading={testStates.e2e.loading}
                result={testStates.e2e.result}
                onRun={() => runTest('e2e')}
                expanded={expandedLog['e2e']}
                onToggleExpand={() => toggleLogExpand('e2e')}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

// Subcomponent: Individual Diagnostic Test Card
function DiagnosticCard({ title, description, loading, result, onRun, expanded, onToggleExpand }) {
  const isSuccess = result?.success === true;
  const isFailed = result?.success === false;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderColor: isSuccess ? '#86efac' : isFailed ? '#fca5a5' : '#e2e8f0',
        bgcolor: isSuccess ? '#f0fdf4' : isFailed ? '#fef2f2' : '#ffffff',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ mt: 0.3 }}>
              {loading ? (
                <CircularProgress size={20} sx={{ color: '#0284c7' }} />
              ) : isSuccess ? (
                <CheckCircle sx={{ color: '#16a34a', fontSize: 24 }} />
              ) : isFailed ? (
                <ErrorOutline sx={{ color: '#dc2626', fontSize: 24 }} />
              ) : (
                <FactCheckOutlined sx={{ color: '#94a3b8', fontSize: 24 }} />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.2 }}>
                {description}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {result?.latencyMs !== undefined && (
              <Chip
                icon={<SpeedOutlined sx={{ fontSize: 16 }} />}
                label={`${result.latencyMs} ms`}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
              />
            )}

            {isSuccess && (
              <Chip label="PASSED" color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
            )}
            {isFailed && (
              <Chip label="FAILED" color="error" size="small" sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
            )}

            <Button
              size="small"
              variant="outlined"
              onClick={onRun}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={14} /> : <PlayArrow />}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
            >
              Run Test
            </Button>

            {result && (
              <IconButton size="small" onClick={onToggleExpand}>
                {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Collapsible Result Details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: isSuccess ? '#bbf7d0' : '#fecaca' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1 }}>
              DIAGNOSTIC TELEMETRY OUTPUT:
            </Typography>

            {/* Special rendering for E2E steps */}
            {result?.steps && (
              <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {result.steps.map((st) => (
                  <Paper
                    key={st.step}
                    elevation={0}
                    sx={{ p: 1.2, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={`Step ${st.step}`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>{st.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{st.detail}</Typography>
                      <Chip label={`${st.durationMs}ms`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      <Chip label="PASS" color="success" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Special rendering for Schema Tables */}
            {result?.tables && (
              <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {result.tables.map((t) => (
                  <Box key={t.table} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.8, bgcolor: '#ffffff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>{t.table}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>({t.label})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#475569' }}>{t.permissions}</Typography>
                      <Chip label={t.status} color={t.status === 'PASS' ? 'success' : 'warning'} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            {/* Special rendering for WorkNotes */}
            {result?.recordNumber && (
              <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #e2e8f0', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', mb: 0.5 }}>
                  Live Test Record: <code>{result.recordNumber}</code> (SysID: <code>{result.recordSysId}</code>)
                </Typography>
                <Typography variant="caption" sx={{ color: '#16a34a', display: 'block', mb: 0.5 }}>
                   Work note verified in activity stream with hash: <code>{result.evidenceHash}</code>
                </Typography>
                <Typography variant="caption" sx={{ color: result.cleanedUp ? '#16a34a' : '#d97706', display: 'block' }}>
                   Temporary record auto-teardown: {result.cleanedUp ? 'Successfully deleted' : 'Retained in test state'}
                </Typography>
              </Box>
            )}

            {/* Raw JSON viewer */}
            <Box
              component="pre"
              sx={{
                p: 1.5,
                bgcolor: '#0f172a',
                color: '#38bdf8',
                borderRadius: 1.5,
                fontSize: '0.72rem',
                overflowX: 'auto',
                m: 0
              }}
            >
              {JSON.stringify(result, null, 2)}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
