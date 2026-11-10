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
  Chip,
  alpha
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

const DRAWER_WIDTH = 240;

function NavSection({ label, children }) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          px: 1.5,
          pt: 1,
          pb: 0.5,
          display: 'block',
          color: '#94a3b8',
          fontWeight: 700,
          fontSize: '0.63rem',
          letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Typography>
      <List disablePadding>{children}</List>
    </Box>
  );
}

function NavItem({ item, isSelected, onClick }) {
  return (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      <ListItemButton
        selected={isSelected}
        onClick={onClick}
        sx={{
          borderRadius: '8px',
          py: 0.85,
          px: 1.25,
          mx: 0,
          position: 'relative',
          transition: 'all 0.15s ease',
          '&.Mui-selected': {
            bgcolor: alpha('#0284c7', 0.08),
            color: '#0284c7',
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '20%',
              width: 3,
              bgcolor: '#0284c7',
              borderRadius: '0 2px 2px 0',
              backgroundColor: '#0284c7',
            },
            '& .MuiListItemIcon-root': { color: '#0284c7' },
            '& .nav-label': { fontWeight: 700, color: '#0284c7' },
          },
          '&:not(.Mui-selected):hover': {
            bgcolor: '#f8fafc',
            '& .nav-label': { color: '#1e293b' },
            '& .MuiListItemIcon-root': { color: '#475569' },
          },
        }}
      >
        {/* Hover indicator bar */}
        <ListItemIcon sx={{ minWidth: 32, color: isSelected ? '#0284c7' : '#94a3b8', transition: 'color 0.15s ease' }}>
          {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            className: 'nav-label',
            fontSize: '0.81rem',
            fontWeight: isSelected ? 700 : 500,
            color: isSelected ? '#0284c7' : '#475569',
            noWrap: true,
            transition: 'color 0.15s ease',
          }}
        />
        {item.badge !== undefined && (
          <Chip
            size="small"
            label={item.badge}
            color={item.badgeColor || 'default'}
            sx={{ height: 17, fontSize: '0.6rem', fontWeight: 700, ml: 0.5, flexShrink: 0 }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
}

export default function Sidebar({ currentView, setCurrentView, pendingApprovalsCount, qualifiedProceduresCount }) {
  const coreMenuItems = [
    { id: 'dashboard',           label: 'Operational Dashboard',   icon: <DashboardOutlined /> },
    { id: 'engineer_workspace',  label: 'Engineer Execution Hub',  icon: <PlayCircleOutline />, badge: pendingApprovalsCount || undefined, badgeColor: 'warning' },
    { id: 'qualification_tracker', label: '100-Run Qualification', icon: <VerifiedOutlined />,  badge: qualifiedProceduresCount || undefined, badgeColor: 'success' },
    { id: 'snow_generator',      label: 'RITM Generator',          icon: <AutoAwesomeOutlined />, badge: 'LIVE', badgeColor: 'info' },
  ];

  const opsMenuItems = [
    { id: 'procedures',     label: 'Procedure Repository',   icon: <MenuBookOutlined /> },
    { id: 'missing_info',   label: 'Missing Info Manager',   icon: <HelpOutlineOutlined /> },
    { id: 'bulk_scheduled', label: 'Bulk & Scheduling',      icon: <LayersOutlined /> },
    { id: 'audit_trail',    label: 'Audit & Evidence Trail', icon: <FactCheckOutlined /> },
  ];

  const adminMenuItems = [
    { id: 'snow_admin', label: 'ServiceNow Integration', icon: <SettingsSuggestOutlined />, badge: 'CONFIG', badgeColor: 'primary' },
    { id: 'llm_admin',  label: 'AI & LLM Engine',        icon: <PsychologyOutlined />,      badge: 'LOCAL',  badgeColor: 'secondary' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar sx={{ minHeight: '60px !important' }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', justifyContent: 'space-between' }}>
        {/* Nav Items */}
        <Box sx={{ px: 1, py: 1.5, overflowY: 'auto', overflowX: 'hidden', flex: 1 }}>
          <NavSection label="Core Platform">
            {coreMenuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isSelected={currentView === item.id}
                onClick={() => setCurrentView(item.id)}
              />
            ))}
          </NavSection>

          <Divider sx={{ my: 1.5 }} />

          <NavSection label="Operations & Governance">
            {opsMenuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isSelected={currentView === item.id}
                onClick={() => setCurrentView(item.id)}
              />
            ))}
          </NavSection>

          <Divider sx={{ my: 1.5 }} />

          <NavSection label="Admin & Tools">
            {adminMenuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isSelected={currentView === item.id}
                onClick={() => setCurrentView(item.id)}
              />
            ))}
          </NavSection>
        </Box>

        {/* Footer: Governance card */}
        <Box sx={{ px: 1.5, pb: 2 }}>
          <Box sx={{
            p: 1.5,
            bgcolor: alpha('#0284c7', 0.05),
            borderRadius: '10px',
            border: '1px solid',
            borderColor: alpha('#0284c7', 0.15),
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <LockClockOutlined sx={{ fontSize: 14, color: '#0284c7' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7', fontSize: '0.7rem' }}>
                100-Run Governance Rule
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.68rem', lineHeight: 1.4 }}>
              100 consecutive runs earn autonomy. Any failure instantly restores human approval.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
