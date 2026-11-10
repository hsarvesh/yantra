import React, { useState } from 'react';
import {
  Box,
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
  Button,
  alpha
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  SearchOutlined,
  CheckCircleOutline,
  ErrorOutline,
  FileDownloadOutlined,
  FactCheckOutlined,
  FingerprintOutlined
} from '@mui/icons-material';
import { PageHeader, SectionCard } from './ui';

function Row({ log }) {
  const [open, setOpen] = useState(false);
  const isFail = log.result.includes('REVOCATION') || log.result.includes('Failed');

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          '& > *': { borderBottom: open ? 'none' : undefined },
          bgcolor: open ? alpha('#0284c7', 0.02) : 'transparent',
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ width: 40, px: 1 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            sx={{ bgcolor: open ? alpha('#0284c7', 0.1) : 'transparent', color: open ? '#0284c7' : '#94a3b8' }}>
            {open ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', fontSize: '0.78rem' }}>
            {log.runId}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label={log.ritm} size="small" sx={{ fontFamily: 'monospace', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
        </TableCell>
        <TableCell>
          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }}>{log.procedureName}</Typography>
        </TableCell>
        <TableCell>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>{log.target}</Typography>
        </TableCell>
        <TableCell>
          <Typography sx={{ fontSize: '0.78rem', color: '#475569', maxWidth: 180 }} noWrap>
            {log.engineer}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>
            <span style={{ color: '#94a3b8' }}>{log.counterBefore}</span>
            <span style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0 2px' }}>→</span>
            <span style={{ color: isFail ? '#ef4444' : '#10b981', fontWeight: 800 }}>{log.counterAfter}</span>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            size="small"
            icon={isFail
              ? <ErrorOutline sx={{ fontSize: '12px !important' }} />
              : <CheckCircleOutline sx={{ fontSize: '12px !important' }} />}
            label={isFail ? 'Revocation' : 'Success'}
            color={isFail ? 'error' : 'success'}
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
          />
        </TableCell>
        <TableCell>
          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {log.timestamp}
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow sx={{ bgcolor: open ? alpha('#0284c7', 0.025) : 'transparent' }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ my: 1.5, mx: 1, p: 2, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <FingerprintOutlined sx={{ fontSize: 15, color: '#6366f1' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#4338ca', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Cryptographic Evidence Artifact
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, fontSize: '0.8rem' }}>
                <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    SHA-256 Digest
                  </Typography>
                  <code style={{ fontSize: '0.75rem', color: '#1e293b', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: 4, display: 'block', wordBreak: 'break-all' }}>
                    {log.hash}
                  </code>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    Execution Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.78rem', color: '#475569' }}>
                    <span>Duration: <strong style={{ color: '#1e293b' }}>{log.duration}</strong> · Node: <strong style={{ color: '#1e293b' }}>MID-CUST-PROD-01</strong></span>
                    <span>Credential: <strong style={{ color: '#1e293b' }}>VAULT-SVC-LOCALADMIN</strong> (Masked)</span>
                  </Box>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', gridColumn: { md: '1 / -1' } }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    Governance Impact
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: isFail ? '#dc2626' : '#059669' }}>
                    {isFail
                      ? '⚠ Immediate Revocation Triggered — Counter reset to 0, Procedure returned to Requalification state.'
                      : '✓ Counter successfully incremented by +1 toward 100-run qualification threshold.'}
                  </Typography>
                </Box>
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

  const successCount = auditLogs.filter(l => !l.result.includes('REVOCATION') && !l.result.includes('Failed')).length;
  const failCount = auditLogs.length - successCount;

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      <PageHeader
        title="Audit Trail & Compliance Evidence"
        description="Immutable record of all approvals, qualification counter transitions, masked secrets verification, and execution hashes."
        brdRef="§19 & §22"
        icon={<FactCheckOutlined />}
        iconColor="#6366f1"
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlined />}
            sx={{ fontWeight: 600 }}
          >
            Export Report
          </Button>
        }
      />

      {/* Stats row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Runs', value: auditLogs.length, color: '#0284c7' },
          { label: 'Successful', value: successCount, color: '#10b981' },
          { label: 'Revocations', value: failCount, color: '#ef4444' },
        ].map((s) => (
          <Box key={s.label} sx={{
            p: 2, bgcolor: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '10px', textAlign: 'center',
          }}>
            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <SectionCard
        title="Execution Log"
        subtitle={`${filteredLogs.length} records · Click a row to expand cryptographic evidence`}
        actions={
          <TextField
            size="small"
            placeholder="Filter by Run ID, RITM, Procedure, or Target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 16, color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { fontSize: '0.8rem' } }}
          />
        }
        noPadding
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Run ID</TableCell>
                <TableCell>RITM</TableCell>
                <TableCell>Procedure</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Executor</TableCell>
                <TableCell>Counter</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <Row key={log.runId + log.timestamp} log={log} />
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                    No audit records match your filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    </Box>
  );
}
