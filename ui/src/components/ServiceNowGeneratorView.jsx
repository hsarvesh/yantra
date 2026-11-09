import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  AddCircleOutline,
  CloudDoneOutlined,
  OpenInNewOutlined,
  RefreshOutlined,
  AutoAwesomeOutlined,
  PlayArrow,
  CheckCircle,
  WarningAmberOutlined,
  SendOutlined,
  StorageOutlined
} from '@mui/icons-material';

const sampleTemplates = [
  {
    id: 'sample_win',
    title: 'Windows Service Clean Restart',
    procedureId: 'PROC-WIN-001',
    targetCi: 'PRD-APP-SRV01',
    category: 'Server Operations',
    urgency: '2',
    impact: '2',
    description: 'Clean restart of IIS Web Publishing Service (W3SVC) following memory leak alarm.',
    parameters: { TargetHost: 'PRD-APP-SRV01', ServiceName: 'W3SVC', RestartGraceSeconds: 15 },
    iconColor: '#0284c7',
    tag: 'Infrastructure'
  },
  {
    id: 'sample_iam',
    title: 'Active Directory User Account Unlock & Reset',
    procedureId: 'PROC-IAM-002',
    targetCi: 'DC01.corp.internal',
    category: 'Identity & Access',
    urgency: '1',
    impact: '2',
    description: 'Finance contractor account locked after 5 failed password attempts during VPN authentication.',
    parameters: { UserPrincipalName: 'claire.daniels@corp.yash.com', JustificationCode: 'INC-ACCOUNT-LOCKED' },
    iconColor: '#4f46e5',
    tag: 'Identity'
  },
  {
    id: 'sample_lnx',
    title: 'Linux Filesystem Clean & Log Truncate',
    procedureId: 'PROC-LNX-003',
    targetCi: 'PRD-LNX-AP02',
    category: 'Server Operations',
    urgency: '2',
    impact: '3',
    description: '/var/log utilization exceeded 85% alert threshold. Execute journalctl vacuum and truncate old gzip archives.',
    parameters: { TargetHost: 'PRD-LNX-AP02', ThresholdPercent: 85 },
    iconColor: '#10b981',
    tag: 'Linux'
  },
  {
    id: 'sample_db',
    title: 'Oracle Database RMAN Backup Re-run',
    procedureId: 'PROC-DB-004',
    targetCi: 'ORCLPRD01',
    category: 'Database Operations',
    urgency: '1',
    impact: '1',
    description: 'Nightly incremental backup failed due to temporary NFS share unavailability. Re-run incremental level-1 RMAN backup.',
    parameters: { DatabaseSID: 'ORCLPRD', BackupType: 'Incremental-Level1' },
    iconColor: '#f59e0b',
    tag: 'Database'
  },
  {
    id: 'sample_missing',
    title: 'INCOMPLETE: Service Restart (Missing Service Name)',
    procedureId: 'PROC-WIN-001',
    targetCi: 'PRD-APP-SRV01',
    category: 'Server Operations',
    urgency: '2',
    impact: '3',
    description: 'Requester asks to restart server service but omitted the mandatory ServiceName parameter.',
    parameters: { TargetHost: 'PRD-APP-SRV01' }, // Missing ServiceName intentionally!
    iconColor: '#ef4444',
    tag: 'Missing Info Test'
  }
];

