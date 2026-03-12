import './PriorityBadge.css';

export default function PriorityBadge({ priority = 'Medium' }) {
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'priority-critical';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  return (
    <span className={`priority-badge ${getPriorityClass(priority)}`}>
      {priority}
    </span>
  );
}
