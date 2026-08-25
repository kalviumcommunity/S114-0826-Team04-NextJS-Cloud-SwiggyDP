export default function StatusBadge({ children, tone = 'green' }) { return <span className={`status-badge ${tone}`}>{children}</span> }
