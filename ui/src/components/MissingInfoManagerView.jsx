import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Chip,
  Button,
  TextField,
  Paper,
  Alert
} from '@mui/material';
import {
  EmailOutlined,
  SendOutlined,
  CheckCircleOutline
} from '@mui/icons-material';

export default function MissingInfoManagerView() {
  const [selectedRitm] = useState('RITM0010904');
  const [targetServer, setTargetServer] = useState('PRD-APP-SRV01');
  const [serviceName, setServiceName] = useState(''); // Intentionally blank to test missing info
  const [validationRun, setValidationRun] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [requesterReply, setRequesterReply] = useState('');
  const [resumed, setResumed] = useState(false);

  const handleValidate = () => {
    setValidationRun(true);
    setEmailSent(false);
    setResumed(false);
  };

  const handleSendEmail = () => {
    setEmailSent(true);
  };

  const handleResumeWorkflow = () => {
    if (requesterReply) {
      setServiceName(requesterReply);
      setResumed(true);
    }
  };

  const isMissingService = !serviceName;

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          Missing Information & Requester Communication Manager
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Enforces BRD §10.6 & §10.7: Automatically pause incomplete requests in Pending Information, cross-reference environmental knowledge, and request strictly minimum missing data.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Left: Request Intake & Validation Simulator */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Service Request Intake Simulator
              </Typography>
              <Chip size="small" label={selectedRitm} color="primary" sx={{ fontWeight: 700 }} />
            </Box>

            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
              Simulate submitting a Service Request where some fields are known from CMDB while others are missing.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Target Server (Host)"
                value={targetServer}
                onChange={(e) => setTargetServer(e.target.value)}
                helperText="Derived from CMDB Configuration Item lookup"
                size="small"
                fullWidth
              />

              <TextField
                label="Service Name to Restart"
                value={serviceName}
                placeholder="e.g. W3SVC, Spooler, Tomcat (Leave blank to test missing info)"
                onChange={(e) => setServiceName(e.target.value)}
                error={validationRun && isMissingService}
                helperText={validationRun && isMissingService ? 'MANDATORY FIELD MISSING: Cannot be resolved via CMDB' : 'Mandatory operational parameter'}
                size="small"
                fullWidth
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleValidate}
                startIcon={<CheckCircleOutline />}
                sx={{ fontWeight: 600 }}
              >
                Run Platform Validation Engine
              </Button>
            </Box>
          </Card>

          {/* Validation Engine Results */}
          {validationRun && (
            <Card sx={{ p: 2.5, borderRadius: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Validation Engine Diagnostics
              </Typography>

              {isMissingService ? (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
                    <strong>Status: PENDING INFORMATION</strong> — Execution paused. Mandatory parameter <code>ServiceName</code> is missing from request payload.
                  </Alert>

                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 1 }}>
                    AUTOMATED ENVIRONMENTAL LOOKUP AUDIT:
                  </Typography>

                  <Box sx={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 0.8, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, mb: 2 }}>
                    <div>Target Host <code>{targetServer}</code>: <strong style={{ color: '#10b981' }}>RESOLVED in CMDB (Windows Server 2022)</strong></div>
                    <div>Maintenance Window: <strong style={{ color: '#10b981' }}>RESOLVED (Standard Daily 14:00-16:00 UTC)</strong></div>
                    <div>Service Name: <strong style={{ color: '#ef4444' }}>MISSING (Requires Requester Input)</strong></div>
                  </Box>

                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<EmailOutlined />}
                    disabled={emailSent}
                    onClick={handleSendEmail}
                    fullWidth
                    sx={{ fontWeight: 700 }}
                  >
                    {emailSent ? 'Notification Email Sent to Requester' : 'Generate & Send BRD §10.7 Minimal Email'}
                  </Button>
                </Box>
              ) : (
                <Alert severity="success" sx={{ fontSize: '0.8rem' }}>
                  All mandatory parameters and environmental facts verified. Request is ready to proceed for approval and execution!
                </Alert>
              )}
            </Card>
          )}
        </Grid>

        {/* Right: Rendered Standard Automated Email Template */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <EmailOutlined sx={{ color: '#0284c7' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Automated Email Template (BRD §10.7 Standard)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
              Strict compliance: Requests ONLY missing mandatory info without requiring user to re-enter known facts.
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #cbd5e1' }}>
              <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 1.5, fontSize: '0.78rem' }}>
                <div><strong>To:</strong> Johnathan Miller (Requester)</div>
                <div><strong>Subject:</strong> Additional Information Required for Service Request [{selectedRitm}]</div>
                <div><strong>From:</strong> Service Request Fulfilment Team &lt;automation@dev364281.service-now.com&gt;</div>
              </Box>

              <Typography variant="body2" sx={{ lineHeight: 1.5, color: '#1e293b', fontSize: '0.82rem' }}>
                Dear Johnathan Miller,
                <br /><br />
                We have received your Service Request <strong>{selectedRitm}</strong> and completed the initial validation against the approved procedure repository and customer CMDB facts.
                <br /><br />
                To proceed, please provide:
                <br />
                <span style={{ display: 'inline-block', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: 4, fontWeight: 700, color: '#92400e', marginTop: 4 }}>
                  • [Target Service Name to Restart]
                </span>
                <br /><br />
                <em>Only this information is required to continue processing.</em> Once received, the request will immediately proceed for approval and scheduled execution.
                <br /><br />
                Regards,
                <br />
                <strong>Service Request Fulfilment Team</strong>
              </Typography>
            </Paper>
          </Card>

          {/* Requester Response Simulator */}
          {emailSent && !resumed && (
            <Card sx={{ p: 2.5, border: '2px solid #f59e0b', bgcolor: '#fffbeb', borderRadius: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#92400e', mb: 0.5 }}>
                Requester Reply Simulator (Inbound Email / Portal Update)
              </Typography>
              <Typography variant="caption" sx={{ color: '#78350f', display: 'block', mb: 1.5 }}>
                Simulate the user replying with the missing parameter to automatically resume workflow.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Enter service name, e.g. W3SVC"
                  value={requesterReply}
                  onChange={(e) => setRequesterReply(e.target.value)}
                  sx={{ bgcolor: '#ffffff', flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  color="warning"
                  disabled={!requesterReply}
                  onClick={handleResumeWorkflow}
                  startIcon={<SendOutlined />}
                  sx={{ fontWeight: 700 }}
                >
                  Resume
                </Button>
              </Box>
            </Card>
          )}

          {resumed && (
            <Alert severity="success" sx={{ fontSize: '0.8rem', borderRadius: 2 }}>
              <strong>Workflow Resumed!</strong> Missing parameter <code>{serviceName}</code> received and validated. Request {selectedRitm} transitioned from <em>Pending Information</em> to <em>Pending Approval</em>.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
