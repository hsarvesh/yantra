import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Paper
} from '@mui/material';
import {
  VerifiedUser,
  FastForwardOutlined,
  RefreshOutlined,
  WarningAmberOutlined,
  PlayCircleOutline,
  VerifiedOutlined
} from '@mui/icons-material';
import { PageHeader } from './ui';

export default function QualificationTrackerView({
  procedures,
  currentRole,
  onSimulateRun,
  onFastForward100,
  onActivateTrusted,
  onSimulateRevocation
}) {
  const [selectedProcId, setSelectedProcId] = useState('PROC-WIN-001');
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);

  const selectedProc = procedures.find(p => p.id === selectedProcId) || procedures[0];
  const percent = Math.min(100, Math.round((selectedProc.consecutiveSuccesses / 100) * 100));

  let stateBadgeColor = 'info';
  if (selectedProc.maturityState === 'trusted') stateBadgeColor = 'success';
  if (selectedProc.maturityState === 'requalification') stateBadgeColor = 'error';
  if (selectedProc.maturityState === 'eligible') stateBadgeColor = 'warning';

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <PageHeader
        title="100-Run Qualification & Maturity Fleet"
        description="Enforces BRD Section 12: Every automated operational procedure must earn autonomy through 100 consecutive successful engineer-approved executions. Any failure restores human oversight immediately."
        brdRef="§12"
        icon={<VerifiedOutlined />}
        iconColor="#10b981"
      />

      {/* Procedure Cards Grid Picker */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {procedures.map((proc) => {
          const isSelected = proc.id === selectedProcId;
          return (
            <Grid item xs={12} sm={6} md={3} key={proc.id}>
              <Card
                onClick={() => setSelectedProcId(proc.id)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  bgcolor: isSelected ? '#f0f9ff' : '#ffffff',
                  boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.12)' : 'none',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7', fontSize: '0.72rem' }}>
                      {proc.id}
                    </Typography>
                    <Chip
                      size="small"
                      label={proc.maturityState.toUpperCase()}
                      color={
                        proc.maturityState === 'trusted' ? 'success' :
                        proc.maturityState === 'requalification' ? 'error' :
                        proc.maturityState === 'eligible' ? 'warning' : 'default'
                      }
                      sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }}
                    />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.85rem', lineHeight: 1.3 }}>
                    {proc.name}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>Consecutive Runs:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>{proc.consecutiveSuccesses} / 100</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (proc.consecutiveSuccesses / 100) * 100)}
                    color={proc.maturityState === 'trusted' ? 'success' : proc.maturityState === 'requalification' ? 'error' : 'primary'}
                    sx={{ height: 5, borderRadius: 3 }}
                  />
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Selected Procedure Detailed Governance Console */}
      <Card sx={{ p: 3, mb: 3, borderRadius: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem' }}>
                {selectedProc.name}
              </Typography>
              <Chip size="small" label={`v${selectedProc.version}`} sx={{ fontWeight: 600, height: 22 }} />
              <Chip
                size="small"
                label={`STATE: ${selectedProc.maturityState.toUpperCase()}`}
                color={stateBadgeColor}
                sx={{ fontWeight: 800, px: 0.5, height: 22 }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              Service Owner: <strong>{selectedProc.serviceOwner}</strong> | Engineering Team: <strong>{selectedProc.owner}</strong>
            </Typography>
          </Box>

          {/* Activation Button */}
          {selectedProc.consecutiveSuccesses >= 100 && selectedProc.maturityState !== 'trusted' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<VerifiedUser />}
              onClick={() => setActivationDialogOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              Activate Trusted Automation
            </Button>
          )}

          {selectedProc.maturityState === 'trusted' && (
            <Chip
              icon={<VerifiedUser sx={{ color: '#ffffff !important' }} />}
              label="TRUSTED AUTO-APPROVAL ACTIVE"
              color="success"
              sx={{ fontWeight: 700, py: 1.5, px: 1 }}
            />
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 100-Run Visual Gauge */}
        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Consecutive Successful Transactions: <span style={{ color: selectedProc.maturityState === 'requalification' ? '#ef4444' : '#0284c7' }}>{selectedProc.consecutiveSuccesses}</span> / 100
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {selectedProc.consecutiveSuccesses < 100
                  ? `${100 - selectedProc.consecutiveSuccesses} more consecutive successful runs required to unlock auto-approval eligibility.`
                  : 'Milestone Achieved! Ready for Service Owner formal activation.'}
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#0284c7' }}>
              {percent}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={percent}
            color={selectedProc.maturityState === 'trusted' ? 'success' : selectedProc.maturityState === 'requalification' ? 'error' : 'primary'}
            sx={{ height: 10, borderRadius: 5, bgcolor: '#e2e8f0', mb: 1.5 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.72rem', px: 0.5 }}>
            <span>0 Runs</span>
            <span>25 Runs</span>
            <span>50 Runs</span>
            <span>75 Runs</span>
            <span style={{ fontWeight: 700, color: '#0284c7' }}>100 Runs (Eligibility)</span>
          </Box>
        </Box>

        {/* POC Verification & Simulation Controls */}
        <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
            POC Interactive Verification & Simulation Controls
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
            Use these controls to demonstrate qualification progression and immediate revocation resets per BRD §12.
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<PlayCircleOutline />}
              onClick={() => onSimulateRun(selectedProc.id, 1)}
              sx={{ fontWeight: 600 }}
            >
              +1 Supervised Run
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<FastForwardOutlined />}
              onClick={() => onFastForward100(selectedProc.id)}
              sx={{ fontWeight: 600 }}
            >
              Fast-Forward to 100 Runs
            </Button>

            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<WarningAmberOutlined />}
              onClick={() => onSimulateRevocation(selectedProc.id, 'Simulated Anomaly: Target timeout during execution')}
              sx={{ fontWeight: 600 }}
            >
              Simulate Failure (Reset to 0)
            </Button>

            <Button
              variant="text"
              color="inherit"
              size="small"
              startIcon={<RefreshOutlined />}
              onClick={() => onSimulateRun(selectedProc.id, 0)}
              sx={{ color: '#64748b' }}
            >
              Reset Mock State
            </Button>
          </Box>
        </Box>

        {/* Governance Rules Explainer */}
        <Alert severity={selectedProc.maturityState === 'requalification' ? 'error' : 'info'} sx={{ fontSize: '0.8rem' }}>
          <strong>BRD Section 12 Governance Standard:</strong> 100 consecutive successful runs required with zero failures. Any failure immediately revokes auto-approval and resets counter to zero. Auto-approval applies strictly to the Engineer Execution layer.
        </Alert>
      </Card>

      {/* Activation Modal */}
      <Dialog open={activationDialogOpen} onClose={() => setActivationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
          <VerifiedUser sx={{ color: '#10b981' }} /> Formal Activation: Trusted Automation Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#0f172a', mb: 2, fontSize: '0.85rem' }}>
            Procedure <strong>{selectedProc.name} ({selectedProc.id})</strong> has achieved <strong>100 consecutive successful executions</strong> under supervised human oversight.
          </Typography>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>AUTHORIZING PERSONA:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedProc.serviceOwner}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>Role: Service Owner (Authorized to activate trusted autonomy)</Typography>
          </Paper>

          <Alert severity="warning" sx={{ fontSize: '0.78rem' }}>
            Activating Trusted mode will automate future engineer execution approvals. Business approvals remain mandatory. Any future failure will immediately revoke this status.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActivationDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              onActivateTrusted(selectedProc.id);
              setActivationDialogOpen(false);
            }}
            sx={{ fontWeight: 700 }}
          >
            Authorize Trusted Mode
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
