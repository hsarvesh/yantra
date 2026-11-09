import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  SearchOutlined,
  CheckCircleOutline,
  ErrorOutline,
  FileDownloadOutlined
} from '@mui/icons-material';

function Row({ log }) {
  const [open, setOpen] = useState(false);
  const isFail = log.result.includes('REVOCATION') || log.result.includes('Failed');

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 40, p: 0.5 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp sx={{ fontSize: 18 }} /> : <KeyboardArrowDown sx={{ fontSize: 18 }} />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', fontSize: '0.78rem' }}>
          {log.runId}
        </TableCell>
        <TableCell sx={{ fontSize: '0.78rem' }}>{log.ritm}</TableCell>
        <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{log.procedureName}</TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{log.target}</TableCell>
        <TableCell sx={{ fontSize: '0.78rem' }}>{log.engineer}</TableCell>
        <TableCell sx={{ fontSize: '0.78rem', fontWeight: 700 }}>
          {log.counterBefore} &rarr; <span style={{ color: isFail ? '#ef4444' : '#10b981' }}>{log.counterAfter}</span>
        </TableCell>
        <TableCell sx={{ fontSize: '0.78rem' }}>
          <Chip
            size="small"
            icon={isFail ? <ErrorOutline sx={{ fontSize: '13px !important' }} /> : <CheckCircleOutline sx={{ fontSize: '13px !important' }} />}
            label={isFail ? 'Revocation Triggered' : 'Success'}
            color={isFail ? 'error' : 'success'}
            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
          />
        </TableCell>
        <TableCell sx={{ fontSize: '0.72rem', color: '#64748b' }}>{log.timestamp}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ my: 1.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', display: 'block', mb: 1, fontSize: '0.72rem' }}>
                TAMPER-RESISTANT CRYPTOGRAPHIC VERIFICATION & EVIDENCE ARTIFACT
              </Typography>

              <Box sx={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                <div>Evidence SHA-256 Digest: <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>{log.hash}</code></div>
                <div>Credential Broker: <strong>VAULT-SVC-LOCALADMIN (Resolved via Credential Vault with Secret Masking Active)</strong></div>
                <div>Execution Duration: <strong>{log.duration}</strong> on Node <strong>MID-CUST-PROD-01</strong></div>
                <div>Governance Impact: {log.result.includes('REVOCATION') ? (
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>Immediate Revocation: Counter reset to 0, Procedure moved to Requalification state.</span>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Counter successfully incremented by +1 toward 100-run qualification.</span>
                )}</div>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AuditTrailView({ auditLogs }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(l =>
    l.runId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.ritm.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
            Tamper-Resistant Audit Trail & Compliance Evidence
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Enforces BRD §19 & §22: Immutable record of all approvals, qualification counter transitions, masked secrets verification, and execution hashes.
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<FileDownloadOutlined />} sx={{ fontWeight: 600 }}>
          Export Compliance Audit Report
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ p: 2, mb: 2.5, borderRadius: 2.5 }}>
        <TextField
          size="small"
          placeholder="Filter by Run ID, RITM, Procedure, or Target Host..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 18, color: '#94a3b8' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 320 }}
        />
      </Card>

      {/* Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ width: 40 }} />
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>RUN ID</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>SERVICE REQUEST</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>PROCEDURE</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>TARGET</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>EXECUTOR / GOVERNANCE</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>COUNTER (BEFORE &rarr; AFTER)</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>RESULT</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>TIMESTAMP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log) => (
              <Row key={log.runId} log={log} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
