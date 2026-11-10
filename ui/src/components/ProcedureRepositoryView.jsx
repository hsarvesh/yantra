import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Drawer,
  Alert
} from '@mui/material';
import {
  SearchOutlined,
  CloseOutlined,
  MenuBookOutlined
} from '@mui/icons-material';
import { PageHeader } from './ui';

export default function ProcedureRepositoryView({ procedures }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeProcedure, setActiveProcedure] = useState(procedures[0]);
  const [tabValue, setTabValue] = useState(0);

  const filtered = procedures.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', 'Server Operations', 'Identity & Access', 'Database Operations'];

  const handleOpenDetail = (proc) => {
    setActiveProcedure(proc);
    setDrawerOpen(true);
    setTabValue(0);
  };

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <PageHeader
        title="Procedure Repository & SOP Governance"
        description="Approved operational standard operating procedures, version-controlled scripts, input validation schemas, and rollback definitions."
        brdRef="§10.3"
        icon={<MenuBookOutlined />}
        iconColor="#0284c7"
      />

      {/* Filters & Search */}
      <Card sx={{ p: 2, mb: 2.5, borderRadius: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="small"
                variant={selectedCategory === cat ? 'contained' : 'outlined'}
                onClick={() => setSelectedCategory(cat)}
                sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600 }}
              >
                {cat}
              </Button>
            ))}
          </Box>
          <TextField
            size="small"
            placeholder="Search procedures or IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
        </Box>
      </Card>

      {/* Procedure Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>PROCEDURE ID</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>PROCEDURE NAME</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>CATEGORY</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>TARGET PLATFORM</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>RISK LEVEL</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>QUALIFICATION</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((proc) => (
              <TableRow key={proc.id} hover>
                <TableCell sx={{ fontWeight: 700, color: '#0284c7', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {proc.id}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                    {proc.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                    Version {proc.version} | Owner: {proc.owner}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{proc.category}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{proc.targetType}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={proc.riskLevel}
                    color={proc.riskLevel === 'Critical' || proc.riskLevel === 'High' ? 'error' : 'default'}
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={`${proc.consecutiveSuccesses}/100 (${proc.maturityState.toUpperCase()})`}
                    color={proc.maturityState === 'trusted' ? 'success' : proc.maturityState === 'requalification' ? 'error' : 'info'}
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => handleOpenDetail(proc)} sx={{ fontSize: '0.72rem', py: 0.3 }}>
                    Inspect SOP
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Procedure Detail Inspection Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 540 }, p: 3, boxSizing: 'border-box' } }}
      >
        {activeProcedure && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700, fontSize: '0.75rem' }}>
                  {activeProcedure.id} (v{activeProcedure.version})
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  {activeProcedure.name}
                </Typography>
              </Box>
              <Button size="small" onClick={() => setDrawerOpen(false)}><CloseOutlined /></Button>
            </Box>

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tab label="Metadata & Inputs" sx={{ fontSize: '0.78rem', fontWeight: 600 }} />
              <Tab label="Execution Script" sx={{ fontSize: '0.78rem', fontWeight: 600 }} />
              <Tab label="Rollback & Recovery" sx={{ fontSize: '0.78rem', fontWeight: 600 }} />
            </Tabs>

            {/* Tab 0: Metadata & Input Schema */}
            {tabValue === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 1 }}>
                    PROCEDURE SPECIFICATION
                  </Typography>
                  <Box sx={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <div>Category: <strong>{activeProcedure.category}</strong></div>
                    <div>Target Platform: <strong>{activeProcedure.targetType}</strong></div>
                    <div>Service Owner: <strong>{activeProcedure.serviceOwner}</strong></div>
                    <div>Risk Classification: <strong>{activeProcedure.riskLevel}</strong></div>
                  </Box>
                </Paper>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Mandatory & Environmental Input Parameters
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>PARAMETER</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>TYPE</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>SOURCE</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>EXAMPLE</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeProcedure.inputs.map((inp, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{inp.name}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{inp.type}</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <Chip
                              size="small"
                              label={inp.fromCMDB ? 'CMDB Fact' : 'Requester Input'}
                              color={inp.fromCMDB ? 'info' : 'default'}
                              sx={{ height: 18, fontSize: '0.62rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{inp.example}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Tab 1: Execution Script */}
            {tabValue === 1 && (
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontSize: '0.72rem' }}>
                  Approved script executed on customer-hosted MID Server node (WinRM/SSH/REST):
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#0f172a', color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', borderRadius: 2, overflowX: 'auto' }}>
                  {activeProcedure.scriptSnippet}
                </Paper>
              </Box>
            )}

            {/* Tab 2: Rollback Script */}
            {tabValue === 2 && (
              <Box>
                {activeProcedure.rollbackSupported ? (
                  <Box>
                    <Alert severity="success" sx={{ mb: 2, fontSize: '0.78rem' }}>
                      Automated rollback is approved and validated for this procedure.
                    </Alert>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontSize: '0.72rem' }}>
                      Automated Rollback Command executed upon failure detection:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#0f172a', color: '#fbbf24', fontFamily: 'monospace', fontSize: '0.78rem', whiteSpace: 'pre-wrap', borderRadius: 2, overflowX: 'auto' }}>
                      {activeProcedure.rollbackScript}
                    </Paper>
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ fontSize: '0.78rem' }}>
                    This procedure does not support automated rollback (Irreversible operational action). Manual intervention protocol applies upon exception.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
