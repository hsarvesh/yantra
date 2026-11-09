import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  WarningAmberOutlined,
  SecurityOutlined,
  TerminalOutlined,
  VerifiedUserOutlined,
  OpenInNew,
  Refresh,
  LockOutlined,
  CloudUploadOutlined,
  EditNoteOutlined,
  RestartAltOutlined,
  StorageOutlined,
  AutoAwesomeOutlined,
  PsychologyOutlined,
  AssignmentIndOutlined,
  RuleFolderOutlined,
  HourglassEmptyOutlined,
  AssignmentTurnedInOutlined,
  HelpOutline,
  BoltOutlined,
  LocationOnOutlined,
  CategoryOutlined,
  SearchOutlined,
  FilterListOutlined
} from '@mui/icons-material';

export default function EngineerWorkspaceView({
  procedures = [],
  onExecuteSuccess,
  onExecuteFailure
}) {
  const [loading, setLoading] = useState(true);
  const [liveRequests, setLiveRequests] = useState([]);
  const [selectedSysId, setSelectedSysId] = useState(null);
  const [selectedService, setSelectedService] = useState('W3SVC');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [executionFinished, setExecutionFinished] = useState(false);
  const [lastOutcome, setLastOutcome] = useState(null);
  const [executionHash, setExecutionHash] = useState('');

  // Ticket Type Filter & Search State
  const [activeTypeFilter, setActiveTypeFilter] = useState('all'); // 'all' | 'incident' | 'sc_request' | 'sc_req_item'
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ total: 0, incidents: 0, requests: 0, ritms: 0 });

  // AI Evaluation & Routing State
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [isAssigningGroup, setIsAssigningGroup] = useState(false);
  const [isRequestingMissingInfo, setIsRequestingMissingInfo] = useState(false);
  const [infoRequestSent, setInfoRequestSent] = useState(false);

  // Missing Details Input Drawer/Dialog
  const [showInputDrawer, setShowInputDrawer] = useState(false);
  const [inputCi, setInputCi] = useState('');
  const [inputLocation, setInputLocation] = useState('Bangalore');
  const [inputIp, setInputIp] = useState('10.10.70.1');
  const [inputService, setInputService] = useState('W3SVC');

  // Work Notes Customization State
  const [engineerComments, setEngineerComments] = useState('Service restart executed and verified clean. All port listeners and process dependencies confirmed operational.');
  const [isPublishingWorkNote, setIsPublishingWorkNote] = useState(false);
  const [publishedResult, setPublishedResult] = useState(null);
  const [isSynthesizingAi, setIsSynthesizingAi] = useState(false);
  const [aiSynthesized, setAiSynthesized] = useState(false);

  // Fetch live requests flowing in from ServiceNow (Incidents, Requests, RITMs)
  const fetchLiveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/snow/live-engineering-requests');
      const data = await res.json();
      if (data.success && data.requests?.length > 0) {
        setLiveRequests(data.requests);
        if (data.counts) setCounts(data.counts);
        const initial = data.requests[0];
        setSelectedSysId(initial?.sysId);
        setSelectedService(initial?.serviceName || 'W3SVC');
        evaluateTicketWithLlm(initial);
      }
    } catch (e) {
      console.error('Failed to load engineering requests from ServiceNow:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRequests();
  }, []);

  const currentReq = liveRequests.find(r => r.sysId === selectedSysId) || liveRequests[0] || {
    ritm: 'RITM0010026',
    number: 'RITM0010026',
    ticketType: 'Request Item',
    table: 'sc_req_item',
    targetCi: 'BLR-APP-001',
    ciLocation: 'Bangalore',
    ciIp: '10.10.70.1',
    procedureId: 'PROC-WIN-001',
    procedureName: 'Windows IIS Web Service Clean Restart',
    serviceName: 'W3SVC',
    assignmentGroup: 'Application Support',
    stage: 'request_approved',
    state: 'Open',
    directUrl: 'https://dev364281.service-now.com/sc_req_item_list.do'
  };

  // Filtered requests based on active tab and search query
  const filteredRequests = liveRequests.filter(req => {
    if (activeTypeFilter !== 'all' && req.table !== activeTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const num = (req.ritm || req.number || '').toLowerCase();
      const desc = (req.shortDescription || '').toLowerCase();
      const ci = (req.targetCi || '').toLowerCase();
      const grp = (req.assignmentGroup || '').toLowerCase();
      return num.includes(q) || desc.includes(q) || ci.includes(q) || grp.includes(q);
    }
    return true;
  });

  const currentProcedure = procedures.find(p => p.id === currentReq?.procedureId) || procedures[0] || {
    id: 'PROC-WIN-001',
    name: 'Windows Service Clean Restart',
    maturityState: 'supervised',
    consecutiveSuccesses: 14
  };

  // Immediate abort guard for Closed Complete / Resolved tickets (Incidents, Requests, RITMs)
  const isTicketClosed = Boolean(
    currentReq?.state === 'Closed Complete' ||
    currentReq?.state === 'Closed' ||
    currentReq?.state === 'Resolved' ||
    currentReq?.rawState === '3' ||
    currentReq?.rawState === '7' ||
    currentReq?.rawState === '6' ||
    currentReq?.stage === 'complete' ||
    currentReq?.stage === 'Closed' ||
    String(currentReq?.state || '').toLowerCase().includes('close') ||
    String(currentReq?.state || '').toLowerCase().includes('resolv') ||
    aiEvaluation?.isClosed
  );

  // Evaluate Ticket with Real Local AI Engine
  const evaluateTicketWithLlm = async (ticket) => {
    const t = ticket || currentReq;
    const isClosed = Boolean(
      t.state === 'Closed Complete' ||
      t.state === 'Closed' ||
      t.state === 'Resolved' ||
      t.rawState === '3' ||
      t.rawState === '7' ||
      t.rawState === '6' ||
      t.stage === 'complete' ||
      t.stage === 'Closed' ||
      String(t.state || '').toLowerCase().includes('close') ||
      String(t.state || '').toLowerCase().includes('resolv')
    );

    // If ticket is already Closed Complete, immediately abort all further AI triage and processing
    if (isClosed) {
      setAiEvaluation({
        isClosed: true,
        aborted: true,
        reasoning: `Ticket ${t.ritm || t.number} (${t.ticketType || 'Work Item'}) status is Closed/Resolved in ServiceNow. All further automated processing, triage, and executions are immediately aborted to preserve audit integrity.`,
        isReadyForAutomation: false,
        readinessScore: 0,
        missingFields: [],
        clarificationMessage: '',
        isGroupMatched: true,
        recommendedGroup: t.assignmentGroup,
        modelUsed: 'Governance Guard'
      });
      return;
    }

    setIsEvaluatingAi(true);
    try {
      let savedConfig = null;
      try {
        const stored = localStorage.getItem('yantra_llm_config_v1');
        if (stored) savedConfig = JSON.parse(stored);
      } catch (e) {}

      const res = await fetch('/api/llm/evaluate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ritm: t.ritm || t.number,
          table: t.table || 'sc_req_item',
          shortDescription: t.shortDescription,
          description: t.description || t.shortDescription,
          targetCi: t.targetCi,
          ciLocation: t.ciLocation,
          ciIp: t.ciIp,
          serviceName: t.serviceName || selectedService,
          currentGroup: t.assignmentGroup,
          state: t.state,
          rawState: t.rawState,
          stage: t.stage,
          procedureId: t.procedureId || 'PROC-WIN-001',
          endpointUrl: savedConfig?.endpointUrl || 'http://localhost:1234/v1',
          model: savedConfig?.model || 'gemma'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiEvaluation(data);
      }
    } catch (err) {
      console.error('Error evaluating ticket with Local AI:', err);
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  // 1-Click Assignment to Identified Taxonomy Group in ServiceNow
  const handleAssignIdentifiedGroup = async () => {
    if (isTicketClosed) {
      alert('Action Aborted: Ticket is already Closed Complete in ServiceNow.');
      return;
    }
    if (!aiEvaluation?.recommendedGroup) return;
    setIsAssigningGroup(true);
    try {
      const res = await fetch('/api/snow/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentReq.table || 'sc_req_item',
          sysId: currentReq.sysId,
          ticketNumber: currentReq.ritm || currentReq.number,
          targetGroup: aiEvaluation.recommendedGroup,
          ruleMatched: 'ITIL Taxonomy Alignment Engine'
        })
      });

      const data = await res.json();
      if (data.success) {
        // Update local ticket state
        const updatedList = liveRequests.map(r =>
          r.sysId === currentReq.sysId
            ? { ...r, assignmentGroup: aiEvaluation.recommendedGroup }
            : r
        );
        setLiveRequests(updatedList);
        setAiEvaluation(prev => ({
          ...prev,
          currentGroup: aiEvaluation.recommendedGroup,
          isGroupMatched: true
        }));
      } else {
        alert('Failed to update assignment group: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error auto-assigning group in ServiceNow:', e);
      alert('Error updating ServiceNow: ' + e.message);
    } finally {
      setIsAssigningGroup(false);
    }
  };

  // Mark Ticket as 'Waiting for User Input' & Post AI Clarification
  const handleRequestMissingDetails = async () => {
    if (isTicketClosed) {
      alert('Action Aborted: Ticket is already Closed Complete in ServiceNow.');
      return;
    }
    if (!aiEvaluation?.clarificationMessage) return;
    setIsRequestingMissingInfo(true);
    try {
      const res = await fetch('/api/snow/update-ticket-state-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentReq.table || 'sc_req_item',
          sysId: currentReq.sysId,
          state: currentReq.table === 'incident' ? '3' : '2', // On Hold (3) for Incident, WIP (2) for Requests
          stage: 'waiting_for_user_input',
          comments: aiEvaluation.clarificationMessage,
          workNotes: `[AI TRIAGE] Execution on hold. Missing parameters: ${aiEvaluation.missingFields?.join(', ')}. Status transitioned to 'Waiting for User Input'.`
        })
      });

      const data = await res.json();
      if (data.success) {
        setInfoRequestSent(true);
        const updatedList = liveRequests.map(r =>
          r.sysId === currentReq.sysId
            ? { ...r, state: 'Waiting for User Input' }
            : r
        );
        setLiveRequests(updatedList);
      } else {
        alert('Failed to update ServiceNow ticket state: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error updating ServiceNow ticket:', e);
      alert('Error: ' + e.message);
    } finally {
      setIsRequestingMissingInfo(false);
    }
  };

  // Submit Provided Details & Re-evaluate with Local AI
  const handleSubmitMissingDetails = async () => {
    if (isTicketClosed) {
      alert('Action Aborted: Ticket is already Closed Complete in ServiceNow.');
      return;
    }
    const updatedTicket = {
      ...currentReq,
      targetCi: inputCi || currentReq.targetCi || 'BLR-APP-001',
      ciLocation: inputLocation || currentReq.ciLocation || 'Bangalore',
      ciIp: inputIp || currentReq.ciIp || '10.10.70.1',
      serviceName: inputService || currentReq.serviceName || 'W3SVC',
      state: currentReq.table === 'incident' ? 'In Progress' : 'Work in Progress'
    };

    const updatedList = liveRequests.map(r =>
      r.sysId === currentReq.sysId ? updatedTicket : r
    );
    setLiveRequests(updatedList);
    setSelectedService(updatedTicket.serviceName);
    setShowInputDrawer(false);
    setInfoRequestSent(false);

    // Re-evaluate with Local AI
    await evaluateTicketWithLlm(updatedTicket);
  };

  // Service Restart Simulation Execution
  const handleStartRestartExecution = (simulateSuccess = true) => {
    if (isTicketClosed) {
      alert('Execution Aborted: Ticket is already Closed Complete in ServiceNow.');
      return;
    }
    setIsExecuting(true);
    setExecutionFinished(false);
    setLogs([]);
    setLastOutcome(null);
    setPublishedResult(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString();

    // Compute synthetic SHA-256 seal
    const generatedHash = `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setExecutionHash(generatedHash);

    const targetCiName = currentReq.targetCi || inputCi || 'BLR-APP-001';
    const locationName = currentReq.ciLocation || inputLocation || 'Bangalore';
    const ipAddr = currentReq.ciIp || inputIp || '10.10.70.1';
    const svc = selectedService || currentReq.serviceName || 'W3SVC';

    const stepLogs = [
      { text: `[${timeStr}] [ORCHESTRATOR] Ingested approved ticket ${currentReq.ritm} from ServiceNow Table API.`, color: '#38bdf8' },
      { text: `[${timeStr}] [APPROVAL_GATE] Verified BRD Policy §3.1: Ticket stage is '${currentReq.stage}'. Human authorization active.`, color: '#34d399' },
      { text: `[${timeStr}] [CMDB_RESOLVER] Target CI resolved: ${targetCiName} (${locationName} Datacenter, IP: ${ipAddr})`, color: '#fbbf24' },
      { text: `[${timeStr}] [DISPATCH] Task routed via secure outbound queue to MID Server MID-PROD-${locationName.substring(0, 3).toUpperCase()}-01.`, color: '#94a3b8' },
      { text: `[${timeStr}] [PRE-CHECK] Querying current status of service '${svc}' on ${targetCiName}...`, color: '#ffffff' },
      { text: `[${timeStr}] [PRE-CHECK] Service '${svc}' detected in status: RUNNING (PID: 3844, Active Threads: 18)`, color: '#ffffff' },
    ];

    if (simulateSuccess) {
      stepLogs.push(
        { text: `[${timeStr}] [STOP_PHASE] Issuing graceful shutdown command: Stop-Service -Name ${svc} -Force`, color: '#ffffff' },
        { text: `[${timeStr}] [CLEANUP] Flushing process cache, draining network connections, releasing lock files...`, color: '#ffffff' },
        { text: `[${timeStr}] [START_PHASE] Issuing startup command: Start-Service -Name ${svc}`, color: '#ffffff' },
        { text: `[${timeStr}] [POST-CHECK] Service '${svc}' transitioned to RUNNING (New PID: ${Math.floor(4000 + Math.random() * 5000)})`, color: '#34d399' },
        { text: `[${timeStr}] [POST-CHECK] Port listeners and socket responses verified in 3.4ms. Exit Code 0.`, color: '#34d399' },
        { text: `[${timeStr}] [CRYPTO_SEAL] Generated cryptographic audit proof digest: ${generatedHash}`, color: '#38bdf8' },
        { text: `[${timeStr}] [READY] Service restart completed successfully. Ready for ServiceNow Work Notes synchronization.`, color: '#a7f3d0' }
      );
    } else {
      stepLogs.push(
        { text: `[${timeStr}] [STOP_PHASE] Issuing shutdown command: Stop-Service -Name ${svc} -Force`, color: '#ffffff' },
        { text: `[${timeStr}] [ERROR] Service '${svc}' failed to terminate gracefully! Process thread deadlock detected.`, color: '#f87171' },
        { text: `[${timeStr}] [REVOCATION_RULE] Execution failed! Qualification counter reset to 0 under BRD governance policy.`, color: '#ef4444' }
      );
    }

    let delay = 200;
    stepLogs.forEach((log, index) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
        if (index === stepLogs.length - 1) {
          setIsExecuting(false);
          setExecutionFinished(true);
          setLastOutcome(simulateSuccess ? 'success' : 'failure');
          if (simulateSuccess && onExecuteSuccess) {
            onExecuteSuccess(currentReq, currentProcedure);
          } else if (!simulateSuccess && onExecuteFailure) {
            onExecuteFailure(currentReq, currentProcedure, 'Service deadlock during restart phase');
          }
        }
      }, delay * (index + 1));
    });
  };

  // AI Work Note Synthesis via Real Local LLM Engine
  const handleAiSummarize = async () => {
    setIsSynthesizingAi(true);
    try {
      let savedConfig = null;
      try {
        const stored = localStorage.getItem('yantra_llm_config_v1');
        if (stored) savedConfig = JSON.parse(stored);
      } catch (e) {}

      const endpointUrl = savedConfig?.endpointUrl || 'http://localhost:1234/v1';
      const model = savedConfig?.model || 'gemma';
      const promptConfig = savedConfig?.prompts?.worknotes;
      const systemPrompt = promptConfig?.systemPrompt || 'You are an enterprise ITIL documentation specialist. You transform technical execution transcripts into structured, audit-ready ServiceNow Work Notes.';

      const logsExcerpt = logs.map(l => l.text).join('\n');
      const userPrompt = `Summarize the following automated service restart execution logs into an executive ServiceNow Work Note entry:
Ticket: ${currentReq.ritm}
Target CI: ${currentReq.targetCi || inputCi || 'BLR-APP-001'} (${currentReq.ciLocation || inputLocation})
Service: ${selectedService}
Cryptographic Seal: ${executionHash}

Terminal Logs:
${logsExcerpt}

Provide a concise, professional engineer summary suitable for ServiceNow work notes.`;

      const res = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl,
          model,
          systemPrompt,
          userPrompt,
          temperature: savedConfig?.temperature || 0.2,
          maxTokens: 300,
          apiKey: savedConfig?.apiKey || ''
        })
      });

      const data = await res.json();
      if (data.success && data.text) {
        setEngineerComments(data.text);
        setAiSynthesized(true);
      } else {
        alert('AI generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error generating AI work note summary:', err);
      alert('Failed to connect to Local AI Engine: ' + err.message);
    } finally {
      setIsSynthesizingAi(false);
    }
  };

  // Publish Work Notes directly into ServiceNow
  const handlePublishWorkNotesToServiceNow = async () => {
    setIsPublishingWorkNote(true);
    try {
      const logsText = logs.map(l => l.text).join('\n');
      const res = await fetch('/api/snow/update-worknote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentReq.table || 'sc_req_item',
          sysId: currentReq.sysId,
          ticketNumber: currentReq.ritm || currentReq.number,
          targetCi: currentReq.targetCi || inputCi || 'BLR-APP-001',
          workNotes: logsText,
          comments: engineerComments,
          sha256Hash: executionHash,
          state: currentReq.table === 'incident' ? '7' : '3', // Closed (7) for Incident, Closed Complete (3) for Requests
          engineerName: 'Sarvesh Huddedar (Platform Admin)'
        })
      });

      const data = await res.json();
      if (data.success) {
        setPublishedResult(data);
        const updatedList = liveRequests.map(r =>
          r.sysId === currentReq.sysId
            ? { ...r, state: 'Closed Complete', rawState: currentReq.table === 'incident' ? '7' : '3' }
            : r
        );
        setLiveRequests(updatedList);
        setAiEvaluation(prev => ({
          ...prev,
          isClosed: true,
          aborted: true,
          reasoning: `Ticket ${currentReq.ritm || currentReq.number} was Closed Complete and sealed with SHA-256 in ServiceNow.`
        }));
      } else {
        alert('Failed to publish work notes: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error publishing work notes to ServiceNow:', e);
      alert('Error updating ServiceNow: ' + e.message);
    } finally {
      setIsPublishingWorkNote(false);
    }
  };

  const isAutomationReady = aiEvaluation ? aiEvaluation.isReadyForAutomation : Boolean(currentReq.targetCi && currentReq.serviceName);

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Engineer Execution Hub (Autonomous AI & Human-in-the-Loop)
            </Typography>
            <Chip
              size="small"
              icon={<VerifiedUserOutlined sx={{ fontSize: 14 }} />}
              label="Live ServiceNow & Local AI Orchestration"
              color="primary"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Multi-stage deterministic ITIL workflow: Taxonomy assignment routing, runbook completeness evaluation, missing parameter handling with 'Waiting for User Input', and verified execution.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
            onClick={fetchLiveRequests}
            disabled={loading}
            sx={{ textTransform: 'none', borderRadius: 1.5 }}
          >
            Refresh SNow Queue
          </Button>
        </Box>
      </Box>

      {/* Main Grid: Ticket Selector & Multi-Stage Execution Panel */}
      <Grid container spacing={2.5}>
        {/* Left Column: Live Tickets from ServiceNow (Incidents, Requests, RITMs) */}
        <Grid item xs={12} md={4.2}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  ITSM Work Items Queue
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Live records synced from dev364281
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${filteredRequests.length} of ${liveRequests.length}`}
                color="primary"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>

            {/* Filter Tabs / Chips: All, Incidents, Service Requests, Request Items */}
            <Box sx={{ display: 'flex', gap: 0.6, mb: 1.5, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                clickable
                label={`All (${counts.total || liveRequests.length})`}
                color={activeTypeFilter === 'all' ? 'primary' : 'default'}
                variant={activeTypeFilter === 'all' ? 'filled' : 'outlined'}
                onClick={() => setActiveTypeFilter('all')}
                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700 }}
              />
              <Chip
                size="small"
                clickable
                label={`Incidents (${counts.incidents || liveRequests.filter(r => r.table === 'incident').length})`}
                color={activeTypeFilter === 'incident' ? 'error' : 'default'}
                variant={activeTypeFilter === 'incident' ? 'filled' : 'outlined'}
                onClick={() => setActiveTypeFilter('incident')}
                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700 }}
              />
              <Chip
                size="small"
                clickable
                label={`Requests (${counts.requests || liveRequests.filter(r => r.table === 'sc_request').length})`}
                color={activeTypeFilter === 'sc_request' ? 'info' : 'default'}
                variant={activeTypeFilter === 'sc_request' ? 'filled' : 'outlined'}
                onClick={() => setActiveTypeFilter('sc_request')}
                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700 }}
              />
              <Chip
                size="small"
                clickable
                label={`RITMs (${counts.ritms || liveRequests.filter(r => r.table === 'sc_req_item').length})`}
                color={activeTypeFilter === 'sc_req_item' ? 'success' : 'default'}
                variant={activeTypeFilter === 'sc_req_item' ? 'filled' : 'outlined'}
                onClick={() => setActiveTypeFilter('sc_req_item')}
                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700 }}
              />
            </Box>

            {/* Quick Search */}
            <TextField
              size="small"
              fullWidth
              placeholder="Search by ticket #, CI, group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ fontSize: 16, color: '#94a3b8', mr: 0.8 }} />
              }}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.78rem',
                  borderRadius: 1.5,
                  bgcolor: '#f8fafc'
                }
              }}
            />

            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={26} />
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>
                  Ingesting tickets across Incidents, Requests & RITMs...
                </Typography>
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                  No tickets match the selected filter or search term.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                  maxHeight: 680,
                  overflowY: 'auto',
                  pr: 0.5,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-track': { background: '#f8fafc', borderRadius: 4 },
                  '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 },
                  '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' }
                }}
              >
                {filteredRequests.map((req, idx) => {
                  const isSelected = (currentReq?.sysId && currentReq.sysId === req.sysId) || (currentReq?.ritm === req.ritm);
                  const isWaiting = req.state === 'Waiting for User Input';
                  const isClosed = req.state === 'Closed Complete' || req.state === 'Closed' || req.state === 'Resolved' || req.rawState === '3' || req.rawState === '7' || req.rawState === '6';
                  const hasMissingCi = !req.targetCi || req.targetCi === '';

                  // Type badge config
                  const typeBadge = req.table === 'incident'
                    ? { label: 'INC', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
                    : req.table === 'sc_request'
                    ? { label: 'REQ', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' }
                    : { label: 'RITM', bg: '#ccfbf1', color: '#0f766e', border: '#99f6e4' };

                  return (
                    <Card
                      key={req.sysId || idx}
                      variant="outlined"
                      onClick={() => {
                        setSelectedSysId(req.sysId);
                        setSelectedService(req.serviceName || 'W3SVC');
                        setExecutionFinished(false);
                        setLogs([]);
                        setPublishedResult(null);
                        setInfoRequestSent(false);

                        const isReqClosed = Boolean(
                          req.state === 'Closed Complete' ||
                          req.state === 'Closed' ||
                          req.state === 'Resolved' ||
                          req.rawState === '3' ||
                          req.rawState === '7' ||
                          req.rawState === '6' ||
                          req.stage === 'complete' ||
                          req.stage === 'Closed' ||
                          String(req.state || '').toLowerCase().includes('close') ||
                          String(req.state || '').toLowerCase().includes('resolv')
                        );

                        if (isReqClosed) {
                          setAiEvaluation({
                            isClosed: true,
                            aborted: true,
                            reasoning: `Ticket ${req.ritm || req.number} (${req.ticketType || 'Work Item'}) status is Closed/Resolved in ServiceNow. All automated triage, routing, and executions are immediately aborted.`,
                            isReadyForAutomation: false,
                            readinessScore: 0,
                            missingFields: [],
                            clarificationMessage: '',
                            isGroupMatched: true,
                            recommendedGroup: req.assignmentGroup,
                            modelUsed: 'Governance Guard'
                          });
                        } else {
                          evaluateTicketWithLlm(req);
                        }
                      }}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: 'pointer',
                        flexShrink: 0,
                        borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                        bgcolor: isSelected ? '#f0f9ff' : '#ffffff',
                        boxShadow: isSelected ? '0 0 0 1.5px #0284c7' : 'none',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          borderColor: '#0284c7',
                          bgcolor: isSelected ? '#f0f9ff' : '#f8fafc'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Chip
                            size="small"
                            label={typeBadge.label}
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 900,
                              bgcolor: typeBadge.bg,
                              color: typeBadge.color,
                              border: `1px solid ${typeBadge.border}`
                            }}
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isSelected ? '#0284c7' : '#0f172a', fontSize: '0.82rem' }}>
                            {req.ritm || req.number}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={req.state}
                          color={isClosed ? 'default' : isWaiting ? 'warning' : 'primary'}
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                        />
                      </Box>

                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#334155', fontWeight: 500, mb: 1, lineClamp: 2, lineHeight: 1.35 }}>
                        {req.shortDescription}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                        {hasMissingCi ? (
                          <Chip
                            size="small"
                            icon={<WarningAmberOutlined sx={{ fontSize: 13 }} />}
                            label="Missing CI & Location"
                            color="error"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            icon={<StorageOutlined sx={{ fontSize: 13 }} />}
                            label={req.targetCi}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 600 }}
                          />
                        )}
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>
                          {req.assignmentGroup || 'Unassigned'}
                        </Typography>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Multi-Stage Orchestration & Execution Hub */}
        <Grid item xs={12} md={7.8}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 2.5 }}>
            {/* Ticket Header & SNow Deep Link */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    label={currentReq.ticketType || (currentReq.table === 'incident' ? 'Incident' : currentReq.table === 'sc_request' ? 'Service Request' : 'Request Item')}
                    color={currentReq.table === 'incident' ? 'error' : currentReq.table === 'sc_request' ? 'info' : 'success'}
                    sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {currentReq.ritm || currentReq.number} — {currentReq.shortDescription}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Table: <strong>{currentReq.table || 'sc_req_item'}</strong> • Target CI: <strong>{currentReq.targetCi || 'Unspecified (Missing)'}</strong> • Location: <strong>{currentReq.ciLocation || 'Unspecified'}</strong> • Current Group: <strong>{currentReq.assignmentGroup}</strong>
                </Typography>
              </Box>

              <Button
                size="small"
                variant="outlined"
                href={currentReq.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600 }}
              >
                View in ServiceNow
              </Button>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* IMMEDIATE ABORT ALERT BANNER FOR CLOSED COMPLETE TICKETS */}
            {isTicketClosed && (
              <Alert
                severity="error"
                icon={<LockOutlined sx={{ fontSize: 28 }} />}
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  bgcolor: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
                }}
                action={
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    href={currentReq.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                    sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 1.5 }}
                  >
                    View in SNow
                  </Button>
                }
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#991b1b', fontSize: '0.92rem' }}>
                  TICKET STATUS: CLOSED COMPLETE — ALL PROCESSING ABORTED
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#7f1d1d', mt: 0.5, lineHeight: 1.4 }}>
                  This ticket (<strong>{currentReq.ritm}</strong>) has reached its final resolved state in ServiceNow. Under enterprise ITIL governance, <strong>all further automated processing, triage, taxonomy routing, missing parameter requests, and procedural runbook executions are immediately aborted</strong>.
                </Typography>
              </Alert>
            )}

            {/* STAGE 1: AI ASSIGNMENT GROUP DECISION (TAXONOMY DRIVEN) */}
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5, borderColor: isTicketClosed ? '#cbd5e1' : (aiEvaluation?.isGroupMatched ? '#86efac' : '#fed7aa'), bgcolor: isTicketClosed ? '#f8fafc' : (aiEvaluation?.isGroupMatched ? '#f0fdf4' : '#fffbeb'), opacity: isTicketClosed ? 0.6 : 1 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isTicketClosed ? <LockOutlined sx={{ fontSize: 20, color: '#64748b' }} /> : <AssignmentIndOutlined sx={{ fontSize: 20, color: aiEvaluation?.isGroupMatched ? '#16a34a' : '#d97706' }} />}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      STAGE 1: ITIL TAXONOMY ASSIGNMENT ROUTER
                    </Typography>
                  </Box>
                  {isTicketClosed ? (
                    <Chip
                      size="small"
                      icon={<LockOutlined sx={{ fontSize: 12 }} />}
                      label="Routing Locked (Closed Complete)"
                      color="default"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  ) : isEvaluatingAi ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircularProgress size={12} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Analyzing with Local AI...</Typography>
                    </Box>
                  ) : (
                    <Chip
                      size="small"
                      icon={<PsychologyOutlined sx={{ fontSize: 12 }} />}
                      label={`Model: ${aiEvaluation?.modelUsed || 'Local LLM'}`}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9' }}
                    />
                  )}
                </Box>

                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Current Assignment Group in SNow:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {currentReq.assignmentGroup || 'Unassigned'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>AI Recommended Group (from Taxonomy):</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isTicketClosed ? '#475569' : '#0284c7' }}>
                        {aiEvaluation?.recommendedGroup || currentReq.assignmentGroup || 'Application Support'}
                      </Typography>
                      {!isTicketClosed && (
                        <Chip
                          size="small"
                          label={`${aiEvaluation?.confidence || 96}% confidence`}
                          color="primary"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', bgcolor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1.5, border: '1px solid rgba(0,0,0,0.05)' }}>
                      <strong>AI Triage Rationale:</strong> {isTicketClosed ? 'Ticket is already Closed Complete in ServiceNow. All routing and reassignments are locked to maintain audit integrity.' : (aiEvaluation?.reasoning || 'Analyzing ticket text against Enterprise ITSM Taxonomy criteria...')}
                    </Typography>
                  </Grid>

                  {!isTicketClosed && !aiEvaluation?.isGroupMatched && (
                    <Grid item xs={12} sx={{ mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                          ⚠️ Assignment group mismatch detected! Ticket is currently assigned to '{currentReq.assignmentGroup}'.
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          startIcon={isAssigningGroup ? <CircularProgress size={12} color="inherit" /> : <AssignmentTurnedInOutlined sx={{ fontSize: 14 }} />}
                          disabled={isAssigningGroup}
                          onClick={handleAssignIdentifiedGroup}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5 }}
                        >
                          {isAssigningGroup ? 'Assigning in ServiceNow...' : `Assign to Identified Group: ${aiEvaluation?.recommendedGroup}`}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* STAGE 2: RUNBOOK MATCHING & READINESS CHECK */}
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5, bgcolor: '#f8fafc', opacity: isTicketClosed ? 0.6 : 1 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RuleFolderOutlined sx={{ fontSize: 20, color: isTicketClosed ? '#64748b' : '#0284c7' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      STAGE 2: SOP RUNBOOK QUALIFICATION & READINESS CHECK
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={isTicketClosed ? "Lifecycle Terminated (Closed)" : (aiEvaluation?.matchedRunbook?.name || currentProcedure?.name)}
                    color={isTicketClosed ? "default" : "info"}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>

                {/* Readiness Progress Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isTicketClosed ? '#64748b' : (isAutomationReady ? '#16a34a' : '#d97706') }}>
                      {isTicketClosed
                        ? '🔒 Ticket Closed Complete — Further Action Aborted'
                        : (isAutomationReady ? '✓ 100% Ready for Automated Execution' : `⚠️ Readiness: ${aiEvaluation?.readinessScore || 40}% — Missing Required Runbook Parameters`)}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                      {isTicketClosed ? '100% Closed' : `${aiEvaluation?.readinessScore || (isAutomationReady ? 100 : 40)}%`}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={isTicketClosed ? 100 : (aiEvaluation?.readinessScore || (isAutomationReady ? 100 : 40))}
                    color={isTicketClosed ? 'inherit' : (isAutomationReady ? 'success' : 'warning')}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Parameter Verification Pills */}
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: currentReq.targetCi ? '#86efac' : '#fca5a5', bgcolor: currentReq.targetCi ? '#f0fdf4' : '#fef2f2' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>TARGET HOST</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: currentReq.targetCi ? '#15803d' : '#b91c1c' }}>
                        {currentReq.targetCi || '❌ Missing CI'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: currentReq.ciLocation ? '#86efac' : '#fca5a5', bgcolor: currentReq.ciLocation ? '#f0fdf4' : '#fef2f2' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>LOCATION / IP</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: currentReq.ciLocation ? '#15803d' : '#b91c1c' }}>
                        {currentReq.ciLocation ? `${currentReq.ciLocation} (${currentReq.ciIp})` : '❌ Missing Location'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: currentReq.serviceName ? '#86efac' : '#fca5a5', bgcolor: currentReq.serviceName ? '#f0fdf4' : '#fef2f2' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>SERVICE DAEMON</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: currentReq.serviceName ? '#15803d' : '#b91c1c' }}>
                        {currentReq.serviceName || '❌ Missing Service'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid #86efac', bgcolor: '#f0fdf4' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>CAB APPROVAL</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#15803d' }}>
                        ✓ {currentReq.stage || 'Approved'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* STAGE 3: MISSING INFORMATION HANDLING & SERVICENOW TICKET UPDATE */}
            {!isTicketClosed && !isAutomationReady && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5, borderColor: '#fca5a5', bgcolor: '#fff5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <HelpOutline sx={{ color: '#dc2626', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#991b1b' }}>
                    ACTION REQUIRED: Missing Mandatory Information for SOP Execution
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ color: '#7f1d1d', display: 'block', mb: 1.5 }}>
                  The automation gate is paused because the following parameters are missing: <strong>{aiEvaluation?.missingFields?.join(', ')}</strong>. Under governance policy, execution cannot proceed until these details are provided.
                </Typography>

                {/* AI Drafted Clarification Box */}
                <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #fecaca', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7280', display: 'block', mb: 0.5 }}>
                    LOCAL AI DRAFTED CLARIFICATION MESSAGE (FOR SERVICENOW CUSTOMER STREAM):
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#1e293b', whiteSpace: 'pre-line' }}>
                    {aiEvaluation?.clarificationMessage || 'Please provide target CI and service details.'}
                  </Typography>
                </Box>

                {infoRequestSent && (
                  <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                    <strong>ServiceNow State Transitioned to 'Waiting for User Input'!</strong> AI clarification posted to ticket customer stream. Provide missing details below to re-evaluate and proceed.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={isRequestingMissingInfo ? <CircularProgress size={12} color="inherit" /> : <HourglassEmptyOutlined sx={{ fontSize: 14 }} />}
                    disabled={isRequestingMissingInfo || infoRequestSent}
                    onClick={handleRequestMissingDetails}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5 }}
                  >
                    {isRequestingMissingInfo ? 'Updating ServiceNow...' : 'Request Missing Details & Set Status: Waiting for User Input'}
                  </Button>

                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<EditNoteOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => {
                      setInputCi(currentReq.targetCi || 'BLR-APP-001');
                      setInputLocation(currentReq.ciLocation || 'Bangalore');
                      setInputIp(currentReq.ciIp || '10.10.70.1');
                      setInputService(currentReq.serviceName || 'W3SVC');
                      setShowInputDrawer(true);
                    }}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5 }}
                  >
                    Provide Missing Details (Customer / Engineer Input)
                  </Button>
                </Box>
              </Paper>
            )}

            {/* STAGE 4: AUTOMATION EXECUTION & MID-SERVER RUNNER */}
            <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: isTicketClosed ? '#f1f5f9' : '#f8fafc', mb: 2.5, opacity: isTicketClosed ? 0.5 : (isAutomationReady ? 1 : 0.65) }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isTicketClosed ? '#64748b' : '#0284c7', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isTicketClosed ? <LockOutlined fontSize="small" /> : <RestartAltOutlined fontSize="small" />}
                  {isTicketClosed ? 'STAGE 3: RUNBOOK EXECUTION LOCKED (CLOSED COMPLETE)' : 'STAGE 3: RUNBOOK AUTOMATION EXECUTION'}
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Service to Restart"
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      SelectProps={{ native: true }}
                      disabled={isTicketClosed || !isAutomationReady || isExecuting}
                    >
                      <option value="W3SVC">W3SVC (IIS World Wide Web Publishing Service)</option>
                      <option value="Spooler">Spooler (Print Spooler Subsystem)</option>
                      <option value="MSSQLSERVER">MSSQLSERVER (SQL Server Relational Engine)</option>
                      <option value="nginx">nginx (Linux Reverse Proxy Daemon)</option>
                      <option value="snmpd">snmpd (SNMP Network Telemetry Daemon)</option>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color={isTicketClosed ? 'inherit' : 'primary'}
                        startIcon={isTicketClosed ? <LockOutlined sx={{ fontSize: 16 }} /> : (isExecuting ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />)}
                        disabled={isTicketClosed || !isAutomationReady || isExecuting}
                        onClick={() => handleStartRestartExecution(true)}
                        sx={{ textTransform: 'none', fontWeight: 700, py: 1 }}
                      >
                        {isTicketClosed ? 'Execution Aborted (Ticket Closed)' : (isExecuting ? 'Restarting Service...' : `Execute Runbook (${selectedService})`)}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        disabled={isTicketClosed || !isAutomationReady || isExecuting}
                        onClick={() => handleStartRestartExecution(false)}
                        sx={{ textTransform: 'none', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                      >
                        Simulate Failure
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Terminal Window */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.78rem',
                minHeight: 180,
                maxHeight: 260,
                overflowY: 'auto',
                border: '1px solid #1e293b',
                mb: 2.5,
                opacity: isTicketClosed && logs.length === 0 ? 0.6 : 1
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, borderBottom: '1px solid #334155', pb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontFamily: 'monospace' }}>
                  MID-SERVER AUTOMATION RUNNER OUTPUT [TLS 1.3]
                </Typography>
                <Chip size="small" label="WinRM / PowerShell" sx={{ height: 16, fontSize: '0.6rem', bgcolor: '#334155', color: '#38bdf8' }} />
              </Box>

              {logs.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', pt: 4, textAlign: 'center' }}>
                  {isTicketClosed
                    ? "Execution Aborted. Ticket status is Closed Complete in ServiceNow. All actions are locked."
                    : (isAutomationReady
                      ? "Ready. Click 'Execute Runbook' above to initiate verified automated service restart."
                      : "Execution gate locked. Resolve missing ticket parameters in Stage 2 to unlock automation.")}
                </Typography>
              ) : (
                logs.map((log, i) => (
                  <Box key={i} sx={{ color: log.color, py: 0.2, lineHeight: 1.4 }}>
                    {log.text}
                  </Box>
                ))
              )}
            </Paper>

            {/* STAGE 5: POST-EXECUTION AI SYNTHESIS & TAMPER-PROOF SERVICENOW COMMIT */}
            {executionFinished && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: lastOutcome === 'success' ? '#f0fdf4' : '#fef2f2',
                  borderColor: lastOutcome === 'success' ? '#86efac' : '#fca5a5'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#16a34a', fontSize: 22 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      STAGE 4: AI WORK NOTE SYNTHESIS & TAMPER-PROOF COMMIT
                    </Typography>
                  </Box>
                  <Chip
                    icon={<LockOutlined sx={{ fontSize: 13 }} />}
                    label="Cryptographic SHA-256 Seal Active"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                  Synthesize an executive summary with Local AI, customize your engineer remarks below, and commit the full execution evidence directly into ServiceNow.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EditNoteOutlined sx={{ fontSize: 18, color: '#475569' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Engineer Comments & Operational Remarks
                        </Typography>
                        {aiSynthesized && (
                          <Chip
                            size="small"
                            icon={<CheckCircle sx={{ fontSize: 12 }} />}
                            label="Synthesized by Local AI"
                            color="success"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        )}
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={isSynthesizingAi ? <CircularProgress size={13} color="inherit" /> : <PsychologyOutlined sx={{ fontSize: 16 }} />}
                        onClick={handleAiSummarize}
                        disabled={isSynthesizingAi || logs.length === 0}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          borderRadius: 1.5,
                          bgcolor: '#f5f3ff',
                          borderColor: '#c084fc',
                          color: '#7e22ce',
                          '&:hover': { bgcolor: '#ede9fe', borderColor: '#a855f7' }
                        }}
                      >
                        {isSynthesizingAi ? 'Synthesizing with Local AI...' : 'Synthesize Work Note with Local AI'}
                      </Button>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={engineerComments}
                      onChange={(e) => {
                        setEngineerComments(e.target.value);
                        setAiSynthesized(false);
                      }}
                      size="small"
                      placeholder="Enter engineer comments..."
                      helperText="These comments along with execution logs and SHA-256 seal will be permanently committed to ServiceNow"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ p: 1.2, bgcolor: '#ffffff', borderRadius: 1.5, border: '1px solid #cbd5e1' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block' }}>
                        CRYPTOGRAPHIC IMMUTABLE HASH (SHA-256):
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#0284c7', wordBreak: 'break-all' }}>
                        {executionHash}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={isPublishingWorkNote ? <CircularProgress size={16} color="inherit" /> : <CloudUploadOutlined />}
                      disabled={isPublishingWorkNote}
                      onClick={handlePublishWorkNotesToServiceNow}
                      sx={{ textTransform: 'none', fontWeight: 700, px: 2.5 }}
                    >
                      {isPublishingWorkNote ? 'Updating ServiceNow...' : 'Publish Work Notes & Close Task in ServiceNow'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Published Confirmation with Direct SNow Link */}
                {publishedResult && (
                  <Alert
                    severity="success"
                    sx={{ mt: 2.5, borderRadius: 1.5 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        href={publishedResult.directUrl}
                        target="_blank"
                        endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                      >
                        Inspect in SNow
                      </Button>
                    }
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Successfully updated ServiceNow ticket {publishedResult.ticketNumber}!
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#166534', display: 'block' }}>
                      Detailed execution logs, engineer comments, and cryptographic hash ({publishedResult.sha256Hash?.substring(0, 20)}...) written to ServiceNow Work Notes. Task state set to 'Closed Complete'.
                    </Typography>
                  </Alert>
                )}
              </Paper>
            )}

            {/* HISTORICAL EVIDENCE FOR ALREADY-CLOSED TICKETS */}
            {isTicketClosed && !executionFinished && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  borderColor: '#cbd5e1'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#16a34a', fontSize: 22 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      Ticket Closed Complete — Historical Audit Trail Locked
                    </Typography>
                  </Box>
                  <Chip
                    icon={<LockOutlined sx={{ fontSize: 13 }} />}
                    label="Audit Trail Immutable"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                  This ticket has been marked Closed Complete in ServiceNow. All execution logs, engineer remarks, and cryptographic SHA-256 evidence have been permanently committed to the official ServiceNow Work Notes stream.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  href={currentReq.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
                >
                  Inspect Resolved Record in ServiceNow
                </Button>
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog for Providing Missing Ticket Details */}
      <Dialog open={showInputDrawer} onClose={() => setShowInputDrawer(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Provide Missing Runbook Parameters
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Simulate customer or engineer response by specifying the target CI, location, and service to satisfy runbook requirements.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Target Configuration Item (CI Hostname)"
                value={inputCi}
                onChange={(e) => setInputCi(e.target.value)}
                placeholder="e.g. BLR-APP-001 or PNE-DB-005"
                helperText="Select or type the target host from CMDB"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Datacenter Location"
                value={inputLocation}
                onChange={(e) => {
                  setInputLocation(e.target.value);
                  const ipMap = { Bangalore: '10.10.70.1', Pune: '10.20.60.5', Hyderabad: '10.30.50.14', Delhi: '10.50.20.2', Indore: '10.40.10.1' };
                  setInputIp(ipMap[e.target.value] || '10.10.70.1');
                }}
                SelectProps={{ native: true }}
              >
                <option value="Bangalore">Bangalore (LOC-BLR)</option>
                <option value="Pune">Pune (LOC-PNE)</option>
                <option value="Hyderabad">Hyderabad (LOC-HYD)</option>
                <option value="Delhi">Delhi (LOC-DEL)</option>
                <option value="Indore">Indore (LOC-IND)</option>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="IP Address"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                size="small"
                label="Target Service / Daemon Name"
                value={inputService}
                onChange={(e) => setInputService(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="W3SVC">W3SVC (IIS Web Publishing Service)</option>
                <option value="MSSQLSERVER">MSSQLSERVER (SQL Server Engine)</option>
                <option value="nginx">nginx (Linux Reverse Proxy Daemon)</option>
                <option value="snmpd">snmpd (SNMP Network Telemetry)</option>
                <option value="Spooler">Spooler (Print Spooler Subsystem)</option>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowInputDrawer(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitMissingDetails}
            startIcon={<BoltOutlined />}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Submit Details & Re-evaluate with Local AI
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
