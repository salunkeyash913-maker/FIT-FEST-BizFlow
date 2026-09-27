/**
 * BizFlow AI - Main Application Logic & State Store
 */

const BIZFLOW_STORAGE_KEY = 'bizflow_ai_tasks_v2';

// Default Initial Seed Data if LocalStorage is empty
const DEFAULT_SAMPLE_TASKS = [
  {
    id: 'task-101',
    title: 'Reconcile Acme Corp Q3 Invoice & Payment',
    description: 'Verify bank deposit of $4,500 from Acme Corp and send updated tax receipt before end of day.',
    column: 'todo', // 'todo', 'in_progress', 'done'
    priority: 'high', // 'high', 'medium', 'low'
    category: 'Finance',
    deadline: getRelativeDateStr(0), // Today
    assignee: 'Sarah M.',
    subtasks: [
      { text: 'Check bank statement', completed: true },
      { text: 'Send tax invoice PDF', completed: false }
    ],
    estimatedHours: 2,
    aiExtracted: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'task-102',
    title: 'Dispatch Emergency Warehouse Order #884',
    description: 'Package and ship 50 units of industrial sensors to TechCorp Atlanta branch via priority freight.',
    column: 'in_progress',
    priority: 'high',
    category: 'Operations',
    deadline: getRelativeDateStr(1), // Tomorrow
    assignee: 'Marcus Vance',
    subtasks: [
      { text: 'Print shipping labels', completed: true },
      { text: 'Inspect packaging seal', completed: true },
      { text: 'Notify courier dispatch', completed: false }
    ],
    estimatedHours: 4,
    aiExtracted: false,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'task-103',
    title: 'Finalize Q4 Product Roadmap & Client Deck',
    description: 'Integrate new AI Workflow features into slide presentation for Friday executive review.',
    column: 'in_progress',
    priority: 'medium',
    category: 'Marketing',
    deadline: getRelativeDateStr(3),
    assignee: 'Elena Rostova',
    subtasks: [
      { text: 'Draft feature matrix', completed: true },
      { text: 'Add ROI chart graphic', completed: false }
    ],
    estimatedHours: 6,
    aiExtracted: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'task-104',
    title: 'Audit Customer Support SLAs & Response Rate',
    description: 'Review ticket resolution times from last week and publish resolution metrics on dashboard.',
    column: 'done',
    priority: 'low',
    category: 'Support',
    deadline: getRelativeDateStr(-1), // Yesterday
    assignee: 'David K.',
    subtasks: [
      { text: 'Export Zendesk CSV log', completed: true },
      { text: 'Calculate average resolution time', completed: true }
    ],
    estimatedHours: 3,
    aiExtracted: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'task-105',
    title: 'Schedule Onboarding Sync with New Enterprise Lead',
    description: 'Set up 30-min discovery call with VP of Operations at Nexus Global.',
    column: 'todo',
    priority: 'medium',
    category: 'Sales',
    deadline: getRelativeDateStr(2),
    assignee: 'Sarah M.',
    subtasks: [
      { text: 'Send Calendly link', completed: false }
    ],
    estimatedHours: 1,
    aiExtracted: true,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'task-106',
    title: 'Setup Automated Database Backups & Security Check',
    description: 'Configure automated S3 daily backups and update SSL certificates on core servers.',
    column: 'done',
    priority: 'high',
    category: 'Operations',
    deadline: getRelativeDateStr(-2),
    assignee: 'Marcus Vance',
    subtasks: [
      { text: 'Test backup restoration script', completed: true },
      { text: 'Renew TLS cert', completed: true }
    ],
    estimatedHours: 5,
    aiExtracted: false,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

// Helper to generate ISO date strings offset by days
function getRelativeDateStr(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

class BizFlowStore {
  constructor() {
    this.tasks = [];
    this.filterSearch = '';
    this.filterPriority = 'all';
    this.filterCategory = 'all';
    this.initStore();
  }

  initStore() {
    const rawData = localStorage.getItem(BIZFLOW_STORAGE_KEY);
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tasks = parsed;
        } else {
          this.tasks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_TASKS));
          this.saveStore();
        }
      } catch (e) {
        console.error('Failed to parse localStorage data, loading default seed.', e);
        this.tasks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_TASKS));
        this.saveStore();
      }
    } else {
      this.tasks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_TASKS));
      this.saveStore();
    }
  }

  saveStore() {
    localStorage.setItem(BIZFLOW_STORAGE_KEY, JSON.stringify(this.tasks));
    this.notifyStateChange();
  }

  resetToDefault() {
    this.tasks = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_TASKS));
    this.saveStore();
    showToast('Reset to original sample data!', 'info');
  }

  addTask(taskData) {
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      column: taskData.column || 'todo',
      priority: taskData.priority || 'medium',
      category: taskData.category || 'General',
      deadline: taskData.deadline || getRelativeDateStr(1),
      assignee: taskData.assignee || 'Team Member',
      subtasks: taskData.subtasks || [],
      estimatedHours: parseFloat(taskData.estimatedHours) || 2,
      aiExtracted: !!taskData.aiExtracted,
      createdAt: new Date().toISOString()
    };
    this.tasks.unshift(newTask);
    this.saveStore();
    return newTask;
  }

  addBatchTasks(taskArray) {
    const created = taskArray.map(t => ({
      id: 'task-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      title: t.title,
      description: t.description || '',
      column: t.column || 'todo',
      priority: t.priority || 'medium',
      category: t.category || 'General',
      deadline: t.deadline || getRelativeDateStr(1),
      assignee: t.assignee || 'AI Extracted',
      subtasks: t.subtasks || [],
      estimatedHours: t.estimatedHours || 2,
      aiExtracted: true,
      createdAt: new Date().toISOString()
    }));

    this.tasks = [...created, ...this.tasks];
    this.saveStore();
    return created;
  }

  updateTask(taskId, updatedFields) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updatedFields };
      this.saveStore();
    }
  }

  moveTaskColumn(taskId, newColumn) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.column !== newColumn) {
      const oldCol = task.column;
      task.column = newColumn;
      this.saveStore();
      
      if (newColumn === 'done') {
        showToast(`Completed: "${task.title}"`, 'success');
      } else {
        showToast(`Moved "${task.title}" to ${newColumn.replace('_', ' ').toUpperCase()}`, 'info');
      }
    }
  }

  deleteTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveStore();
    if (task) {
      showToast(`Deleted task: "${task.title}"`, 'warning');
    }
  }

  toggleSubtask(taskId, subtaskIndex) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.subtasks && task.subtasks[subtaskIndex]) {
      task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
      this.saveStore();
    }
  }

  getFilteredTasks() {
    return this.tasks.filter(t => {
      // Search filter
      const matchesSearch = !this.filterSearch || 
        t.title.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(this.filterSearch.toLowerCase()) ||
        t.assignee.toLowerCase().includes(this.filterSearch.toLowerCase());
      
      // Priority filter
      const matchesPriority = this.filterPriority === 'all' || t.priority === this.filterPriority;
      
      // Category filter
      const matchesCategory = this.filterCategory === 'all' || t.category === this.filterCategory;

      return matchesSearch && matchesPriority && matchesCategory;
    });
  }

  getMetrics() {
    const total = this.tasks.length;
    const todo = this.tasks.filter(t => t.column === 'todo').length;
    const inProgress = this.tasks.filter(t => t.column === 'in_progress').length;
    const done = this.tasks.filter(t => t.column === 'done').length;
    const aiCount = this.tasks.filter(t => t.aiExtracted).length;
    
    const todayStr = getRelativeDateStr(0);
    const overdue = this.tasks.filter(t => t.column !== 'done' && t.deadline && t.deadline < todayStr).length;

    // Calculate total hours saved by AI (approx 0.75h saved per extracted task + completed automation)
    const hoursSaved = (aiCount * 0.75 + done * 1.2).toFixed(1);
    
    // Productivity index calculation
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const productivityScore = Math.min(100, Math.max(20, Math.round(completionRate * 0.7 + (aiCount * 5) + 15)));

    return {
      total,
      todo,
      inProgress,
      done,
      overdue,
      aiCount,
      hoursSaved,
      completionRate,
      productivityScore
    };
  }

  notifyStateChange() {
    if (window.renderKanbanBoard) window.renderKanbanBoard();
    if (window.updateDashboardMetrics) window.updateDashboardMetrics();
    if (window.updateProductivityCharts) window.updateProductivityCharts();
  }
}

