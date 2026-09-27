/**
 * BizFlow AI - Modal Controller, Task Editor, & Keyboard Shortcuts
 */

let editingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  initKeyboardShortcuts();
  updateDashboardMetrics();
});

function updateDashboardMetrics() {
  const metrics = store.getMetrics();

  setElemText('metric-total', metrics.total);
  setElemText('metric-inprogress', metrics.inProgress);
  setElemText('metric-done', metrics.done);
  setElemText('metric-overdue', metrics.overdue);
  setElemText('metric-aiextracted', metrics.aiCount);
  setElemText('metric-hours-saved', `${metrics.hoursSaved} hrs`);
  setElemText('metric-score', `${metrics.productivityScore}`);

  // Progress Bar for productivity score
  const scoreBar = document.getElementById('metric-score-bar');
  if (scoreBar) {
    scoreBar.style.width = `${metrics.productivityScore}%`;
  }
}

function setElemText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Task Creation & Edit Modal Logic
 */
function openCreateTaskModal(defaultColumn = 'todo') {
  editingTaskId = null;
  const form = document.getElementById('task-form');
  if (form) form.reset();

  setElemText('modal-title', 'Create New Task');
  const colSelect = document.getElementById('task-column-input');
  if (colSelect) colSelect.value = defaultColumn;

  const deadlineInput = document.getElementById('task-deadline-input');
  if (deadlineInput) deadlineInput.value = getRelativeDateStr(1);

  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.add('active');
}

function editTaskModal(taskId) {
  const task = store.tasks.find(t => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  setElemText('modal-title', 'Edit Task');

  setInputValue('task-title-input', task.title);
  setInputValue('task-desc-input', task.description);
  setInputValue('task-column-input', task.column);
  setInputValue('task-priority-input', task.priority);
  setInputValue('task-category-input', task.category);
  setInputValue('task-deadline-input', task.deadline || getRelativeDateStr(1));
  setInputValue('task-assignee-input', task.assignee);
  setInputValue('task-hours-input', task.estimatedHours || 2);

  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.add('active');
}

function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.remove('active');
  editingTaskId = null;
}

function handleSaveTask(event) {
  event.preventDefault();

  const title = getInputValue('task-title-input').trim();
  if (!title) {
    showToast('Task title is required', 'warning');
    return;
  }

  const taskData = {
    title: title,
    description: getInputValue('task-desc-input').trim(),
    column: getInputValue('task-column-input'),
    priority: getInputValue('task-priority-input'),
    category: getInputValue('task-category-input'),
    deadline: getInputValue('task-deadline-input'),
    assignee: getInputValue('task-assignee-input').trim() || 'Team Member',
    estimatedHours: parseFloat(getInputValue('task-hours-input')) || 2
  };

  if (editingTaskId) {
    store.updateTask(editingTaskId, taskData);
    showToast(`Updated task: "${title}"`, 'success');
  } else {
    store.addTask(taskData);
    showToast(`Created new task: "${title}"`, 'success');
  }

  closeTaskModal();
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

/**
 * Command Palette (Ctrl+K) & Shortcuts Modal
 */
function openCommandPalette() {
  const modal = document.getElementById('cmd-palette-modal');
  if (modal) {
    modal.classList.add('active');
    const input = document.getElementById('cmd-search-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 100);
    }
  }
}

function closeCommandPalette() {
  const modal = document.getElementById('cmd-palette-modal');
  if (modal) modal.classList.remove('active');
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Open Command Palette on Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openCommandPalette();
    }
    // New Task shortcut on 'N' when not typing in an input
    else if (e.key.toLowerCase() === 'n' && !isTypingInInput()) {
      e.preventDefault();
      openCreateTaskModal();
    }
    // Close modals on Escape
    else if (e.key === 'Escape') {
      closeTaskModal();
      closeAIModal();
      closeCommandPalette();
    }
  });
}

function isTypingInInput() {
  const active = document.activeElement;
  return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
}

// Export / Import State
function exportDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store.tasks, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `bizflow_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Exported backup file!', 'success');
}

function switchView(viewName) {
  const boardView = document.getElementById('view-board');
  const analyticsView = document.getElementById('view-analytics');
  const boardTab = document.getElementById('tab-btn-board');
  const analyticsTab = document.getElementById('tab-btn-analytics');

  if (viewName === 'analytics') {
    if (boardView) boardView.classList.add('hidden');
    if (analyticsView) analyticsView.classList.remove('hidden');
    if (boardTab) boardTab.classList.remove('active');
    if (analyticsTab) analyticsTab.classList.add('active');
    if (window.updateProductivityCharts) window.updateProductivityCharts();
  } else {
    if (analyticsView) analyticsView.classList.add('hidden');
    if (boardView) boardView.classList.remove('hidden');
    if (analyticsTab) analyticsTab.classList.remove('active');
    if (boardTab) boardTab.classList.add('active');
  }
}

window.updateDashboardMetrics = updateDashboardMetrics;
window.openCreateTaskModal = openCreateTaskModal;
window.editTaskModal = editTaskModal;
window.closeTaskModal = closeTaskModal;
window.handleSaveTask = handleSaveTask;
window.openCommandPalette = openCommandPalette;
window.closeCommandPalette = closeCommandPalette;
window.exportDataJSON = exportDataJSON;
window.switchView = switchView;

