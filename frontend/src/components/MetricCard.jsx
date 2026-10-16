import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const getGlowColor = () => {
    switch (color) {
      case 'emerald':
        return 'rgba(16, 185, 129, 0.2)';
      case 'amber':
        return 'rgba(245, 158, 11, 0.2)';
      case 'rose':
        return 'rgba(239, 68, 68, 0.2)';
      case 'purple':
        return 'rgba(168, 85, 247, 0.2)';
      case 'blue':
      default:
        return 'rgba(59, 130, 246, 0.2)';
    }
  };

  const getIconColor = () => {
    switch (color) {
      case 'emerald':
        return '#10b981';
      case 'amber':
        return '#f59e0b';
      case 'rose':
        return '#ef4444';
      case 'purple':
        return '#a855f7';
      case 'blue':
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="metric-card" style={{ boxShadow: `0 4px 20px ${getGlowColor()}` }}>
      <div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {title}
        </span>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: '4px 0', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {subtitle && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}
      </div>
      {Icon && (
        <div className="metric-icon-box" style={{ color: getIconColor() }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};
