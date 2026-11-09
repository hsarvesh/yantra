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
  Slider,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Alert,
  AlertTitle,
  Paper,
  CircularProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  PsychologyOutlined,
  SmartToyOutlined,
  LanOutlined,
  SpeedOutlined,
  CheckCircle,
  WarningAmberOutlined,
  ErrorOutline,
  Refresh,
  SaveOutlined,
  FileDownloadOutlined,
  PlayArrow,
  SecurityOutlined,
  HubOutlined,
  AutoFixHighOutlined,
  FactCheckOutlined,
  CodeOutlined,
  TuneOutlined,
  LockOutlined,
  TerminalOutlined
} from '@mui/icons-material';

const STORAGE_KEY = 'yantra_llm_config_v1';

export const defaultLlmConfig = {
  provider: 'lmstudio',
  endpointUrl: 'http://localhost:1234/v1',
  apiKey: '',
  model: 'llama-3.2-3b-instruct',
  temperature: 0.2,
  maxTokens: 600,
  topP: 0.9,
  prompts: {
    triage: {
      id: 'triage',
      title: 'Ticket Triage & CMDB CI Resolution',
      description: 'Parses raw ticket descriptions and identifies the target CI among the 2,815 imported inventory items.',
      systemPrompt: 'You are an intelligent ITIL Service Request parser for enterprise infrastructure. You analyze incident and request text and accurately map them to registered Configuration Items (CIs) in the CMDB.',
      template: 'Analyze the following service request description and identify the failing or target Configuration Item (CI):\n\nTicket: {{ticket_number}}\nDescription: {{ticket_description}}\n\nAvailable Target CI Classes: Domain Controllers (BLR-DC-*, PNE-DC-*), Application Servers (BLR-APP-*, PNE-APP-*), Database Hosts (BLR-DB-*, PNE-DB-*), Network Switches/Routers, and End User Devices.\n\nRespond with:\n1. Target CI Name\n2. Primary Suspected Service\n3. Urgency Assessment',
      variables: ['{{ticket_number}}', '{{ticket_description}}']
    },
    routing: {
      id: 'routing',
      title: 'Support Group Auto-Assignment Routing',
      description: 'Directs tickets to the optimal ITIL Support Group among the 12 active enterprise groups.',
      systemPrompt: 'You are an automated ITIL dispatch engine. Your role is to classify tickets and determine the best-qualified assignment group with zero human triage delay.',
      template: 'Based on the ticket description below, recommend the appropriate ITIL Support Group:\n\nTicket: {{ticket_number}}\nTarget CI: {{target_ci}}\nSummary: {{ticket_description}}\n\nActive Support Groups:\n- Server Infrastructure\n- Network Services\n- Application Support\n- End User Computing\n- Facilities IT\n- Security\n- Telephony\n- Cloud Services\n\nProvide the single most appropriate group and brief rationale.',
      variables: ['{{ticket_number}}', '{{target_ci}}', '{{ticket_description}}']
    },
    remediation: {
      id: 'remediation',
      title: 'Service Restart Remediation Planner',
      description: 'Formulates safe pre-checks, graceful stop sequence, cache flush, and post-restart validation steps.',
      systemPrompt: 'You are an autonomous Site Reliability and Windows/Linux systems engineer. You formulate safe, idempotent service restart execution plans with zero downtime risk.',
      template: 'Generate a step-by-step service restart remediation plan for:\nTarget Host: {{target_ci}} (IP: {{ci_ip}}, Location: {{ci_location}})\nTarget Service: {{service_name}}\n\nInclude:\n1. Pre-execution port and PID inspection\n2. Graceful stop command\n3. Temporary cache and lock file purge\n4. Service startup invocation\n5. Post-validation port listener confirmation',
      variables: ['{{target_ci}}', '{{ci_ip}}', '{{ci_location}}', '{{service_name}}']
    },
    worknotes: {
      id: 'worknotes',
      title: 'ServiceNow Work Notes & Cryptographic Digest Generator',
      description: 'Synthesizes raw terminal logs into an executive, audit-ready ServiceNow Work Note including engineer justification and SHA-256 seal.',
      systemPrompt: 'You are an enterprise ITIL documentation specialist. You transform technical execution transcripts into structured, audit-ready ServiceNow Work Notes with tamper-resistant cryptographic hashes.',
      template: 'Summarize the following automated execution logs into an official ServiceNow Work Note entry:\n\nTicket: {{ticket_number}}\nTarget CI: {{target_ci}}\nOperator: {{operator_name}}\nExecution Timestamp: {{timestamp}}\nCryptographic Seal: {{sha256_hash}}\n\nTerminal Logs:\n{{execution_logs}}\n\nEngineer Remarks:\n{{engineer_comments}}\n\nFormat as a concise executive summary followed by key verification metrics and the permanent SHA-256 evidence block.',
      variables: ['{{ticket_number}}', '{{target_ci}}', '{{operator_name}}', '{{timestamp}}', '{{sha256_hash}}', '{{execution_logs}}', '{{engineer_comments}}']
    }
  }
};

