export function getCategoryClass(category) {
  const map = {
    Water: 'cat-water',
    Electricity: 'cat-electricity',
    'Wi-Fi': 'cat-wifi',
    Sanitation: 'cat-sanitation',
    Safety: 'cat-safety',
    Classroom: 'cat-classroom',
  };
  return map[category] || 'cat-other';
}

export function getUrgencyClass(urgency) {
  const map = {
    Low: 'urg-low',
    Medium: 'urg-medium',
    High: 'urg-high',
    Critical: 'urg-critical',
  };
  return map[urgency] || 'urg-medium';
}

export function getStatusClass(status) {
  const map = {
    Open: 'status-open',
    'In Progress': 'status-progress',
    Resolved: 'status-resolved',
  };
  return map[status] || 'status-open';
}

export function getCategoryEmoji(category) {
  const map = {
    Water: '💧',
    Electricity: '⚡',
    'Wi-Fi': '📶',
    Sanitation: '🧹',
    Safety: '🛡️',
    Classroom: '🏫',
    Other: '🔧',
  };
  return map[category] || '🔧';
}

export function formatDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  if (isNaN(date)) return 'Invalid date';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);

  if (days > 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export const CATEGORIES = ['Water', 'Electricity', 'Wi-Fi', 'Sanitation', 'Safety', 'Classroom', 'Other'];
export const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];
export const STATUSES = ['Open', 'In Progress', 'Resolved'];

export const BUILDINGS = [
  'Block A', 'Block B', 'Block C', 'Block D', 'Block E',
  'Library', 'Canteen', 'Auditorium', 'Sports Complex',
  'Admin Block', 'Lab Block', 'Hostel A', 'Hostel B', 'Campus Grounds',
];
