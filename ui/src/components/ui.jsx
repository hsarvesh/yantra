/**
 * Shared UI primitives for Yantra views.
 * Import from here to keep all views consistent.
 */
import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';

// ─── PageHeader ────────────────────────────────────────────────────────────────
/**
 * @param {string}   title       - Bold heading
 * @param {string}   description - Subdued description text
 * @param {string}   brdRef      - Optional BRD section reference e.g. "§12.5"
 * @param {ReactNode} actions    - Optional right-side action buttons
 * @param {ReactNode} icon       - Optional icon shown left of title
 * @param {string}   iconColor   - Background colour of the icon box
 */
export function PageHeader({ title, description, brdRef, actions, icon, iconColor = '#0284c7' }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {icon && (
            <Box sx={{
              width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
              bgcolor: alpha(iconColor, 0.1),
              border: `1px solid ${alpha(iconColor, 0.2)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mt: 0.25,
            }}>
              {React.cloneElement(icon, { sx: { fontSize: 20, color: iconColor } })}
            </Box>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {title}
              </Typography>
              {brdRef && (
                <Chip
                  label={`BRD ${brdRef}`}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: alpha('#6366f1', 0.08), color: '#4338ca',
                    border: '1px solid', borderColor: alpha('#6366f1', 0.2),
                  }}
                />
              )}
            </Box>
            {description && (
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.4, maxWidth: 680, lineHeight: 1.6 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Box>
      <Divider sx={{ mt: 2.5 }} />
    </Box>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
/**
 * @param {string}   label       - Metric label
 * @param {string}   value       - Primary value to display
 * @param {string}   sub         - Optional sub-label below value
 * @param {ReactNode} icon       - Icon for the card
 * @param {string}   color       - Accent colour
 * @param {string}   trend       - Optional trend text e.g. "+2 today"
 * @param {string}   trendColor  - Colour for trend chip
 * @param {function} onClick     - Optional click handler
 */
export function StatCard({ label, value, sub, icon, color = '#0284c7', trend, trendColor = 'success', onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2.5,
        bgcolor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        '&:hover': onClick ? {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transform: 'translateY(-1px)',
          borderColor: alpha(color, 0.3),
        } : {},
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
          {label}
        </Typography>
        {icon && (
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            bgcolor: alpha(color, 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 17, color } })}
          </Box>
        )}
      </Box>

      <Box>
        <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', mt: 0.4 }}>
            {sub}
          </Typography>
        )}
      </Box>

      {trend && (
        <Chip
          label={trend}
          size="small"
          color={trendColor}
          sx={{ alignSelf: 'flex-start', height: 18, fontSize: '0.63rem', fontWeight: 700 }}
        />
      )}
    </Box>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
/**
 * A card wrapper with a title bar.
 * @param {string}   title      - Section title
 * @param {ReactNode} actions   - Right side controls
 * @param {ReactNode} children  - Card body content
 * @param {object}   sx         - Extra sx overrides
 */
export function SectionCard({ title, subtitle, actions, children, sx = {}, noPadding = false }) {
  return (
    <Box sx={{
      bgcolor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      ...sx,
    }}>
      {(title || actions) && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.75,
          borderBottom: '1px solid #f1f5f9',
        }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem', mt: 0.2 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {actions}
            </Box>
          )}
        </Box>
      )}
      <Box sx={noPadding ? {} : { p: 2.5 }}>
        {children}
      </Box>
    </Box>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, message, description }) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      {icon && (
        <Box sx={{ color: '#cbd5e1', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
          {React.cloneElement(icon, { sx: { fontSize: 40 } })}
        </Box>
      )}
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
        {message}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

// ─── StatusChip ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
  trusted:         { label: 'Trusted',         color: 'success' },
  supervised:      { label: 'Supervised',      color: 'info'    },
  eligible:        { label: 'Eligible',        color: 'warning' },
  requalification: { label: 'Requalification', color: 'error'   },
  success:         { label: 'Success',         color: 'success' },
  error:           { label: 'Error',           color: 'error'   },
  pending:         { label: 'Pending',         color: 'warning' },
};

export function StatusChip({ status, label, size = 'small' }) {
  const cfg = STATUS_MAP[status?.toLowerCase()] || { label: label || status, color: 'default' };
  return (
    <Chip
      size={size}
      label={cfg.label}
      color={cfg.color}
      sx={{ fontWeight: 700, fontSize: size === 'small' ? '0.68rem' : '0.78rem', height: size === 'small' ? 20 : 24 }}
    />
  );
}
