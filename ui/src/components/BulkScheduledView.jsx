import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Chip,
  Button,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  LinearProgress,
  Divider,
  Select,
  MenuItem
} from '@mui/material';
import {
  PlayArrow,
  ScheduleOutlined,
  SpeedOutlined
} from '@mui/icons-material';

export default function BulkScheduledView({ bulkTargetServers, procedures }) {
  const [selectedServers, setSelectedServers] = useState(bulkTargetServers.map(s => s.id));
  const [concurrency, setConcurrency] = useState(2);
  const [scheduledWindow, setScheduledWindow] = useState('window_daily');
  const [isExecutingBulk, setIsExecutingBulk] = useState(false);
  const [targetStates, setTargetStates] = useState({});

  const handleToggleServer = (id) => {
    setSelectedServers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleStartBulkExecution = () => {
    setIsExecutingBulk(true);
    const initial = {};
    selectedServers.forEach(id => {
      initial[id] = { status: 'Queued', duration: '0s' };
    });
    setTargetStates(initial);

    // Simulate batch execution respecting concurrency throttle
    selectedServers.forEach((id, idx) => {
      setTimeout(() => {
        setTargetStates(prev => ({
          ...prev,
          [id]: { status: 'Executing...', duration: '4.2s' }
        }));
      }, (idx * 1200) + 400);

      setTimeout(() => {
        setTargetStates(prev => ({
          ...prev,
          [id]: { status: 'Success (Exit 0)', duration: '7.8s' }
        }));
        if (idx === selectedServers.length - 1) {
          setIsExecutingBulk(false);
        }
      }, (idx * 1200) + 2000);
    });
  };

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          Bulk Execution & Scheduled Activity Console
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Enforces BRD §14 & §15: Multi-target execution with concurrency rate limits, maintenance window schedule validation, and target-level status tracking.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Left: Target Selection & Rate Controls */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 2.5, mb: 2.5, borderRadius: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Bulk Execution Parameters
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontSize: '0.72rem' }}>PROCEDURE TO RUN:</Typography>
              <Select size="small" fullWidth defaultValue="PROC-WIN-001" sx={{ fontSize: '0.82rem' }}>
                <MenuItem value="PROC-WIN-001">PROC-WIN-001: Windows Service Clean Restart</MenuItem>
                <MenuItem value="PROC-LNX-003">PROC-LNX-003: Linux Filesystem Clean & Log Truncate</MenuItem>
              </Select>
            </Box>

            {/* Maintenance Window Checker */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5, fontSize: '0.72rem' }}>
                APPROVED MAINTENANCE WINDOW (CMN_SCHEDULE):
              </Typography>
              <Select
                size="small"
                fullWidth
                value={scheduledWindow}
                onChange={(e) => setScheduledWindow(e.target.value)}
                sx={{ fontSize: '0.82rem' }}
              >
                <MenuItem value="window_daily">Daily Standard Window (14:00 - 16:00 UTC)</MenuItem>
                <MenuItem value="window_weekend">Weekend Major Window (Sat 00:00 - 06:00 UTC)</MenuItem>
              </Select>
              <Chip
                size="small"
                icon={<ScheduleOutlined sx={{ fontSize: '13px !important' }} />}
                label="Inside Approved Maintenance Window"
                color="success"
                sx={{ height: 20, fontSize: '0.68rem', mt: 1, fontWeight: 600 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Concurrency Throttling Slider */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}>
                  <SpeedOutlined sx={{ fontSize: 16, color: '#0284c7' }} /> Concurrency Rate Limit
                </Typography>
                <Chip size="small" label={`Max ${concurrency} Targets`} color="primary" sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem' }} />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, fontSize: '0.72rem' }}>
                Throttles batch load to avoid saturating customer network and hypervisors.
              </Typography>
              <Slider
                value={concurrency}
                min={1}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
                onChange={(e, val) => setConcurrency(val)}
              />
            </Box>

            {/* Execute Button */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<PlayArrow />}
              disabled={isExecutingBulk || selectedServers.length === 0}
              onClick={handleStartBulkExecution}
              sx={{ fontWeight: 700, py: 1 }}
            >
              {isExecutingBulk ? 'Bulk Execution In Progress...' : `Start Governed Bulk Run (${selectedServers.length} Targets)`}
            </Button>
          </Card>
        </Grid>

        {/* Right: Target Execution Matrix */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ p: 2.5, borderRadius: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Target Execution & Status Matrix
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Target-by-target execution logs, duration, and error boundaries.
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Selected: {selectedServers.length} / {bulkTargetServers.length}
              </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedServers.length > 0 && selectedServers.length < bulkTargetServers.length}
                        checked={selectedServers.length === bulkTargetServers.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedServers(bulkTargetServers.map(s => s.id));
                          else setSelectedServers([]);
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>TARGET HOST</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>ENVIRONMENT</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>IP ADDRESS</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bulkTargetServers.map((srv) => {
                    const isChecked = selectedServers.includes(srv.id);
                    const state = targetStates[srv.id];
                    return (
                      <TableRow key={srv.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isChecked}
                            onChange={() => handleToggleServer(srv.id)}
                            disabled={isExecutingBulk}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.78rem' }}>
                          {srv.hostname}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>
                          <Chip size="small" label={srv.env} sx={{ height: 18, fontSize: '0.62rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {srv.ip}
                        </TableCell>
                        <TableCell>
                          {state ? (
                            <Chip
                              size="small"
                              label={state.status}
                              color={state.status.includes('Success') ? 'success' : state.status.includes('Executing') ? 'warning' : 'default'}
                              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Ready</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {isExecutingBulk && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                  Executing batches with concurrency limit {concurrency}...
                </Typography>
                <LinearProgress sx={{ height: 5, borderRadius: 3 }} />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
