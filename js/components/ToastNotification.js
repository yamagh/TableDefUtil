/**
 * Toast Notification Component
 * 
 * Usage:
 * Toast.success('Success message');
 * Toast.error('Error message');
 * Toast.info('Info message');
 * Toast.warning('Warning message');
 */
const Toast = (() => {
  const containerId = 'toast-container';

  // Create container if it doesn't exist
  const ensureContainer = () => {
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      document.body.appendChild(container);
    }
    return container;
  };

  const show = (message, type = 'info', duration = 3000) => {
    const container = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon based on type
    let iconClass = 'bi-info-circle';
    if (type === 'success') iconClass = 'bi-check-circle';
    if (type === 'error') iconClass = 'bi-exclamation-octagon';
    if (type === 'warning') iconClass = 'bi-exclamation-triangle';

    toast.innerHTML = `<i class="bi ${iconClass}"></i> <span>${message}</span>`;
    
    // Auto remove
    const remove = () => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      });
    };

    setTimeout(remove, duration);
    
    // Click to dismiss
    toast.onclick = remove;

    container.appendChild(toast);
  };

  return {
    success: (msg, duration) => show(msg, 'success', duration),
    error: (msg, duration) => show(msg, 'error', duration),
    info: (msg, duration) => show(msg, 'info', duration),
    warning: (msg, duration) => show(msg, 'warning', duration)
  };
})();
