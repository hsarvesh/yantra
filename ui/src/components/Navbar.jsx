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
  Badge,
  Avatar,
  Divider
} from '@mui/material';
import {
  NotificationsOutlined,
  CloudDoneOutlined,
  ShieldOutlined,
  CircleOutlined,
  HelpOutlineOutlined,
  KeyboardArrowDownOutlined
} from '@mui/icons-material';

export default function Navbar({ currentRole, setCurrentRole, customerEnv, setCustomerEnv, activeReqCount }) {
  const envColor = customerEnv.includes('PRD') ? '#10b981' : '#f59e0b';
  const envLabel = customerEnv.includes('PRD') ? 'PRD' : 'STG';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#ffffff',
        color: '#0f172a',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 0 0 #e2e8f0',
        width: '100%',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '60px !important', px: { xs: 2, md: 2.5 }, gap: 2 }}>

        {/* ── Left: Brand ─────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
          {/* Logo mark */}
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.1rem',
              letterSpacing: '-0.03em',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
              flexShrink: 0,
            }}
          >
            Y
          </Box>

          {/* Product name */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                Yantra
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 400,
                  color: '#64748b',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Execution & Scheduling
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block', lineHeight: 1 }}>
              ServiceNow Human-in-the-Loop Engine
            </Typography>
          </Box>
        </Box>

        {/* ── Right: Controls ─────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>

          {/* Environment chip */}
          <FormControl size="small">
            <Select
              value={customerEnv}
              onChange={(e) => setCustomerEnv(e.target.value)}
              renderValue={(val) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: envColor,
                    flexShrink: 0,
                    boxShadow: `0 0 0 2px ${envColor}30`,
                  }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                    {val.replace('Customer-', '').replace('-PRD', ' ·\u00a0Prod').replace('-STG', ' ·\u00a0Stage')}
                  </Typography>
                </Box>
              )}
              sx={{
                fontSize: '0.8rem',
                height: 32,
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontWeight: 500,
                pl: 1,
                pr: 0.5,
                minWidth: 170,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiSelect-select': { py: 0.75, pl: 0 },
              }}
            >
              <MenuItem value="Customer-Alpha-PRD">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10b981' }} />
                  Alpha · Production
                </Box>
              </MenuItem>
              <MenuItem value="Customer-Alpha-STG">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  Alpha · Staging
                </Box>
              </MenuItem>
              <MenuItem value="Customer-Beta-PRD">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10b981' }} />
                  Beta · Production
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Divider */}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center' }} />

          {/* Role Switcher */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.25,
            height: 32,
            bgcolor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}>
            <ShieldOutlined sx={{ fontSize: 14, color: currentRole === 'service_owner' ? '#6366f1' : '#0284c7', flexShrink: 0 }} />
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
                '& .MuiSelect-select': { py: 0, pr: 2.5, pl: 0 },
              }}
            >
              <MenuItem value="engineer">Assigned Engineer</MenuItem>
              <MenuItem value="service_owner">Service Owner</MenuItem>
              <MenuItem value="ciso">CISO / Auditor</MenuItem>
            </Select>
          </Box>

          {/* MID Server Status */}
          <Tooltip title="MID Server: Connected to ServiceNow">
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.6,
              px: 1.25,
              height: 32,
              bgcolor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
            }}>
              <Box sx={{
                width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.4 },
                },
              }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46' }}>
                MID Connected
              </Typography>
            </Box>
          </Tooltip>

          {/* Divider */}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center' }} />

          {/* Notifications */}
          <Tooltip title={`${activeReqCount} active requests`}>
            <IconButton size="small" sx={{ width: 32, height: 32, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Badge
                badgeContent={activeReqCount}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
              >
                <NotificationsOutlined sx={{ fontSize: 17, color: '#64748b' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Avatar */}
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: '0.75rem',
              fontWeight: 700,
              bgcolor: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              ml: 0.25,
            }}
          >
            SH
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
