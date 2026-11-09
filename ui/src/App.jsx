import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Toolbar, Snackbar, Alert } from '@mui/material';
import { theme } from './theme';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import EngineerWorkspaceView from './components/EngineerWorkspaceView';
import QualificationTrackerView from './components/QualificationTrackerView';
import ProcedureRepositoryView from './components/ProcedureRepositoryView';
import MissingInfoManagerView from './components/MissingInfoManagerView';
import BulkScheduledView from './components/BulkScheduledView';
import AuditTrailView from './components/AuditTrailView';
import ServiceNowGeneratorView from './components/ServiceNowGeneratorView';
import ServiceNowAdminView from './components/admin/ServiceNowAdminView';
import LlmConfigView from './components/admin/LlmConfigView';
import {
  initialProcedures,
  initialActiveRequests,
  executionNodes,
  bulkTargetServers,
  initialAuditLogs
} from './mockData';

export default function App() {
  const [currentView, setCurrentView] = useState('snow_generator'); // Default or accessible from sidebar
  const [currentRole, setCurrentRole] = useState('engineer');
  const [customerEnv, setCustomerEnv] = useState('Customer-Alpha-PRD');
  
  // Dynamic App State
  const [procedures, setProcedures] = useState(initialProcedures);
  const [activeRequests, setActiveRequests] = useState(initialActiveRequests);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  
  // Toast notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showNotification = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Execution Success Handler
  const handleExecuteSuccess = (request, procedure) => {
    const updatedCount = procedure.consecutiveSuccesses + 1;
    const isNowEligible = updatedCount >= 100 && procedure.maturityState === 'supervised';

    setProcedures(prev => prev.map(p => {
      if (p.id === procedure.id) {
        return {
          ...p,
          consecutiveSuccesses: updatedCount,
          maturityState: isNowEligible ? 'eligible' : p.maturityState
        };
      }
      return p;
    }));

    // Add Audit Entry
    const newLog = {
      runId: `RUN000${Math.floor(10000 + Math.random() * 9000)}`,
      ritm: request.ritm,
      procedureId: procedure.id,
      procedureName: procedure.name,
      target: request.targetCi,
      engineer: procedure.maturityState === 'trusted' ? 'Auto-Approved (Trusted Governance)' : 'Sarvesh Huddedar',
      mode: procedure.maturityState === 'trusted' ? 'Trusted' : 'Supervised',
      counterBefore: procedure.consecutiveSuccesses,
      counterAfter: updatedCount,
      result: 'Success',
      duration: '9.8s',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hash: `SHA256:${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 6)}`
    };

    setAuditLogs(prev => [newLog, ...prev]);

    if (isNowEligible) {
      showNotification(`MILESTONE: ${procedure.id} achieved 100 consecutive successes! Now ELIGIBLE for Trusted status activation.`, 'warning');
    } else {
      showNotification(`Success! ${procedure.id} counter incremented to ${updatedCount}/100.`, 'success');
    }
  };

  // Immediate Revocation Handler (BRD §12.5)
  const handleExecuteFailure = (request, procedure, reason) => {
    const beforeCount = procedure.consecutiveSuccesses;

    setProcedures(prev => prev.map(p => {
      if (p.id === procedure.id) {
        return {
          ...p,
          consecutiveSuccesses: 0,
          maturityState: 'requalification'
        };
      }
      return p;
    }));

    // Add Revocation Audit Entry
    const failLog = {
      runId: `RUN000${Math.floor(10000 + Math.random() * 9000)}`,
      ritm: request.ritm,
      procedureId: procedure.id,
      procedureName: procedure.name,
      target: request.targetCi,
      engineer: 'Sarvesh Huddedar',
      mode: 'Supervised',
      counterBefore: beforeCount,
      counterAfter: 0,
      result: `REVOCATION TRIGGERED (${reason})`,
      duration: '15.4s',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hash: `SHA256:${Math.random().toString(36).substring(2, 15)}...FAIL`
    };

    setAuditLogs(prev => [failLog, ...prev]);
    showNotification(`IMMEDIATE REVOCATION: Execution failed! ${procedure.id} counter reset from ${beforeCount} to 0. Returned to Requalification mode.`, 'error');
  };

  // Qualification Simulation Handlers
  const handleSimulateRun = (procId, delta) => {
    setProcedures(prev => prev.map(p => {
      if (p.id === procId) {
        const nextVal = delta === 0 ? initialProcedures.find(x => x.id === procId).consecutiveSuccesses : p.consecutiveSuccesses + delta;
        return {
          ...p,
          consecutiveSuccesses: nextVal,
          maturityState: nextVal >= 100 ? (p.maturityState === 'trusted' ? 'trusted' : 'eligible') : 'supervised'
        };
      }
      return p;
    }));
    showNotification(`Simulation updated for ${procId}.`, 'info');
  };

  const handleFastForward100 = (procId) => {
    setProcedures(prev => prev.map(p => {
      if (p.id === procId) {
        return {
          ...p,
          consecutiveSuccesses: 100,
          maturityState: 'eligible'
        };
      }
      return p;
    }));
    showNotification(`Fast-forward complete: ${procId} reached 100 consecutive successes and is ELIGIBLE for Trusted activation.`, 'warning');
  };

  const handleActivateTrusted = (procId) => {
    setProcedures(prev => prev.map(p => {
      if (p.id === procId) {
        return {
          ...p,
          maturityState: 'trusted'
        };
      }
      return p;
    }));
    showNotification(`TRUSTED ACTIVATION COMPLETE: ${procId} now has automated engineer execution approvals enabled!`, 'success');
  };

  const handleSimulateRevocation = (procId, reason) => {
    const targetProc = procedures.find(p => p.id === procId);
    handleExecuteFailure({ ritm: 'SIMULATED-RUN', targetCi: 'PRD-APP-SRV01' }, targetProc, reason);
  };

  // When a real sample is created in ServiceNow
  const handleSampleCreated = (result) => {
    showNotification(`Created in ServiceNow: ${result.ritmNumber} (${result.shortDescription})`, 'success');
    
    // Also push into active requests for engineer hub demonstration
    const newReqItem = {
      ritm: result.ritmNumber,
      shortDescription: result.shortDescription,
      procedureId: 'PROC-WIN-001',
      procedureName: 'Windows Service Clean Restart',
      requester: 'System Administrator (Live Sample)',
      targetCi: 'PRD-APP-SRV01',
      status: 'Pending Engineer Approval',
      executionMode: 'Supervised Mode',
      businessApprovals: {
        requesterManager: { status: 'Approved', by: 'System Policy', at: result.createdOn },
        systemOwner: { status: 'Approved', by: 'Auto-CAB', at: result.createdOn },
        security: { status: 'Not Required', by: 'Standard Policy' },
        changeControl: { status: 'Approved (Std Change)', by: 'ServiceNow CAB' }
      },
      engineerExecutionApproval: 'Pending',
      preValidations: {
        networkConnectivity: { pass: true, latency: '2ms (WinRM 5985)' },
        credentialVault: { pass: true, alias: 'VAULT-SVC-LOCALADMIN', masked: true },
        maintenanceWindow: { pass: true, window: 'Inside Approved Window' },
        cmdbFacts: { pass: true, os: 'Windows Server 2022', cluster: 'PRD-CLUSTER' }
      },
      parameters: {
        TargetHost: 'PRD-APP-SRV01',
        ServiceName: 'W3SVC'
      }
    };

    setActiveRequests(prev => [newReqItem, ...prev]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh', bgcolor: '#f8fafc', overflowX: 'hidden' }}>
        {/* Navigation Top Bar */}
        <Navbar
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
          customerEnv={customerEnv}
          setCustomerEnv={setCustomerEnv}
          activeReqCount={activeRequests.length}
        />

        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          pendingApprovalsCount={activeRequests.filter(r => r.status.includes('Pending')).length}
          qualifiedProceduresCount={procedures.filter(p => p.maturityState === 'trusted').length}
        />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { xs: '100%', md: `calc(100% - 240px)` },
            minWidth: 0,
            maxWidth: '100%',
            p: { xs: 2, md: 3 },
            bgcolor: '#f8fafc',
            boxSizing: 'border-box',
            overflowX: 'hidden',
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }} />
          
          {currentView === 'snow_generator' && (
            <ServiceNowGeneratorView
              onSampleCreated={handleSampleCreated}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              procedures={procedures}
              activeRequests={activeRequests}
              executionNodes={executionNodes}
              auditLogs={auditLogs}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'engineer_workspace' && (
            <EngineerWorkspaceView
              activeRequests={activeRequests}
              procedures={procedures}
              onExecuteSuccess={handleExecuteSuccess}
              onExecuteFailure={handleExecuteFailure}
            />
          )}

          {currentView === 'qualification_tracker' && (
            <QualificationTrackerView
              procedures={procedures}
              currentRole={currentRole}
              onSimulateRun={handleSimulateRun}
              onFastForward100={handleFastForward100}
              onActivateTrusted={handleActivateTrusted}
              onSimulateRevocation={handleSimulateRevocation}
            />
          )}

          {currentView === 'procedures' && (
            <ProcedureRepositoryView
              procedures={procedures}
            />
          )}

          {currentView === 'missing_info' && (
            <MissingInfoManagerView />
          )}

          {currentView === 'bulk_scheduled' && (
            <BulkScheduledView
              bulkTargetServers={bulkTargetServers}
              procedures={procedures}
            />
          )}

          {currentView === 'audit_trail' && (
            <AuditTrailView
              auditLogs={auditLogs}
            />
          )}

          {currentView === 'snow_admin' && (
            <ServiceNowAdminView
              onNotification={showNotification}
            />
          )}

          {currentView === 'llm_admin' && (
            <LlmConfigView
              onNotification={showNotification}
            />
          )}
        </Box>
      </Box>

      {/* Global Toast Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