export default function ServiceNowGeneratorView({ onSampleCreated }) {
  const [liveRecords, setLiveRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTemplateId, setGeneratingTemplateId] = useState(null);
  const [lastCreated, setLastCreated] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Custom Form state
  const [customTitle, setCustomTitle] = useState('Restart Apache Tomcat on PRD-APP-03');
  const [customTarget, setCustomTarget] = useState('PRD-APP-03');
  const [customProcedure, setCustomProcedure] = useState('PROC-WIN-001');
  const [customParamKey, setCustomParamKey] = useState('ServiceName');
  const [customParamVal, setCustomParamVal] = useState('Tomcat9');

  const fetchLiveRecords = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/snow/list');
      const data = await res.json();
      if (data.success) {
        setLiveRecords(data.records || []);
      } else {
        setErrorMsg(data.error || 'Failed to fetch ServiceNow records');
      }
    } catch (err) {
      setErrorMsg('Network error connecting to ServiceNow proxy: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRecords();
  }, []);

  const handleGenerateTemplate = async (template) => {
    setGeneratingTemplateId(template.id);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/snow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: template.title,
          description: template.description,
          procedureId: template.procedureId,
          targetCi: template.targetCi,
          parameters: template.parameters,
          urgency: template.urgency,
          impact: template.impact
        })
      });

      const data = await res.json();
      if (data.success) {
        setLastCreated(data.result);
        if (onSampleCreated) onSampleCreated(data.result);
        await fetchLiveRecords();
      } else {
        setErrorMsg(data.error || 'Failed to generate record in ServiceNow');
      }
    } catch (err) {
      setErrorMsg('Error sending request to ServiceNow: ' + err.message);
    } finally {
      setGeneratingTemplateId(null);
    }
  };

  const handleBatchGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/snow/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setLastCreated(data.results[0]);
        if (onSampleCreated) onSampleCreated(data.results[0]);
        await fetchLiveRecords();
      } else {
        setErrorMsg(data.error || 'Batch generation failed');
      }
    } catch (err) {
      setErrorMsg('Error in batch generation: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCustom = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const params = {};
      if (customParamKey && customParamVal) {
        params[customParamKey] = customParamVal;
      }
      params['TargetHost'] = customTarget;

      const res = await fetch('/api/snow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: customTitle,
          description: `Custom request generated from Yantra UI. Target CI: ${customTarget}`,
          procedureId: customProcedure,
          targetCi: customTarget,
          parameters: params,
          urgency: '2',
          impact: '2'
        })
      });

      const data = await res.json();
      if (data.success) {
        setLastCreated(data.result);
        if (onSampleCreated) onSampleCreated(data.result);
        await fetchLiveRecords();
      } else {
        setErrorMsg(data.error || 'Failed to create custom request');
      }
    } catch (err) {
      setErrorMsg('Error creating custom request: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header & Live Connection Status Banner */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
            ServiceNow Live Sample Request Generator
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Generate real, live Service Requests (`sc_request` & `sc_req_item`) directly into your ServiceNow instance to test end-to-end classification, governance, and MID server execution.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={fetchLiveRecords}
            disabled={isLoading}
            sx={{ fontWeight: 600 }}
          >
            Refresh Records
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AutoAwesomeOutlined />}
            onClick={handleBatchGenerate}
            disabled={isGenerating}
            sx={{ fontWeight: 700 }}
          >
            {isGenerating ? 'Generating 5 Samples...' : 'Generate 5 Diverse Samples (1-Click)'}
          </Button>
        </Box>
      </Box>

      {/* Connected Instance Card */}
      <Card sx={{ p: 2, mb: 3, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#0284c7', borderRadius: 1.5, color: '#ffffff', display: 'flex' }}>
              <CloudDoneOutlined />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369a1' }}>
                  Connected to: {(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SNOW_INSTANCE_URL) || 'Configured ServiceNow Instance'}
                </Typography>
                <Chip size="small" label={`Authenticated as ${(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SNOW_USERNAME) || 'admin'}`} color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#0284c7', display: 'block' }}>
                Active REST API Target: <code>sc_request</code> (Parent) &amp; <code>sc_req_item</code> (Requested Item with operational metadata)
              </Typography>
            </Box>
          </Box>

          <Button
            size="small"
            variant="outlined"
            color="primary"
            endIcon={<OpenInNewOutlined />}
            href={`${(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SNOW_INSTANCE_URL ? import.meta.env.VITE_SNOW_INSTANCE_URL : '').replace(/\/+$/, '')}/nav_to.do?uri=sc_req_item_list.do`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: '#ffffff' }}
          >
            Open ServiceNow Request Items List
          </Button>
        </Box>
      </Card>

      {/* Error or Success Alerts */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {lastCreated && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setLastCreated(null)}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <strong>Successfully Created in ServiceNow!</strong> Generated Requested Item <code>{lastCreated.ritmNumber}</code> (Parent Request: <code>{lastCreated.reqNumber}</code>).
            </Box>
            <Button
              size="small"
              variant="contained"
              color="success"
              endIcon={<OpenInNewOutlined />}
              href={lastCreated.directUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontWeight: 700, fontSize: '0.72rem', py: 0.3 }}
            >
              View in ServiceNow
            </Button>
          </Box>
        </Alert>
      )}

      {/* Section 1: Pre-Configured Sample Templates (1-Click Generation) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          Standard Operational Use Cases (1-Click Sample Generators)
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
          Click any sample below to immediately populate a real Service Request into your ServiceNow instance.
        </Typography>

        <Grid container spacing={2}>
          {sampleTemplates.map((template) => {
            const isThisGenerating = generatingTemplateId === template.id;
            return (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      borderColor: template.iconColor,
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        size="small"
                        label={template.tag}
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: `${template.iconColor}15`, color: template.iconColor }}
                      />
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>
                        {template.procedureId}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.8, lineHeight: 1.3 }}>
                      {template.title}
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5, lineHeight: 1.4 }}>
                      {template.description}
                    </Typography>

                    <Box sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, fontSize: '0.72rem', mb: 1.5 }}>
                      <div>Target Host: <strong>{template.targetCi}</strong></div>
                      <div>Category: <strong>{template.category}</strong></div>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SendOutlined />}
                    disabled={isThisGenerating || isGenerating}
                    onClick={() => handleGenerateTemplate(template)}
                    sx={{
                      bgcolor: template.iconColor,
                      '&:hover': { bgcolor: template.iconColor },
                      fontWeight: 700,
                      py: 0.8,
                    }}
                  >
                    {isThisGenerating ? 'Creating in ServiceNow...' : 'Populate Into ServiceNow'}
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Section 2: Custom Request Creator */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          Custom Service Request Generator
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
          Specify custom parameters to generate tailored sample requests for testing specific execution scenarios.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Short Description / Request Title"
              size="small"
              fullWidth
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Target CI / Hostname"
              size="small"
              fullWidth
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Mapped Procedure</InputLabel>
              <Select
                value={customProcedure}
                label="Mapped Procedure"
                onChange={(e) => setCustomProcedure(e.target.value)}
              >
                <MenuItem value="PROC-WIN-001">PROC-WIN-001 (Windows Restart)</MenuItem>
                <MenuItem value="PROC-IAM-002">PROC-IAM-002 (AD User Unlock)</MenuItem>
                <MenuItem value="PROC-LNX-003">PROC-LNX-003 (Linux Clean)</MenuItem>
                <MenuItem value="PROC-DB-004">PROC-DB-004 (Oracle Backup)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Parameter Key"
              size="small"
              fullWidth
              value={customParamKey}
              onChange={(e) => setCustomParamKey(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Parameter Value"
              size="small"
              fullWidth
              value={customParamVal}
              onChange={(e) => setCustomParamVal(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={isGenerating}
              onClick={handleCreateCustom}
              sx={{ height: 40, fontWeight: 700 }}
            >
              Create
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Section 3: Live Records in ServiceNow Instance Table */}
      <Card sx={{ p: 2.5, borderRadius: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Live Populated Records in ServiceNow (`sc_req_item`)
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Direct live query from table `sc_req_item` on ServiceNow. Click any record to inspect directly in ServiceNow.
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${liveRecords.length} Records in Instance`}
            color="primary"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {isLoading && <LinearProgress sx={{ height: 4, mb: 1, borderRadius: 2 }} />}

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>NUMBER</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>SHORT DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>STATE</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>CREATED ON</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>SERVICENOW ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {liveRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
                    {isLoading ? 'Fetching records from ServiceNow...' : 'No records found or click Refresh to query.'}
                  </TableCell>
                </TableRow>
              ) : (
                liveRecords.map((rec) => (
                  <TableRow key={rec.sysId} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {rec.ritmNumber}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                      {rec.shortDescription || '(No short description)'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      <Chip
                        size="small"
                        label={rec.state}
                        color={rec.state === 'Open' ? 'info' : 'default'}
                        sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {rec.createdOn}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        endIcon={<OpenInNewOutlined sx={{ fontSize: '13px !important' }} />}
                        href={rec.directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ fontSize: '0.72rem', py: 0.3, fontWeight: 600 }}
                      >
                        Open in ServiceNow
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
