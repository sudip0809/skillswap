export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const idOf = x => String(x && x._id ? x._id : x);
export const fmtDate = d => new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = d => new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = d => `${fmtDate(d)}, ${fmtTime(d)}`;
export const timeAgo = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return fmtDate(d);
};
export const partnerOf = (swap, meId) => (idOf(swap.from) === String(meId) ? swap.to : swap.from);
export const fmtSize = n => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
export const STATUS = {
  proposed: { color: 'warning', label: 'Awaiting reply' },
  scheduled: { color: 'info', label: 'Scheduled' },
  in_progress: { color: 'primary', label: 'In progress' },
  completed: { color: 'success', label: 'Completed' },
  rejected: { color: 'secondary', label: 'Declined' },
  cancelled: { color: 'secondary', label: 'Cancelled' },
  missed: { color: 'danger', label: 'Missed' }
};
