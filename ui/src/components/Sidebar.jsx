import React from 'react';
import {
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip
} from '@mui/material';
import {
  DashboardOutlined,
  PlayCircleOutline,
  VerifiedOutlined,
  MenuBookOutlined,
  HelpOutlineOutlined,
  LayersOutlined,
  FactCheckOutlined,
  LockClockOutlined,
  AutoAwesomeOutlined,
  SettingsSuggestOutlined,
  PsychologyOutlined
} from '@mui/icons-material';

const drawerWidth = 240;

export default function Sidebar({ currentView, setCurrentView, pendingApprovalsCount, qualifiedProceduresCount }) {
  const coreMenuItems = [
    { id: 'dashboard', label: 'Operational Dashboard', icon: <DashboardOutlined /> },
    { id: 'engineer_workspace', label: 'Engineer Execution Hub', icon: <PlayCircleOutline />, badge: pendingApprovalsCount, badgeColor: 'warning' },
    { id: 'qualification_tracker', label: '100-Run Qualification', icon: <VerifiedOutlined />, badge: qualifiedProceduresCount, badgeColor: 'success' },
    { id: 'snow_generator', label: 'ServiceNow Sample Generator', icon: <AutoAwesomeOutlined />, badge: 'LIVE', badgeColor: 'info' },
  ];

  const opsMenuItems = [
    { id: 'procedures', label: 'Procedure Repository', icon: <MenuBookOutlined /> },
    { id: 'missing_info', label: 'Missing Info Manager', icon: <HelpOutlineOutlined /> },
    { id: 'bulk_scheduled', label: 'Bulk & Scheduling', icon: <LayersOutlined /> },
    { id: 'audit_trail', label: 'Audit & Evidence Trail', icon: <FactCheckOutlined /> },
  ];

  const adminMenuItems = [
    { id: 'snow_admin', label: 'ServiceNow Integration', icon: <SettingsSuggestOutlined />, badge: 'CONFIG', badgeColor: 'primary' },
    { id: 'llm_admin', label: 'AI & LLM Engine', icon: <PsychologyOutlined />, badge: 'LOCAL', badgeColor: 'secondary' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', justifyContent: 'space-between', py: 1.5 }}>
        <Box sx={{ px: 1 }}>
          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 0.5,
              display: 'block',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            CORE PLATFORM
          </Typography>
          <List disablePadding>
            {coreMenuItems.map((item) => {
              const isSelected = currentView === item.id;
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => setCurrentView(item.id)}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.9,
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: '#f0f9ff',
                        color: '#0284c7',
                        fontWeight: 600,
                        '& .MuiListItemIcon-root': { color: '#0284c7' },
                      },
                      '&:hover': {
                        bgcolor: '#f8fafc',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: isSelected ? '#0284c7' : '#64748b' }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 500, noWrap: true }}
                    />
                    {item.badge !== undefined && (
                      <Chip
                        size="small"
                        label={item.badge}
                        color={item.badgeColor || 'default'}
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, ml: 0.5 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 1.5, mx: 1.5 }} />

          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 0.5,
              display: 'block',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            OPERATIONS & GOVERNANCE
          </Typography>
          <List disablePadding>
            {opsMenuItems.map((item) => {
              const isSelected = currentView === item.id;
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => setCurrentView(item.id)}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.9,
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: '#f0f9ff',
                        color: '#0284c7',
                        fontWeight: 600,
                        '& .MuiListItemIcon-root': { color: '#0284c7' },
                      },
                      '&:hover': {
                        bgcolor: '#f8fafc',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: isSelected ? '#0284c7' : '#64748b' }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 500, noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 1.5, mx: 1.5 }} />

          <Typography
            variant="overline"
            sx={{
              px: 2,
              py: 0.5,
              display: 'block',
              color: '#94a3b8',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            ADMIN & TOOLS
          </Typography>
          <List disablePadding>
            {adminMenuItems.map((item) => {
              const isSelected = currentView === item.id;
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={isSelected}
                    onClick={() => setCurrentView(item.id)}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.9,
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: '#f0f9ff',
                        color: '#0284c7',
                        fontWeight: 600,
                        '& .MuiListItemIcon-root': { color: '#0284c7' },
                      },
                      '&:hover': {
                        bgcolor: '#f8fafc',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 34, color: isSelected ? '#0284c7' : '#64748b' }}>
                      {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 500, noWrap: true }}
                    />
                    {item.badge !== undefined && (
                      <Chip
                        size="small"
                        label={item.badge}
                        color={item.badgeColor || 'default'}
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, ml: 0.5 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Footer Governance Card */}
        <Box sx={{ m: 1.5, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
            <LockClockOutlined sx={{ fontSize: 16, color: '#0284c7' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.72rem' }}>
              Governance Rule
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.7rem', lineHeight: 1.35 }}>
            100 consecutive runs earn autonomy. Failure restores human approval instantly.
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
