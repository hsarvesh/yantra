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
  FilterListOutlined,
  MemoryOutlined,
  SchoolOutlined,
  SendOutlined,
  ChatBubbleOutline,
  BookmarkAddedOutlined,
  HistoryEduOutlined,
  LightbulbOutlined,
  TuneOutlined,
  CloseOutlined,
  SaveOutlined,
  FileDownloadOutlined,
  Check,
  ContentCopy,
  EditOutlined,
  DeleteOutline,
  AddCircleOutline,
  PlayCircleOutline
} from '@mui/icons-material';
import { PageHeader } from './ui';

const TAXONOMY_GROUPS = [
  'Application Support',
  'Server Infrastructure',
  'Network Services',
  'End User Computing',
  'Access Management',
  'Cloud Services',
  'Security',
  'Email & Collaboration',
  'Facilities IT',
  'Monitoring & Operations',
  'Asset Management',
  'Telephony'
];

export default function EngineerWorkspaceView({
  procedures = [],
  onExecuteSuccess,
  onExecuteFailure
}) {
  const [loading, setLoading] = useState(true);
  const [liveRequests, setLiveRequests] = useState([]);
  const [selectedSysId, setSelectedSysId] = useState(null);
  const [selectedService, setSelectedService] = useState('');
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
  const [inputLocation, setInputLocation] = useState('');
  const [inputIp, setInputIp] = useState('');
  const [inputService, setInputService] = useState('');

  // Work Notes Customization State
  const [engineerComments, setEngineerComments] = useState('Service restart executed and verified clean. All port listeners and process dependencies confirmed operational.');
  const [isPublishingWorkNote, setIsPublishingWorkNote] = useState(false);
  const [publishedResult, setPublishedResult] = useState(null);
  const [isSynthesizingAi, setIsSynthesizingAi] = useState(false);
  const [aiSynthesized, setAiSynthesized] = useState(false);

  // Soul Memory (soul.txt) Persistent State
  const [soulData, setSoulData] = useState({ rules: [], totalRules: 0, content: '' });
  const [showSoulModal, setShowSoulModal] = useState(false);
  const [showTeachModal, setShowTeachModal] = useState(false);
  const [isCommittingSoul, setIsCommittingSoul] = useState(false);
  const [teachStage, setTeachStage] = useState('Triage / Assignment Routing');
  const [teachCriteria, setTeachCriteria] = useState('');
  const [teachDefaultRec, setTeachDefaultRec] = useState('');
  const [teachEngineerDecision, setTeachEngineerDecision] = useState('Application Support');
  const [teachRule, setTeachRule] = useState('');
  const [teachReason, setTeachReason] = useState('');
  const [teachAuthor, setTeachAuthor] = useState('Sarvesh Huddedar (Engineer)');
  const [soulSearchQuery, setSoulSearchQuery] = useState('');

  // Soul Rule Edit & Delete State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [isDeletingRule, setIsDeletingRule] = useState(false);

  // Interactive Local LLM Co-Pilot Chat State
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Local AI Co-Pilot powered by local llama.cpp on port 8080. I have ingested your ServiceNow CMDB and active rules from soul.txt. How can I assist you with this ticket?',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputChatMessage, setInputChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Fetch Soul Memory (soul.txt)
  const fetchSoulMemory = async () => {
    try {
      const res = await fetch('/api/soul/read');
      const data = await res.json();
      if (data.success) {
        setSoulData(data);
      }
    } catch (e) {
      console.error('Failed to read soul.txt:', e);
    }
  };

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
        setSelectedService(initial?.serviceName || '');
        evaluateTicketWithLlm(initial, false);
      }
    } catch (e) {
      console.error('Failed to load engineering requests from ServiceNow:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRequests();
    fetchSoulMemory();
  }, []);

  const currentReq = liveRequests.find(r => r.sysId === selectedSysId) || liveRequests[0] || {
    ritm: '',
    number: '',
    ticketType: 'Work Item',
    table: 'incident',
    targetCi: '',
    ciLocation: '',
    ciIp: '',
    procedureId: '',
    procedureName: '',
    serviceName: '',
    assignmentGroup: '',
    stage: 'New',
    state: 'New',
    directUrl: ''
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

  const currentProcedure = procedures.find(p => p.id === currentReq?.procedureId) || null;

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

  // Evaluate Ticket with Real Local AI Engine & Soul Memory
  const evaluateTicketWithLlm = async (ticket, callLlm = false) => {
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
        recommendedGroup: t.assignmentGroup || 'Unassigned',
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
          table: t.table || 'incident',
          shortDescription: t.shortDescription,
          description: t.description || t.shortDescription,
          targetCi: t.targetCi || '',
          ciLocation: t.ciLocation || '',
          ciIp: t.ciIp || '',
          serviceName: t.serviceName || selectedService || '',
          currentGroup: t.assignmentGroup || '',
          state: t.state,
          rawState: t.rawState,
          stage: t.stage,
          procedureId: t.procedureId || '',
          callLlm,
          endpointUrl: savedConfig?.endpointUrl || 'http://localhost:8080/v1',
          model: savedConfig?.model || '/models/Qwen3-0.6B-Q4_K_M-Instruct.gguf'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiEvaluation(data);
        fetchSoulMemory();
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
    return handleAssignGroupDirect(aiEvaluation.recommendedGroup, 'ITIL Taxonomy Alignment Engine');
  };

  // Direct Group Assignment in ServiceNow
  const handleAssignGroupDirect = async (targetGroupName, ruleReason = 'Engineer Override / Soul Memory Rule') => {
    if (isTicketClosed) {
      alert('Action Aborted: Ticket is already Closed Complete in ServiceNow.');
      return false;
    }
    if (!targetGroupName) return false;
    setIsAssigningGroup(true);
    try {
      const res = await fetch('/api/snow/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: currentReq.table || 'sc_req_item',
          sysId: currentReq.sysId,
          ticketNumber: currentReq.ritm || currentReq.number,
          targetGroup: targetGroupName,
          ruleMatched: ruleReason
        })
      });

      const data = await res.json();
      if (data.success) {
        const updatedList = liveRequests.map(r =>
          r.sysId === currentReq.sysId
            ? { ...r, assignmentGroup: targetGroupName }
            : r
        );
        setLiveRequests(updatedList);
        setAiEvaluation(prev => prev ? ({
          ...prev,
          currentGroup: targetGroupName,
          recommendedGroup: targetGroupName,
          isGroupMatched: true,
          reasoning: `Reassigned to '${targetGroupName}' in ServiceNow (${ruleReason}).`
        }) : null);
        return true;
      } else {
        alert('Failed to update ServiceNow: ' + (data.error || 'Unknown error'));
        return false;
      }
    } catch (e) {
      console.error('Error assigning group in ServiceNow:', e);
      alert('Error updating ServiceNow: ' + e.message);
      return false;
    } finally {
      setIsAssigningGroup(false);
    }
  };

  // Open the Teach Modal prefilled for Routing override
  const openTeachModalForRouting = (overrideGroup = 'Application Support') => {
    setTeachStage('Triage / Assignment Routing');
    setTeachCriteria(`Service restart requested for ${currentReq.serviceName || 'service'} (CI: ${currentReq.targetCi || 'unspecified'})`);
    setTeachDefaultRec(aiEvaluation?.recommendedGroup || currentReq.assignmentGroup || 'Server Infrastructure (OS Team)');
    setTeachEngineerDecision(overrideGroup);
    setTeachRule(`When a service restart is requested for ${currentReq.serviceName || 'web/application services'}, route to ${overrideGroup} instead of Server Infrastructure.`);
    setTeachReason(`Service restarts on ${currentReq.serviceName || 'application'} daemons directly affect application users and require ${overrideGroup} team verification.`);
    setShowTeachModal(true);
  };

  // Commit Decision to soul.txt
  const handleCommitSoulDecision = async () => {
    if (!teachRule.trim()) {
      alert('Please enter an operational rule to remember in soul.txt');
      return;
    }
    setIsCommittingSoul(true);
    try {
      const res = await fetch('/api/soul/commit-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: teachStage,
          ticketNumber: currentReq.ritm || currentReq.number || 'MANUAL-INPUT',
          criteria: teachCriteria || `Service request for ${currentReq.targetCi || 'target CI'}`,
          defaultRecommendation: teachDefaultRec || aiEvaluation?.recommendedGroup || 'Server Infrastructure',
          engineerDecision: teachEngineerDecision,
          rule: teachRule,
          reason: teachReason || 'Engineer operational policy override',
          author: teachAuthor || 'Sarvesh Huddedar (Engineer)'
        })
      });

      const data = await res.json();
      if (data.success) {
        await fetchSoulMemory();
        setShowTeachModal(false);

        // Apply group reassignment directly if routing decision
        if (teachStage.includes('Routing') && teachEngineerDecision) {
          await handleAssignGroupDirect(teachEngineerDecision, `Soul Memory Rule [${data.ruleId}]`);
        }

        // Re-evaluate with updated soul memory
        evaluateTicketWithLlm(currentReq);

        alert(`Decision successfully recorded into soul.txt as ${data.ruleId}!\n\nThe Local AI Engine will now remember this rule for all future tickets.`);
      } else {
        alert('Failed to record decision: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error committing to soul.txt:', e);
      alert('Error writing to soul.txt: ' + e.message);
    } finally {
      setIsCommittingSoul(false);
    }
  };

  // Open Edit Modal for an existing rule
  const handleOpenEditRule = (rule) => {
    setEditingRule({
      id: rule.id || '',
      stage: rule.stage || 'Triage / Assignment Routing',
      ticketNumber: rule.ticketNumber || rule.ticket || 'MANUAL-INPUT',
      criteria: rule.criteria || '',
      defaultRecommendation: rule.defaultRecommendation || '',
      engineerDecision: rule.engineerDecision || 'Application Support',
      rule: rule.rule || '',
      reason: rule.reason || '',
      author: rule.author || 'Sarvesh Huddedar (Engineer)',
      timestamp: rule.timestamp || ''
    });
    setShowEditModal(true);
  };

  // Save edited rule to soul.txt
  const handleSaveEditedRule = async () => {
    if (!editingRule?.rule?.trim()) {
      alert('Operational rule formulation is required.');
      return;
    }
    setIsSavingRule(true);
    try {
      const res = await fetch('/api/soul/update-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule)
      });
      const data = await res.json();
      if (data.success) {
        await fetchSoulMemory();
        setShowEditModal(false);
        evaluateTicketWithLlm(currentReq);
        alert(`Rule [${editingRule.id}] updated successfully in soul.txt!`);
      } else {
        alert('Failed to update rule: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error updating rule in soul.txt:', e);
      alert('Error updating rule: ' + e.message);
    } finally {
      setIsSavingRule(false);
    }
  };

  // Delete rule from soul.txt
  const handleDeleteRule = async (ruleId) => {
    if (!ruleId) return;
    if (!window.confirm(`Are you sure you want to permanently delete rule [${ruleId}] from soul.txt?\n\nThe Local LLM will no longer use this rule for future evaluations.`)) {
      return;
    }
    setIsDeletingRule(true);
    try {
      const res = await fetch('/api/soul/delete-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchSoulMemory();
        evaluateTicketWithLlm(currentReq);
        alert(`Rule [${ruleId}] deleted successfully from soul.txt!`);
      } else {
        alert('Failed to delete rule: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Error deleting rule from soul.txt:', e);
      alert('Error deleting rule: ' + e.message);
    } finally {
      setIsDeletingRule(false);
    }
  };

  // Open Create Rule Modal
  const handleOpenCreateRule = () => {
    setTeachStage('Triage / Assignment Routing');
    setTeachCriteria(`Service restart requested for ${currentReq?.serviceName || 'service'} (CI: ${currentReq?.targetCi || 'unspecified'})`);
    setTeachDefaultRec(aiEvaluation?.recommendedGroup || currentReq?.assignmentGroup || 'Server Infrastructure (OS Team)');
    setTeachEngineerDecision('Application Support');
    setTeachRule('');
    setTeachReason('');
    setTeachAuthor('Sarvesh Huddedar (Engineer)');
    setShowTeachModal(true);
  };

  // Send interactive message to Local LLM Co-Pilot
  const handleSendInteractiveChat = async (presetText) => {
    const textToSend = presetText || inputChatMessage;
    if (!textToSend.trim()) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setInputChatMessage('');
    setIsSendingChat(true);

    try {
      let savedConfig = null;
      try {
        const stored = localStorage.getItem('yantra_llm_config_v1');
        if (stored) savedConfig = JSON.parse(stored);
      } catch (e) {}

      const res = await fetch('/api/llm/interactive-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketContext: {
            ritm: currentReq.ritm || currentReq.number,
            table: currentReq.table,
            shortDescription: currentReq.shortDescription,
            description: currentReq.description || currentReq.shortDescription,
            targetCi: currentReq.targetCi,
            ciLocation: currentReq.ciLocation,
            ciIp: currentReq.ciIp,
            serviceName: currentReq.serviceName || selectedService,
            assignmentGroup: currentReq.assignmentGroup,
            state: currentReq.state,
            stage: currentReq.stage
          },
          messages: chatMessages,
          userMessage: textToSend,
          endpointUrl: savedConfig?.endpointUrl || 'http://localhost:8080/v1',
          model: savedConfig?.model || '/models/Qwen3-0.6B-Q4_K_M-Instruct.gguf'
        })
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString(),
            tokensPerSec: data.tokensPerSec,
            latencyMs: data.latencyMs,
            model: data.model
          }
        ]);
      }
    } catch (e) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Local LLM communication error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString(),
          isError: true
        }
      ]);
    } finally {
      setIsSendingChat(false);
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
      targetCi: inputCi || currentReq.targetCi || '',
      ciLocation: inputLocation || currentReq.ciLocation || '',
      ciIp: inputIp || currentReq.ciIp || '',
      serviceName: inputService || currentReq.serviceName || '',
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
    await evaluateTicketWithLlm(updatedTicket, false);
  };

  // Service Restart Simulation Execution
  const handleStartRestartExecution = (simulateSuccess = true) => {
    if (isTicketClosed) {
      alert('Execution Aborted: Ticket is already Closed Complete in ServiceNow.');
      return;
    }
    const targetCiName = currentReq.targetCi || inputCi || '';
    const locationName = currentReq.ciLocation || inputLocation || 'Unknown Datacenter';
    const ipAddr = currentReq.ciIp || inputIp || 'DHCP/CMDB';
    const svc = selectedService || currentReq.serviceName || '';

    if (!targetCiName || !svc) {
      alert('Execution Aborted: Target Host and Service Daemon must be specified before initiating execution.');
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
Target CI: ${currentReq.targetCi || inputCi || '—'} (${currentReq.ciLocation || inputLocation || 'Unspecified'})
Service: ${selectedService || currentReq.serviceName || '—'}
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
          targetCi: currentReq.targetCi || inputCi || '',
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

  const isAutomationReady = Boolean(
    !isTicketClosed &&
    currentReq.procedureId &&
    currentReq.targetCi &&
    (currentReq.serviceName || selectedService) &&
    (aiEvaluation ? aiEvaluation.isReadyForAutomation : true)
  );

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <PageHeader
        title="Engineer Execution Hub"
        description="Multi-stage deterministic ITIL workflow: Taxonomy assignment routing, runbook completeness evaluation, missing parameter handling, and verified execution."
        icon={<PlayCircleOutline />}
        iconColor="#0284c7"
        actions={
          <Button
            size="small"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
            onClick={fetchLiveRequests}
            disabled={loading}
          >
            Refresh Queue
          </Button>
        }
      />

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
                  Live records synced from {(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SNOW_INSTANCE_URL ? import.meta.env.VITE_SNOW_INSTANCE_URL : 'ServiceNow').replace(/^https?:\/\//, '').replace(/\.service-now\.com.*$/, '')}
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
                        setSelectedService(req.serviceName || '');
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
                            recommendedGroup: req.assignmentGroup || 'Unassigned',
                            modelUsed: 'Governance Guard'
                          });
                        } else {
                          evaluateTicketWithLlm(req, false);
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
                  Table: <strong>{currentReq.table || 'incident'}</strong> • Target CI: <strong>{currentReq.targetCi || '— (Missing CI)'}</strong> • Location: <strong>{currentReq.ciLocation || '—'}</strong> • Current Group: <strong>{currentReq.assignmentGroup || 'Unassigned'}</strong>
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

            <Divider sx={{ mb: 2 }} />

            {/* INTERACTIVE LOCAL LLM & SOUL MEMORY COMMAND BAR */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MemoryOutlined sx={{ color: '#7c3aed', fontSize: 24 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}>
                      LOCAL LLM & SOUL MEMORY CO-PILOT
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Engine: <strong>llama.cpp (port 8080)</strong> • Persistent Memory: <strong>{soulData.totalRules || soulData.rules?.length || 4} rules in soul.txt</strong>
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Tooltip title="Inspect the persistent soul.txt memory file and all learned operational rules">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<HistoryEduOutlined sx={{ fontSize: 15 }} />}
                      onClick={() => setShowSoulModal(true)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        borderRadius: 1.5,
                        borderColor: '#c084fc',
                        color: '#7e22ce',
                        bgcolor: '#faf5ff',
                        '&:hover': { bgcolor: '#f3e8ff', borderColor: '#a855f7' }
                      }}
                    >
                      🧠 soul.txt ({soulData.totalRules || soulData.rules?.length || 4} Rules)
                    </Button>
                  </Tooltip>

                  <Tooltip title="Teach a new operational rule to soul.txt to evolve LLM decision making">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SchoolOutlined sx={{ fontSize: 15 }} />}
                      onClick={() => openTeachModalForRouting('Application Support')}
                      disabled={isTicketClosed}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        borderRadius: 1.5,
                        bgcolor: '#7c3aed',
                        '&:hover': { bgcolor: '#6d28d9' }
                      }}
                    >
                      ⚡ Teach Operational Rule
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ borderColor: '#e2e8f0' }} />

              {/* Interactive Options for Selected Ticket */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem' }}>
                    Interactive Actions:
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={isEvaluatingAi ? <CircularProgress size={12} color="inherit" /> : <AutoAwesomeOutlined sx={{ fontSize: 14 }} />}
                    disabled={isEvaluatingAi}
                    onClick={() => evaluateTicketWithLlm(currentReq, true)}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5, py: 0.3 }}
                  >
                    {isEvaluatingAi ? 'Consulting Local LLM & soul.txt...' : '🤖 Consult Local LLM & Soul'}
                  </Button>

                  <Button
                    size="small"
                    variant={showChatPanel ? 'contained' : 'outlined'}
                    color="info"
                    startIcon={<ChatBubbleOutline sx={{ fontSize: 14 }} />}
                    onClick={() => setShowChatPanel(!showChatPanel)}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5, py: 0.3 }}
                  >
                    {showChatPanel ? 'Hide Co-Pilot Console' : '💬 Interactive LLM Console'}
                  </Button>

                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    startIcon={<TuneOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => openTeachModalForRouting(currentReq.assignmentGroup === 'Application Support' ? 'Server Infrastructure' : 'Application Support')}
                    disabled={isTicketClosed}
                    sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5, py: 0.3 }}
                  >
                    Override & Teach soul.txt
                  </Button>
                </Box>

                {aiEvaluation?.appliedSoulRules?.length > 0 && (
                  <Chip
                    size="small"
                    icon={<BookmarkAddedOutlined sx={{ fontSize: 13, color: '#15803d !important' }} />}
                    label={`Soul Memory Active: ${aiEvaluation.appliedSoulRules[0]}`}
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      bgcolor: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac'
                    }}
                  />
                )}
              </Box>
            </Paper>

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

            {/* INTERACTIVE LOCAL LLM CO-PILOT CHAT PANEL (COLLAPSIBLE) */}
            {showChatPanel && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  mb: 2.5,
                  border: '1.5px solid #38bdf8',
                  bgcolor: '#f0f9ff'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyOutlined sx={{ color: '#0284c7', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c4a6e', fontSize: '0.85rem' }}>
                      Interactive Local LLM Co-Pilot (llama.cpp :8080)
                    </Typography>
                    <Chip size="small" label="Live Local Inference" color="success" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />
                    <Chip size="small" label="soul.txt Ingested" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: '#e0e7ff', color: '#3730a3' }} />
                  </Box>
                  <IconButton size="small" onClick={() => setShowChatPanel(false)}>
                    <CloseOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                {/* Quick Inquiry Prompt Chips */}
                <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, alignSelf: 'center', mr: 0.5 }}>
                    Quick Ask:
                  </Typography>
                  {[
                    'Why route service restart to Application Support?',
                    'Does this CI have dependent services before restart?',
                    'Draft a PowerShell verification script for W3SVC',
                    'Explain how soul.txt rules apply to this ticket'
                  ].map((promptText, i) => (
                    <Chip
                      key={i}
                      label={promptText}
                      clickable
                      size="small"
                      onClick={() => handleSendInteractiveChat(promptText)}
                      sx={{
                        fontSize: '0.68rem',
                        bgcolor: '#ffffff',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        '&:hover': { bgcolor: '#e0f2fe' }
                      }}
                    />
                  ))}
                </Box>

                {/* Chat Message Scroll Window */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    minHeight: 160,
                    maxHeight: 260,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2,
                    mb: 1.5
                  }}
                >
                  {chatMessages.map((msg, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '88%',
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: msg.role === 'user' ? '#0284c7' : (msg.isError ? '#fef2f2' : '#f8fafc'),
                          color: msg.role === 'user' ? '#ffffff' : '#0f172a',
                          border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3, gap: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.68rem', color: msg.role === 'user' ? '#bae6fd' : '#64748b' }}>
                            {msg.role === 'user' ? 'You (Engineer)' : 'Local LLM Engine'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: msg.role === 'user' ? '#e0f2fe' : '#94a3b8' }}>
                            {msg.timestamp}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                          {msg.content}
                        </Typography>
                        {msg.tokensPerSec && (
                          <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
                            <Chip
                              size="small"
                              label={`${msg.tokensPerSec} tokens/s • ${msg.latencyMs}ms`}
                              sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#e2e8f0', color: '#475569' }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                  {isSendingChat && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                      <CircularProgress size={14} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Local LLM reasoning with soul.txt...
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Input Box */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask Local LLM or provide operational guidance (e.g. 'Route IIS tickets to App Support')..."
                    value={inputChatMessage}
                    onChange={(e) => setInputChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendInteractiveChat();
                      }
                    }}
                    disabled={isSendingChat}
                    sx={{
                      bgcolor: '#ffffff',
                      '& .MuiInputBase-input': { fontSize: '0.8rem' }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSendInteractiveChat()}
                    disabled={isSendingChat || !inputChatMessage.trim()}
                    endIcon={isSendingChat ? <CircularProgress size={14} color="inherit" /> : <SendOutlined sx={{ fontSize: 15 }} />}
                    sx={{ textTransform: 'none', fontWeight: 700, px: 2, whiteSpace: 'nowrap' }}
                  >
                    Send
                  </Button>
                </Box>
              </Paper>
            )}

            {/* STAGE 1: AI ASSIGNMENT GROUP DECISION (TAXONOMY & SOUL MEMORY DRIVEN) */}
            <Card variant="outlined" sx={{ borderRadius: 2, mb: 2.5, borderColor: isTicketClosed ? '#cbd5e1' : (aiEvaluation?.isGroupMatched ? '#86efac' : '#fed7aa'), bgcolor: isTicketClosed ? '#f8fafc' : (aiEvaluation?.isGroupMatched ? '#f0fdf4' : '#fffbeb'), opacity: isTicketClosed ? 0.6 : 1 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isTicketClosed ? <LockOutlined sx={{ fontSize: 20, color: '#64748b' }} /> : <AssignmentIndOutlined sx={{ fontSize: 20, color: aiEvaluation?.isGroupMatched ? '#16a34a' : '#d97706' }} />}
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      STAGE 1: ITIL TAXONOMY ASSIGNMENT ROUTER (SOUL-AWARE)
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
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Analyzing with Local AI & soul.txt...</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      {aiEvaluation?.appliedSoulRules?.length > 0 && (
                        <Chip
                          size="small"
                          icon={<BookmarkAddedOutlined sx={{ fontSize: 12, color: '#7e22ce !important' }} />}
                          label={`Soul Rule: ${aiEvaluation.appliedSoulRules[0]}`}
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}
                        />
                      )}
                      <Chip
                        size="small"
                        icon={<PsychologyOutlined sx={{ fontSize: 12 }} />}
                        label={`Model: ${aiEvaluation?.modelUsed || 'Local LLM'}`}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9' }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Soul Memory Learned Policy Alert */}
                {aiEvaluation?.appliedSoulRules?.length > 0 && (() => {
                  const matching = soulData.rules.find(r => r.id === aiEvaluation.appliedSoulRules[0]) || aiEvaluation?.appliedSoulRulesDetails?.[0];
                  const ruleText = matching?.rule || matching?.criteria || 'Policy rule applied.';
                  const targetGroup = matching?.engineerDecision || aiEvaluation?.recommendedGroup || 'Server Infrastructure';
                  return (
                    <Alert
                      severity="info"
                      icon={<MemoryOutlined sx={{ fontSize: 18, color: '#7c3aed' }} />}
                      action={
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                          <Button
                            size="small"
                            color="inherit"
                            startIcon={<EditOutlined sx={{ fontSize: 13 }} />}
                            onClick={() => {
                              if (matching) handleOpenEditRule(matching);
                            }}
                            sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5, border: '1px solid #d8b4fe', bgcolor: '#ffffff' }}
                          >
                            Edit Rule
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutline sx={{ fontSize: 13 }} />}
                            onClick={() => handleDeleteRule(aiEvaluation.appliedSoulRules[0])}
                            sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderRadius: 1.5, border: '1px solid #fecaca', bgcolor: '#ffffff' }}
                          >
                            Delete
                          </Button>
                        </Box>
                      }
                      sx={{
                        mb: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        bgcolor: '#faf5ff',
                        border: '1px solid #e9d5ff',
                        '& .MuiAlert-message': { fontSize: '0.76rem', color: '#581c87' }
                      }}
                    >
                      <strong>Persistent Soul Memory Override Active:</strong> Matching rule <code>{aiEvaluation.appliedSoulRules[0]}</code> in <code>soul.txt</code> dictates: "{ruleText}" → Routes to <strong>{targetGroup}</strong>.
                    </Alert>
                  );
                })()}

                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Current Assignment Group in SNow:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {currentReq.assignmentGroup || 'Unassigned'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>AI & Soul Recommended Group:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: isTicketClosed ? '#475569' : '#0284c7' }}>
                        {aiEvaluation?.recommendedGroup || currentReq.assignmentGroup || 'Application Support'}
                      </Typography>
                      {!isTicketClosed && (
                        <Chip
                          size="small"
                          label={`${aiEvaluation?.confidence || 96}% confidence`}
                          color={aiEvaluation?.appliedSoulRules?.length > 0 ? "secondary" : "primary"}
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', bgcolor: 'rgba(255,255,255,0.7)', p: 1, borderRadius: 1.5, border: '1px solid rgba(0,0,0,0.05)' }}>
                      <strong>AI & Soul Triage Rationale:</strong> {isTicketClosed ? 'Ticket is already Closed Complete in ServiceNow. All routing and reassignments are locked to maintain audit integrity.' : (aiEvaluation?.reasoning || 'Analyzing ticket text against Enterprise ITSM Taxonomy & soul.txt memory rules...')}
                    </Typography>
                  </Grid>

                  {/* Engineer Decision & Interaction Controls */}
                  {!isTicketClosed && (
                    <Grid item xs={12} sx={{ mt: 1, pt: 1, borderTop: '1px dashed #cbd5e1' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                            Engineer Decision:
                          </Typography>

                          {/* Accept & Reassign button */}
                          {!aiEvaluation?.isGroupMatched && (
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={isAssigningGroup ? <CircularProgress size={12} color="inherit" /> : <AssignmentTurnedInOutlined sx={{ fontSize: 14 }} />}
                              disabled={isAssigningGroup}
                              onClick={handleAssignIdentifiedGroup}
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.74rem', borderRadius: 1.5 }}
                            >
                              {isAssigningGroup ? 'Assigning in SNow...' : `Reassign to Identified: ${aiEvaluation?.recommendedGroup}`}
                            </Button>
                          )}

                          {/* Override & Teach to soul.txt */}
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            startIcon={<SchoolOutlined sx={{ fontSize: 14 }} />}
                            onClick={() => openTeachModalForRouting(currentReq.assignmentGroup === 'Application Support' ? 'Server Infrastructure' : 'Application Support')}
                            sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.74rem', borderRadius: 1.5 }}
                          >
                            Override & Teach soul.txt
                          </Button>

                          {/* Quick direct switch to OS Team or Application Team */}
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isAssigningGroup || currentReq.assignmentGroup === 'Application Support'}
                            onClick={() => handleAssignGroupDirect('Application Support', 'Engineer chosen routing to Application Support')}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 1.5, borderColor: '#cbd5e1', color: '#334155' }}
                          >
                            Set App Support
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isAssigningGroup || currentReq.assignmentGroup === 'Server Infrastructure'}
                            onClick={() => handleAssignGroupDirect('Server Infrastructure', 'Engineer chosen routing to Server Infrastructure (OS Team)')}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 1.5, borderColor: '#cbd5e1', color: '#334155' }}
                          >
                            Set OS Team
                          </Button>
                        </Box>

                        <Button
                          size="small"
                          variant="text"
                          startIcon={<ChatBubbleOutline sx={{ fontSize: 13 }} />}
                          onClick={() => {
                            setShowChatPanel(true);
                            handleSendInteractiveChat(`Why did you recommend ${aiEvaluation?.recommendedGroup || 'Application Support'} for ticket ${currentReq.ritm || currentReq.number}? Does soul.txt have rules for this?`);
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 600, color: '#0284c7' }}
                        >
                          Ask LLM Co-Pilot Why →
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
                    label={isTicketClosed ? "Lifecycle Terminated (Closed)" : (currentReq?.procedureName || aiEvaluation?.matchedRunbook?.name || "No Runbook Assigned")}
                    color={isTicketClosed ? "default" : ((currentReq?.procedureName || aiEvaluation?.matchedRunbook) ? "info" : "default")}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>

                {/* Readiness Progress Bar */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isTicketClosed ? '#64748b' : ((!currentReq?.procedureId && !aiEvaluation?.matchedRunbook) ? '#64748b' : (isAutomationReady ? '#16a34a' : '#d97706')) }}>
                      {isTicketClosed
                        ? '🔒 Ticket Closed Complete — Further Action Aborted'
                        : ((!currentReq?.procedureId && !aiEvaluation?.matchedRunbook)
                          ? 'ℹ️ No Automated Runbook Applicable for this Ticket'
                          : (isAutomationReady ? '✓ 100% Ready for Automated Execution' : `⚠️ Readiness: ${aiEvaluation?.readinessScore || 40}% — Missing Required Runbook Parameters`))}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                      {isTicketClosed ? '100% Closed' : ((!currentReq?.procedureId && !aiEvaluation?.matchedRunbook) ? 'N/A' : `${aiEvaluation?.readinessScore || (isAutomationReady ? 100 : 40)}%`)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={isTicketClosed ? 100 : ((!currentReq?.procedureId && !aiEvaluation?.matchedRunbook) ? 0 : (aiEvaluation?.readinessScore || (isAutomationReady ? 100 : 40)))}
                    color={isTicketClosed ? 'inherit' : (isAutomationReady ? 'success' : ((!currentReq?.procedureId && !aiEvaluation?.matchedRunbook) ? 'inherit' : 'warning'))}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Parameter Verification Pills */}
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: currentReq.targetCi ? '#86efac' : '#fca5a5', bgcolor: currentReq.targetCi ? '#f0fdf4' : '#fef2f2' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>TARGET HOST</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: currentReq.targetCi ? '#15803d' : '#b91c1c' }}>
                        {currentReq.targetCi ? currentReq.targetCi : '— (Missing CI)'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: currentReq.ciLocation ? '#86efac' : '#e2e8f0', bgcolor: currentReq.ciLocation ? '#f0fdf4' : '#f8fafc' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>LOCATION / IP</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: currentReq.ciLocation ? '#15803d' : '#64748b' }}>
                        {currentReq.ciLocation ? `${currentReq.ciLocation}${currentReq.ciIp ? ` (${currentReq.ciIp})` : ''}` : '—'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid', borderColor: currentReq.serviceName ? '#86efac' : '#fca5a5', bgcolor: currentReq.serviceName ? '#f0fdf4' : '#fef2f2' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>SERVICE DAEMON</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: currentReq.serviceName ? '#15803d' : '#b91c1c' }}>
                        {currentReq.serviceName ? currentReq.serviceName : '— (Missing Service)'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 1, borderRadius: 1.5, border: '1px solid #86efac', bgcolor: '#f0fdf4' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.65rem' }}>STAGE / STATE</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#15803d' }}>
                        ✓ {currentReq.state || currentReq.stage || 'Active'}
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

                {!currentReq.procedureId ? (
                  <Alert severity="info" sx={{ mb: 1, borderRadius: 1.5, fontSize: '0.8rem' }}>
                    <strong>No Automated Runbook Matched:</strong> This ticket type does not map to an automated remediation script in the repository. Perform manual resolution or route to the appropriate assignment group in Stage 1.
                  </Alert>
                ) : (
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Service to Restart"
                        value={selectedService || currentReq.serviceName || 'Netlogon'}
                        onChange={(e) => setSelectedService(e.target.value)}
                        SelectProps={{ native: true }}
                        disabled={isTicketClosed || !isAutomationReady || isExecuting}
                      >
                        {selectedService && !['Netlogon', 'KDC', 'W3SVC', 'Spooler', 'MSSQLSERVER', 'nginx', 'snmpd'].includes(selectedService) && (
                          <option value={selectedService}>{selectedService} (Specified in Ticket)</option>
                        )}
                        <option value="Netlogon">Netlogon (Domain Controller Service)</option>
                        <option value="KDC">KDC (Kerberos Key Distribution Center)</option>
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
                          {isTicketClosed ? 'Execution Aborted (Ticket Closed)' : (isExecuting ? 'Restarting Service...' : `Execute Runbook (${selectedService || currentReq.serviceName || 'Service'})`)}
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
                )}
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
                <option value="">-- Select or Specify Service --</option>
                <option value="Netlogon">Netlogon (Domain Controller Service)</option>
                <option value="KDC">KDC (Kerberos Key Distribution Center)</option>
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

      {/* DIALOG: TEACH SOUL MEMORY (PERSISTENT OPERATIONAL RULE) */}
      <Dialog open={showTeachModal} onClose={() => setShowTeachModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolOutlined sx={{ color: '#7c3aed' }} />
            Create / Teach Operational Rule (soul.txt)
          </Box>
          <IconButton size="small" onClick={() => setShowTeachModal(false)}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            When you record a decision here, it is permanently written to <code>soul.txt</code> on disk. The Local LLM engine dynamically injects these rules into its context on every evaluation, allowing the system to evolve its decision-making over time without retraining weights.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Operational Stage"
                value={teachStage}
                onChange={(e) => setTeachStage(e.target.value)}
                SelectProps={{ native: true }}
                helperText="Select which stage of the lifecycle this decision governs"
              >
                <option value="Triage / Assignment Routing">Stage 1: Triage / Assignment Routing</option>
                <option value="Parameter Gate / Missing Info">Stage 2: Parameter Gate / Missing Info</option>
                <option value="Execution / Runbook SOP">Stage 3: Runbook Automation Execution</option>
                <option value="Post-Execution Synthesis">Stage 4: Post-Execution Synthesis & SNow Commit</option>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Author / Engineer Name"
                value={teachAuthor}
                onChange={(e) => setTeachAuthor(e.target.value)}
                helperText="Logged in soul.txt for ITIL change audit compliance"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Trigger Criteria / Condition"
                value={teachCriteria}
                onChange={(e) => setTeachCriteria(e.target.value)}
                placeholder="e.g. Service restart requested for IIS Web services (W3SVC)"
                helperText="The pattern or ticket attributes that trigger this operational decision"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Default System / Taxonomy Recommendation"
                value={teachDefaultRec}
                onChange={(e) => setTeachDefaultRec(e.target.value)}
                placeholder="e.g. Server Infrastructure (OS Team)"
                helperText="What the system would normally recommend by default"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {teachStage.includes('Routing') ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Engineer Chosen Assignment Group"
                  value={teachEngineerDecision}
                  onChange={(e) => setTeachEngineerDecision(e.target.value)}
                  SelectProps={{ native: true }}
                  helperText="The routing override that will be saved in soul.txt and applied in ServiceNow"
                >
                  {TAXONOMY_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label="Engineer Decision / Action"
                  value={teachEngineerDecision}
                  onChange={(e) => setTeachEngineerDecision(e.target.value)}
                  placeholder="e.g. Route to Application Support"
                  helperText="The operational action or decision executed by engineer"
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Operational Rule Formulation (Prescriptive rule for Local LLM)"
                value={teachRule}
                onChange={(e) => setTeachRule(e.target.value)}
                placeholder="e.g. When a service restart is requested on IIS web servers, route to Application Support instead of Server Infrastructure."
                helperText="Write the exact instruction the Local LLM must follow when evaluating future tickets"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Operational Reason / Justification"
                value={teachReason}
                onChange={(e) => setTeachReason(e.target.value)}
                placeholder="e.g. Service restarts on IIS web servers affect web customer traffic directly; Application Support must verify IIS app pools."
                helperText="Reasoning captured for governance audit and LLM chain-of-thought explanation"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowTeachModal(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCommitSoulDecision}
            disabled={isCommittingSoul}
            startIcon={isCommittingSoul ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#7c3aed',
              '&:hover': { bgcolor: '#6d28d9' }
            }}
          >
            {isCommittingSoul ? 'Committing to soul.txt...' : 'Commit to soul.txt & Apply to ServiceNow'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: SOUL MEMORY INSPECTOR (soul.txt) */}
      <Dialog open={showSoulModal} onClose={() => setShowSoulModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MemoryOutlined sx={{ color: '#7c3aed', fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                soul.txt — Persistent Operational Memory
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                File: <code>/home/sar/dev/yantra/Yantra/soul.txt</code> ({soulData.totalRules || soulData.rules?.length || 4} Rules Active)
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddCircleOutline sx={{ fontSize: 14 }} />}
              onClick={() => {
                setShowSoulModal(false);
                handleOpenCreateRule();
              }}
              sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
            >
              + Create New Rule
            </Button>
            <IconButton size="small" onClick={() => setShowSoulModal(false)}>
              <CloseOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {/* Search & Stats Bar */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search rules by ID, stage, keyword (e.g. 'restart', 'IIS', 'Application Support')..."
              value={soulSearchQuery}
              onChange={(e) => setSoulSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchOutlined sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
              }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh sx={{ fontSize: 14 }} />}
              onClick={fetchSoulMemory}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Refresh
            </Button>
          </Box>

          {/* Rule List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {(soulData.rules || [])
              .filter(r => {
                if (!soulSearchQuery.trim()) return true;
                const q = soulSearchQuery.toLowerCase();
                return (
                  (r.id || '').toLowerCase().includes(q) ||
                  (r.stage || '').toLowerCase().includes(q) ||
                  (r.rule || '').toLowerCase().includes(q) ||
                  (r.criteria || '').toLowerCase().includes(q) ||
                  (r.engineerDecision || '').toLowerCase().includes(q) ||
                  (r.reason || '').toLowerCase().includes(q)
                );
              })
              .map((r, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    borderColor: '#e2e8f0',
                    bgcolor: '#ffffff',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#c084fc', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.08)' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={r.id || `RULE-00${i + 1}`}
                        sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe' }}
                      />
                      <Chip
                        size="small"
                        label={r.stage || 'General'}
                        variant="outlined"
                        sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569' }}
                      />
                      {r.ticketNumber && (
                        <Chip
                          size="small"
                          label={r.ticketNumber}
                          sx={{ fontSize: '0.65rem', bgcolor: '#f1f5f9', color: '#334155' }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', mr: 0.5 }}>
                        {r.timestamp ? r.timestamp.substring(0, 10) : 'Active'} • {r.author || 'Engineer'}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<EditOutlined sx={{ fontSize: 13 }} />}
                        onClick={() => handleOpenEditRule(r)}
                        sx={{ textTransform: 'none', fontSize: '0.68rem', fontWeight: 700, py: 0.2, px: 1, borderRadius: 1.2, minWidth: 'auto' }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteOutline sx={{ fontSize: 13 }} />}
                        onClick={() => handleDeleteRule(r.id)}
                        sx={{ textTransform: 'none', fontSize: '0.68rem', fontWeight: 700, py: 0.2, px: 1, borderRadius: 1.2, minWidth: 'auto' }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                    📜 {r.rule}
                  </Typography>

                  <Grid container spacing={1} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Trigger Criteria:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                        {r.criteria || 'N/A'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Routing Transition:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.76rem', color: '#dc2626', textDecoration: 'line-through' }}>
                          {r.defaultRecommendation || 'Default'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>➔</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 800 }}>
                          {r.engineerDecision || 'Override'}
                        </Typography>
                      </Box>
                    </Grid>

                    {r.reason && (
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>Operational Reason:</Typography>
                        <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic', display: 'block' }}>
                          "{r.reason}"
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
          </Box>

          {/* Raw soul.txt Preview */}
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
              RAW DISK FILE PREVIEW (/home/sar/dev/yantra/Yantra/soul.txt):
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: '#0f172a',
                color: '#38bdf8',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.72rem',
                maxHeight: 180,
                overflowY: 'auto',
                borderRadius: 1.5,
                border: '1px solid #1e293b'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {soulData.content || '# soul.txt active memory file'}
              </pre>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowSoulModal(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EDIT SOUL MEMORY RULE */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditOutlined sx={{ color: '#0284c7' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Edit LLM Assignment Rule [{editingRule?.id}]
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowEditModal(false)}>
            <CloseOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Update rule parameters in <code>soul.txt</code>. The Local LLM engine will immediately adopt these modified instructions during automated triage.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Rule ID (Immutable Key)"
                value={editingRule?.id || ''}
                disabled
                helperText="Unique identifier in soul.txt"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Operational Stage"
                value={editingRule?.stage || 'Triage / Assignment Routing'}
                onChange={(e) => setEditingRule({ ...editingRule, stage: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="Triage / Assignment Routing">Stage 1: Triage / Assignment Routing</option>
                <option value="Parameter Gate / Missing Info">Stage 2: Parameter Gate / Missing Info</option>
                <option value="Execution / Runbook SOP">Stage 3: Runbook Automation Execution</option>
                <option value="Post-Execution Synthesis">Stage 4: Post-Execution Synthesis & SNow Commit</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Author / Modifier"
                value={editingRule?.author || ''}
                onChange={(e) => setEditingRule({ ...editingRule, author: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Trigger Criteria / Condition"
                value={editingRule?.criteria || ''}
                onChange={(e) => setEditingRule({ ...editingRule, criteria: e.target.value })}
                placeholder="e.g. Service restart requested for IIS Web services"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Ticket Reference / Pattern"
                value={editingRule?.ticketNumber || ''}
                onChange={(e) => setEditingRule({ ...editingRule, ticketNumber: e.target.value })}
                placeholder="e.g. BASELINE-POLICY or RITM0010026"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Default System Recommendation"
                value={editingRule?.defaultRecommendation || ''}
                onChange={(e) => setEditingRule({ ...editingRule, defaultRecommendation: e.target.value })}
                placeholder="e.g. Server Infrastructure (OS Team)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              {editingRule?.stage?.includes('Routing') ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Engineer Chosen Assignment Group"
                  value={editingRule?.engineerDecision || 'Application Support'}
                  onChange={(e) => setEditingRule({ ...editingRule, engineerDecision: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  {TAXONOMY_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  label="Engineer Chosen Decision / Action"
                  value={editingRule?.engineerDecision || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, engineerDecision: e.target.value })}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Operational Rule Formulation (Instruction for Local LLM)"
                value={editingRule?.rule || ''}
                onChange={(e) => setEditingRule({ ...editingRule, rule: e.target.value })}
                placeholder="The exact rule instruction the LLM follows"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Operational Reason / Justification"
                value={editingRule?.reason || ''}
                onChange={(e) => setEditingRule({ ...editingRule, reason: e.target.value })}
                placeholder="Technical reasoning and audit rationale"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowEditModal(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEditedRule}
            disabled={isSavingRule}
            startIcon={isSavingRule ? <CircularProgress size={14} color="inherit" /> : <SaveOutlined />}
            sx={{ textTransform: 'none', fontWeight: 800 }}
          >
            {isSavingRule ? 'Updating soul.txt...' : 'Save Changes to soul.txt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
