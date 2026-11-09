import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Badge
} from '@mui/material';
import {
  NotificationsOutlined,
  CloudDoneOutlined,
  ShieldOutlined
} from '@mui/icons-material';

export default function Navbar({ currentRole, setCurrentRole, customerEnv, setCustomerEnv, activeReqCount }) {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#ffffff',
        color: '#0f172a',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        width: '100%',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: { xs: 2, md: 3 } }}>
        {/* Left: Brand & Instance */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
            }}
          >
            Y
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Yantra Execution & Scheduling Platform
              </Typography>
              <Chip
                size="small"
                label="dev364281 (Zurich Patch 10)"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  bgcolor: '#e0f2fe',
                  color: '#0369a1',
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block' }}>
              ServiceNow Human-in-the-Loop Operational Engine
            </Typography>
          </Box>
        </Box>

        {/* Right: Environment, Role Switcher, MID Status, Alerts */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          {/* Environment Selector */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={customerEnv}
              onChange={(e) => setCustomerEnv(e.target.value)}
              sx={{
                fontSize: '0.8rem',
                height: 34,
                bgcolor: '#f8fafc',
                fontWeight: 500,
                '& .MuiSelect-select': { py: 0.8, px: 1.5 },
              }}
            >
              <MenuItem value="Customer-Alpha-PRD">Customer Alpha (Prod)</MenuItem>
              <MenuItem value="Customer-Alpha-STG">Customer Alpha (Stage)</MenuItem>
              <MenuItem value="Customer-Beta-PRD">Customer Beta (Prod)</MenuItem>
            </Select>
          </FormControl>

          {/* Role Persona Switcher */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.2,
              py: 0.4,
              bgcolor: '#f1f5f9',
              borderRadius: 1.5,
              border: '1px solid #e2e8f0',
            }}
          >
            <ShieldOutlined sx={{ fontSize: 16, color: currentRole === 'service_owner' ? '#4f46e5' : '#0284c7' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.75rem', display: { xs: 'none', md: 'inline' } }}>
              Role:
            </Typography>
            <Select
              size="small"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              variant="standard"
              disableUnderline
              sx={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#0f172a',
                '& .MuiSelect-select': { py: 0.2, pr: 2.5 },
              }}
            >
              <MenuItem value="engineer">Assigned Engineer</MenuItem>
              <MenuItem value="service_owner">Service Owner</MenuItem>
              <MenuItem value="auditor">Compliance Auditor</MenuItem>
            </Select>
          </Box>

          {/* MID Node Status */}
          <Tooltip title="MID Server Cluster Online with zero inbound ports">
            <Chip
              icon={<CloudDoneOutlined sx={{ fontSize: '15px !important', color: '#10b981 !important' }} />}
              label="3 Nodes Online"
              size="small"
              sx={{
                bgcolor: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                height: 28,
                fontSize: '0.75rem',
                fontWeight: 600,
                display: { xs: 'none', lg: 'inline-flex' },
              }}
            />
          </Tooltip>

          {/* Notifications */}
          <IconButton size="small" sx={{ color: '#64748b' }}>
            <Badge badgeContent={activeReqCount} color="error">
              <NotificationsOutlined sx={{ fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
