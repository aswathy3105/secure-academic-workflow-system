const StatusBadge = ({ status }) => {
  const normalizedStatus = status?.toLowerCase();
  
  // Simplify display status for tables as requested
  let displayStatus = status;
  if (['forwarded to gate', 'out', 'inside'].includes(normalizedStatus)) {
    displayStatus = 'Approved';
  }

  const getStyles = () => {
    switch (displayStatus?.toLowerCase()) {
      case 'approved':
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'on duty':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'emergency leave':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'rejected':
      case 'inactive':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-800';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStyles()}`}>
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
