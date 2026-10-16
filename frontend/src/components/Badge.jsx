import React from 'react';

export const Badge = ({ variant = 'info', children, className = '' }) => {
  const getVariantClass = () => {
    switch (variant.toLowerCase()) {
      case 'success':
      case 'delivered':
      case 'active':
      case 'in_stock':
        return 'badge-success';
      case 'warning':
      case 'processing':
      case 'low_stock':
        return 'badge-warning';
      case 'danger':
      case 'cancelled':
      case 'inactive':
      case 'out_of_stock':
        return 'badge-danger';
      case 'purple':
      case 'shipped':
        return 'badge-purple';
      case 'info':
      case 'confirmed':
      case 'created':
      default:
        return 'badge-info';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
      {children}
    </span>
  );
};