// Global App Instance
window.store = new BizFlowStore();

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-3.5 py-2.5 rounded-lg shadow-xl text-xs font-medium border glass-panel transition-all duration-200 transform translate-y-2 opacity-0 z-50`;
  
  let iconHtml = '<i class="fa-solid fa-circle-info text-indigo-400 text-xs"></i>';
  let borderClass = 'border-slate-800 text-slate-200 bg-slate-900/90';

  if (type === 'success') {
    iconHtml = '<i class="fa-solid fa-circle-check text-emerald-400 text-xs"></i>';
    borderClass = 'border-slate-800 text-slate-200 bg-slate-900/90';
  } else if (type === 'warning') {
    iconHtml = '<i class="fa-solid fa-triangle-exclamation text-amber-400 text-xs"></i>';
    borderClass = 'border-slate-800 text-slate-200 bg-slate-900/90';
  } else if (type === 'info') {
    iconHtml = '<i class="fa-solid fa-circle-info text-indigo-400 text-xs"></i>';
    borderClass = 'border-slate-800 text-slate-200 bg-slate-900/90';
  }

  toast.className += ` ${borderClass}`;
  toast.innerHTML = `${iconHtml} <span>${message}</span>`;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons({ targets: [toast] });

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  // Auto hide
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Confetti Celebration Trigger
 */
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
    });
  }
}
