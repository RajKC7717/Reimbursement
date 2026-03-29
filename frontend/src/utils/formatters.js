/**
 * Formatting Utilities
 */

export function formatCurrency(amount, currencyCode = 'USD') {
  if (amount === null || amount === undefined) return '—';
  const code = currencyCode || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch(e) {
    return `${code} ${Number(amount).toFixed(2)}`;
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusBadgeClass(status) {
  const map = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    draft: 'badge-draft',
    cancelled: 'badge-cancelled',
    skipped: 'badge-skipped',
  };
  return map[status] || 'badge-draft';
}

export function getRoleBadgeClass(role) {
  const map = {
    admin: 'badge-admin',
    manager: 'badge-manager',
    employee: 'badge-employee',
  };
  return map[role] || 'badge-employee';
}
