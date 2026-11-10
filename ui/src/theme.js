import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0284c7',       // Sky Blue 600
      light: '#38bdf8',      // Sky Blue 400
      dark: '#0369a1',       // Sky Blue 700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1',       // Indigo 500
      light: '#a5b4fc',      // Indigo 300
      dark: '#4338ca',       // Indigo 700
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f1f5f9',    // Slate 100 — slightly more visible contrast
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',    // Slate 900
      secondary: '#475569',  // Slate 600
      disabled: '#94a3b8',   // Slate 400
    },
    divider: '#e2e8f0',      // Slate 200
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h5: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3 },
    h6: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle2: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    caption: { lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0' },
    overline: { fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
    '0 2px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 4px 8px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 4px 12px -2px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 8px 16px -4px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 10px 20px -4px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 12px 24px -6px rgba(0,0,0,0.1), 0 4px 8px -4px rgba(0,0,0,0.06)',
    '0 16px 32px -8px rgba(0,0,0,0.12), 0 4px 8px -4px rgba(0,0,0,0.06)',
    '0 20px 40px -8px rgba(0,0,0,0.12), 0 8px 16px -6px rgba(0,0,0,0.06)',
    '0 20px 40px -8px rgba(0,0,0,0.14), 0 8px 16px -6px rgba(0,0,0,0.08)',
    '0 24px 48px -12px rgba(0,0,0,0.14), 0 8px 16px -6px rgba(0,0,0,0.08)',
    '0 24px 48px -12px rgba(0,0,0,0.16), 0 8px 16px -6px rgba(0,0,0,0.1)',
    '0 28px 56px -12px rgba(0,0,0,0.16), 0 12px 24px -8px rgba(0,0,0,0.1)',
    '0 32px 64px -16px rgba(0,0,0,0.18), 0 12px 24px -8px rgba(0,0,0,0.1)',
    '0 32px 64px -16px rgba(0,0,0,0.2), 0 16px 32px -10px rgba(0,0,0,0.12)',
    '0 36px 72px -16px rgba(0,0,0,0.2), 0 16px 32px -10px rgba(0,0,0,0.12)',
    '0 36px 72px -16px rgba(0,0,0,0.22), 0 20px 40px -12px rgba(0,0,0,0.14)',
    '0 40px 80px -20px rgba(0,0,0,0.22), 0 20px 40px -12px rgba(0,0,0,0.14)',
    '0 40px 80px -20px rgba(0,0,0,0.24), 0 24px 48px -14px rgba(0,0,0,0.16)',
    '0 44px 88px -20px rgba(0,0,0,0.24), 0 24px 48px -14px rgba(0,0,0,0.16)',
    '0 48px 96px -24px rgba(0,0,0,0.26), 0 28px 56px -16px rgba(0,0,0,0.18)',
    '0 48px 96px -24px rgba(0,0,0,0.28), 0 28px 56px -16px rgba(0,0,0,0.18)',
    '0 52px 100px -24px rgba(0,0,0,0.3), 0 32px 64px -18px rgba(0,0,0,0.2)',
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        'html, body': {
          scrollBehavior: 'smooth',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 100%)',
          },
        },
        containedSuccess: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        },
        containedError: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        },
        outlinedPrimary: {
          borderColor: '#bae6fd',
          '&:hover': {
            borderColor: '#0284c7',
            backgroundColor: alpha('#0284c7', 0.04),
          },
        },
        sizeLarge: { padding: '10px 24px', fontSize: '0.9rem' },
        sizeMedium: { padding: '8px 18px', fontSize: '0.85rem' },
        sizeSmall: { padding: '4px 12px', fontSize: '0.78rem' },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          backgroundImage: 'none',
          transition: 'box-shadow 0.2s ease',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': { paddingBottom: '20px' },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          transition: 'all 0.15s ease',
        },
        colorPrimary: {
          backgroundColor: alpha('#0284c7', 0.1),
          color: '#0369a1',
          '&:hover': { backgroundColor: alpha('#0284c7', 0.18) },
        },
        colorSuccess: {
          backgroundColor: alpha('#10b981', 0.1),
          color: '#059669',
        },
        colorWarning: {
          backgroundColor: alpha('#f59e0b', 0.12),
          color: '#b45309',
        },
        colorError: {
          backgroundColor: alpha('#ef4444', 0.1),
          color: '#dc2626',
        },
        colorInfo: {
          backgroundColor: alpha('#0ea5e9', 0.1),
          color: '#0369a1',
        },
        colorSecondary: {
          backgroundColor: alpha('#6366f1', 0.1),
          color: '#4338ca',
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8fafc',
            color: '#475569',
            fontWeight: 700,
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            borderBottom: '1px solid #e2e8f0',
            padding: '10px 14px',
            whiteSpace: 'nowrap',
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          padding: '10px 14px',
          fontSize: '0.82rem',
        },
        body: {
          color: '#1e293b',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.1s ease',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.15s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha('#0284c7', 0.12)}`,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0284c7',
              },
            },
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0284c7',
            borderWidth: '1.5px',
          },
        },
        notchedOutline: {
          borderColor: '#e2e8f0',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: '#e2e8f0' },
        bar: { borderRadius: 99 },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontSize: '0.83rem' },
        standardSuccess: {
          backgroundColor: alpha('#10b981', 0.08),
          border: `1px solid ${alpha('#10b981', 0.2)}`,
          color: '#065f46',
          '& .MuiAlert-icon': { color: '#10b981' },
        },
        standardWarning: {
          backgroundColor: alpha('#f59e0b', 0.08),
          border: `1px solid ${alpha('#f59e0b', 0.2)}`,
          color: '#78350f',
          '& .MuiAlert-icon': { color: '#f59e0b' },
        },
        standardError: {
          backgroundColor: alpha('#ef4444', 0.08),
          border: `1px solid ${alpha('#ef4444', 0.2)}`,
          color: '#7f1d1d',
          '& .MuiAlert-icon': { color: '#ef4444' },
        },
        standardInfo: {
          backgroundColor: alpha('#0ea5e9', 0.08),
          border: `1px solid ${alpha('#0ea5e9', 0.2)}`,
          color: '#075985',
          '& .MuiAlert-icon': { color: '#0ea5e9' },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            height: 2.5,
            borderRadius: '2px 2px 0 0',
            backgroundColor: '#0284c7',
          },
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.83rem',
          color: '#64748b',
          minHeight: 42,
          padding: '8px 16px',
          transition: 'color 0.15s ease',
          '&.Mui-selected': {
            color: '#0284c7',
            fontWeight: 700,
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 700,
          padding: '20px 24px 12px',
          borderBottom: '1px solid #f1f5f9',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
        },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 20px',
          borderTop: '1px solid #f1f5f9',
          gap: 8,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderColor: '#e2e8f0',
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#f1f5f9' },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e293b',
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '5px 10px',
        },
        arrow: { color: '#1e293b' },
      },
      defaultProps: { arrow: true },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease',
        },
      },
    },

    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.65rem',
          fontWeight: 700,
          minWidth: 18,
          height: 18,
          padding: '0 4px',
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: alpha('#0284c7', 0.08),
          },
        },
      },
    },

    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
      },
    },
  },
});