export default function LlmConfigView({ onNotification }) {
  const [config, setConfig] = useState(defaultLlmConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activePromptTab, setActivePromptTab] = useState(0);

  // Model Discovery State
  const [discoveredModels, setDiscoveredModels] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState(null);

  // Validation Testing State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Prompt Sandbox Test State
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState('');

  // Localhost Boundary Check
  const isLocalEndpoint = /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(config.endpointUrl);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read LLM config from localStorage', e);
    }
    // Auto-discover models on mount
    handleDiscoverModels();
  }, []);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePromptChange = (promptKey, field, value) => {
    setConfig(prev => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [promptKey]: {
          ...prev.prompts[promptKey],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setHasUnsavedChanges(false);
      if (onNotification) onNotification('Local AI & LLM Engine configuration saved successfully.', 'success');
    } catch (e) {
      if (onNotification) onNotification('Failed to save LLM configuration: ' + e.message, 'error');
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `yantra_llm_config_${new Date().toISOString().substring(0, 10)}.json`);
    dlAnchor.click();
    dlAnchor.remove();
    if (onNotification) onNotification('LLM Configuration exported as JSON.', 'info');
  };

  const handleResetDefaults = () => {
    setConfig(defaultLlmConfig);
    setHasUnsavedChanges(true);
    if (onNotification) onNotification('Reset settings to default local configuration.', 'warning');
  };

  // 1. Discover Models from Endpoint
  const handleDiscoverModels = async () => {
    setIsDiscovering(true);
    setDiscoveryStatus(null);
    try {
      const res = await fetch('/api/llm/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          provider: config.provider,
          apiKey: config.apiKey
        })
      });
      const data = await res.json();
      if (data.success && data.models?.length > 0) {
        setDiscoveredModels(data.models);
        setDiscoveryStatus(`Discovered ${data.models.length} local models from ${data.endpointUrl}`);
        // If current model not in list, select first
        if (!data.models.some(m => m.id === config.model)) {
          handleConfigChange('model', data.models[0].id);
        }
      } else {
        setDiscoveryStatus('No active models discovered at endpoint.');
      }
    } catch (err) {
      console.error('Model discovery error:', err);
      setDiscoveryStatus('Discovery probe failed: ' + err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  // 2. Validate Selected Configuration with Basic Test Prompt
  const handleValidateConfiguration = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          model: config.model,
          apiKey: config.apiKey
        })
      });
      const data = await res.json();
      setValidationResult(data);
      if (onNotification) {
        if (data.success) {
          onNotification(`LLM Engine Validated! Model '${config.model}' responded in ${data.latencyMs}ms.`, 'success');
        } else {
          onNotification('LLM Validation Failed: ' + (data.error || 'No response'), 'error');
        }
      }
    } catch (err) {
      setValidationResult({
        success: false,
        error: err.message
      });
      if (onNotification) onNotification('Validation error: ' + err.message, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // 3. Test Prompt Sandbox
  const handleRunSandbox = async (promptKey) => {
    setSandboxRunning(true);
    setSandboxOutput('');
    const promptObj = config.prompts[promptKey];

    // Mock variable replacements
    let userPromptFilled = promptObj.template
      .replace(/{{ticket_number}}/g, 'RITM0010026')
      .replace(/{{ticket_description}}/g, 'User unable to access finance portal. IIS Web Service appears frozen on Bangalore application host.')
      .replace(/{{target_ci}}/g, 'BLR-APP-001')
      .replace(/{{ci_ip}}/g, '10.10.70.1')
      .replace(/{{ci_location}}/g, 'Bangalore')
      .replace(/{{service_name}}/g, 'W3SVC')
      .replace(/{{operator_name}}/g, 'Sarvesh Huddedar')
      .replace(/{{timestamp}}/g, new Date().toISOString())
      .replace(/{{sha256_hash}}/g, 'SHA256:7d2b58c738ef918a221f7e034e389d71c1f7b80a1e')
      .replace(/{{execution_logs}}/g, '[PRE-CHECK] Resolving BLR-APP-001: WinRM OK\n[STOP] Stopping W3SVC -Force... OK\n[START] Starting W3SVC... PID 4192 active\n[POST-CHECK] Port 443 responsive in 3ms')
      .replace(/{{engineer_comments}}/g, 'Clean service recycle performed under supervised mode. Zero transaction impact.');

    try {
      const res = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          model: config.model,
          systemPrompt: promptObj.systemPrompt,
          userPrompt: userPromptFilled,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          apiKey: config.apiKey
        })
      });
      const data = await res.json();
      setSandboxOutput(data.text || 'No response text generated.');
    } catch (err) {
      setSandboxOutput('Sandbox generation failed: ' + err.message);
    } finally {
      setSandboxRunning(false);
    }
  };

  const promptKeys = ['triage', 'routing', 'remediation', 'worknotes'];
  const currentPromptKey = promptKeys[activePromptTab];
  const currentPrompt = config.prompts[currentPromptKey];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Top Breadcrumb & Title */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', fontSize: '0.8rem', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>ADMINISTRATION</Typography>
          <span>/</span>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>TOOLS CONFIGURATION</Typography>
          <span>/</span>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed' }}>LOCAL AI & LLM ENGINE</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <PsychologyOutlined sx={{ color: '#7c3aed', fontSize: 32 }} />
              Local AI & LLM Engine Configuration Hub
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.3 }}>
              Connect local on-premises models (Ollama, LM Studio), auto-discover installed weights, tune operational prompts, and validate connectivity with interactive diagnostic probes.
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
              Reset Defaults
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              onClick={handleValidateConfiguration}
              disabled={isValidating}
              sx={{ textTransform: 'none', bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontWeight: 700 }}
            >
              {isValidating ? 'Validating...' : 'Validate & Test Model'}
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

      {/* Security & Boundary Warning Banner */}
      {!isLocalEndpoint ? (
        <Alert
          severity="warning"
          icon={<WarningAmberOutlined sx={{ fontSize: 24 }} />}
          sx={{ mb: 3, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}
        >
          <AlertTitle sx={{ fontWeight: 800, color: '#92400e' }}>
            DATA SOVEREIGNTY WARNING: Non-Local AI Endpoint Configured
          </AlertTitle>
          <Typography variant="body2" sx={{ color: '#b45309', fontSize: '0.82rem' }}>
            The current endpoint (<code>{config.endpointUrl}</code>) is <strong>not hosted on localhost (127.0.0.1)</strong>. Sensitive ServiceNow ticket descriptions, infrastructure hostnames, internal IPs, and execution logs will be transmitted across external network boundaries. For complete data privacy and enterprise compliance, run an on-premises model using <strong>Ollama (port 11434)</strong> or <strong>LM Studio (port 1234)</strong>.
          </Typography>
        </Alert>
      ) : (
        <Alert
          severity="success"
          icon={<SecurityOutlined sx={{ fontSize: 24 }} />}
          sx={{ mb: 3, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <AlertTitle sx={{ fontWeight: 800, color: '#166534' }}>
            100% On-Premises & Data Sovereign Local AI Active
          </AlertTitle>
          <Typography variant="body2" sx={{ color: '#15803d', fontSize: '0.82rem' }}>
            Endpoint is bound to <code>{config.endpointUrl}</code>. All prompt processing, ticket triage, and work note generation runs strictly inside this machine with <strong>zero external cloud exposure</strong>.
          </Typography>
        </Alert>
      )}

      {/* SECTION 1: ENDPOINT & MODEL DISCOVERY CARD */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanOutlined sx={{ color: '#7c3aed' }} /> Local AI Provider & Model Auto-Discovery
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Select your local runtime and probe for installed weights.
            </Typography>
          </Box>

          {/* Provider Presets */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={config.provider === 'lmstudio' ? 'contained' : 'outlined'}
              onClick={() => {
                handleConfigChange('provider', 'lmstudio');
                handleConfigChange('endpointUrl', 'http://localhost:1234/v1');
              }}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600 }}
            >
              LM Studio (1234)
            </Button>
            <Button
              size="small"
              variant={config.provider === 'ollama' ? 'contained' : 'outlined'}
              onClick={() => {
                handleConfigChange('provider', 'ollama');
                handleConfigChange('endpointUrl', 'http://localhost:11434');
              }}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600 }}
            >
              Ollama (11434)
            </Button>
            <Button
              size="small"
              variant={config.provider === 'custom_local' ? 'contained' : 'outlined'}
              onClick={() => {
                handleConfigChange('provider', 'custom_local');
                handleConfigChange('endpointUrl', 'http://localhost:8080/v1');
              }}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600 }}
            >
              Custom Local (8080)
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Local Engine Endpoint URL"
              value={config.endpointUrl}
              onChange={(e) => handleConfigChange('endpointUrl', e.target.value)}
              helperText="Local HTTP API address (e.g. http://localhost:1234/v1 or http://localhost:11434)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Selected Model Weight"
                value={config.model}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                SelectProps={{ native: true }}
                helperText={discoveryStatus || 'Select active model for ITIL task generation'}
              >
                {discoveredModels.length > 0 ? (
                  discoveredModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.size})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="llama-3.2-3b-instruct">llama-3.2-3b-instruct (2.02 GB)</option>
                    <option value="qwen2.5-coder-7b-instruct">qwen2.5-coder-7b-instruct (4.68 GB)</option>
                    <option value="deepseek/deepseek-r1-0528-qwen3-8b">deepseek-r1-qwen3-8b (5.03 GB)</option>
                    <option value="microsoft/phi-4-mini-reasoning">phi-4-mini-reasoning (2.49 GB)</option>
                  </>
                )}
              </TextField>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={isDiscovering ? <CircularProgress size={14} /> : <Refresh />}
                disabled={isDiscovering}
                onClick={handleDiscoverModels}
                sx={{ whiteSpace: 'nowrap', textTransform: 'none', height: 40, mt: 0.2 }}
              >
                Discover Models
              </Button>
            </Box>
          </Grid>

          {/* Hyperparameters */}
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
              TEMPERATURE: {config.temperature} (DETERMINISTIC & AUDITABLE)
            </Typography>
            <Slider
              value={config.temperature}
              min={0.0}
              max={1.0}
              step={0.05}
              onChange={(e, val) => handleConfigChange('temperature', val)}
              valueLabelDisplay="auto"
              size="small"
              sx={{ color: '#7c3aed' }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max Output Tokens"
              value={config.maxTokens}
              onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="API Key / Auth Bearer (Optional)"
              value={config.apiKey}
              onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              placeholder="Leave empty for local Ollama/LM Studio"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SECTION 2: INTERACTIVE VALIDATION & TESTING FEATURE */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
              <FactCheckOutlined sx={{ color: '#16a34a' }} /> Engine Validation & Live Probe Test
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Validates that the selected endpoint and model are operational by sending a lightweight test probe and confirming output.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="success"
            startIcon={isValidating ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
            disabled={isValidating}
            onClick={handleValidateConfiguration}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
          >
            {isValidating ? 'Probing Engine...' : 'Test Selected Configuration'}
          </Button>
        </Box>

        {validationResult && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: validationResult.success ? '#f0fdf4' : '#fef2f2',
                border: '1px solid',
                borderColor: validationResult.success ? '#bbf7d0' : '#fecaca',
                mb: 2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {validationResult.success ? (
                    <CheckCircle sx={{ color: '#16a34a', fontSize: 22 }} />
                  ) : (
                    <ErrorOutline sx={{ color: '#dc2626', fontSize: 22 }} />
                  )}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: validationResult.success ? '#166534' : '#991b1b' }}>
                    {validationResult.success ? 'LLM ENGINE CONFIRMED & READY' : 'LLM ENGINE VALIDATION FAILED'}
                  </Typography>
                </Box>

                {validationResult.latencyMs && (
                  <Chip
                    icon={<SpeedOutlined sx={{ fontSize: 14 }} />}
                    label={`${validationResult.latencyMs} ms`}
                    size="small"
                    color="success"
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.82rem', mb: 1 }}>
                Model Response:
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: '#ffffff',
                  borderRadius: 1.5,
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: '#0f172a'
                }}
              >
                {validationResult.response || validationResult.error || 'No response data.'}
              </Paper>
            </Box>
          </Box>
        )}
      </Paper>

      {/* SECTION 3: PROMPT TEMPLATE DIRECTORY (ACTIVITY DIRECTION) */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: '1px solid #e2e8f0', px: 2, pt: 1 }}>
          <Tabs
            value={activePromptTab}
            onChange={(e, val) => setActivePromptTab(val)}
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
            <Tab icon={<AutoFixHighOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="1. Ticket Triage & CI Resolution" />
            <Tab icon={<HubOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="2. Support Group Routing" />
            <Tab icon={<TuneOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="3. Service Restart Remediation" />
            <Tab icon={<LockOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="4. ServiceNow Work Notes & SHA-256 Digest" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {currentPrompt.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {currentPrompt.description}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={sandboxRunning ? <CircularProgress size={14} /> : <TerminalOutlined />}
              disabled={sandboxRunning}
              onClick={() => handleRunSandbox(currentPromptKey)}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
            >
              {sandboxRunning ? 'Executing...' : 'Test Prompt with Sample Data'}
            </Button>
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="System Prompt / Persona"
                value={currentPrompt.systemPrompt}
                onChange={(e) => handlePromptChange(currentPromptKey, 'systemPrompt', e.target.value)}
                size="small"
                helperText="Defines the behavior, governance boundaries, and persona of the local model"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={7}
                label="User Prompt Template (Supports Dynamic Placeholders)"
                value={currentPrompt.template}
                onChange={(e) => handlePromptChange(currentPromptKey, 'template', e.target.value)}
                sx={{
                  fontFamily: 'Consolas, Monaco, monospace',
                  '& textarea': { fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.82rem' }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  AVAILABLE DYNAMIC TAGS:
                </Typography>
                {currentPrompt.variables.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: '0.72rem', height: 22 }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Live Prompt Sandbox Output */}
            {sandboxOutput && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#0f172a',
                    color: '#38bdf8',
                    border: '1px solid #1e293b'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, borderBottom: '1px solid #334155', pb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace' }}>
                      LOCAL MODEL GENERATION OUTPUT [{config.model}]
                    </Typography>
                    <Chip size="small" label="Evaluated" color="success" sx={{ height: 16, fontSize: '0.62rem', fontWeight: 700 }} />
                  </Box>
                  <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.78rem', color: '#f8fafc' }}>
                    {sandboxOutput}
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
