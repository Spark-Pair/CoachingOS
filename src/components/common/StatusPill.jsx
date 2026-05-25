const toneMap = {
  Present: 'success',
  Paid: 'success',
  Partial: 'warning',
  'Day-off': 'warning',
  Leave: 'warning',
  Absent: 'danger',
  Unpaid: 'danger',
  Active: 'success',
  Inactive: 'neutral',
}

function StatusPill({ value }) {
  const tone = toneMap[value] || 'neutral'
  return <span className={`status-pill ${tone}`}>{value}</span>
}

export default StatusPill
