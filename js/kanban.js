/**
 * BizFlow AI - Kanban Board Module (Drag & Drop, Column Rendering, Filtering)
 */

document.addEventListener('DOMContentLoaded', () => {
  initKanbanEvents();
  renderKanbanBoard();
});

// Category Icon Mapping
const CATEGORY_ICONS = {
  Finance: 'credit-card',
  Operations: 'boxes',
  Marketing: 'megaphone',
  Support: 'headphones',
  Sales: 'trending-up',
  General: 'folder'
};

// Category Color Pill Mapping
const CATEGORY_COLORS = {
  Finance: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  Operations: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  Marketing: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  Support: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  Sales: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  General: 'bg-slate-800/80 text-slate-300 border-slate-700/60'
};

function renderKanbanBoard() {
  if (!window.store) return;
  
  const validTasks = (store.tasks || []).filter(t => t && typeof t === 'object' && typeof t.column === 'string');
  if (validTasks.length === 0) {
    if (typeof store.resetToDefault === 'function') {
      store.resetToDefault();
      return;
    }
  }

  const filteredTasks = store.getFilteredTasks();

  const todoCol = document.getElementById('column-todo');
  const inProgressCol = document.getElementById('column-in_progress');
  const doneCol = document.getElementById('column-done');

  if (!todoCol || !inProgressCol || !doneCol) return;

  const todoTasks = filteredTasks.filter(t => t && t.column === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t && t.column === 'in_progress');
  const doneTasks = filteredTasks.filter(t => t && t.column === 'done');

  // Update Counters
  updateCounter('count-todo', todoTasks.length);
  updateCounter('count-in_progress', inProgressTasks.length);
  updateCounter('count-done', doneTasks.length);

  // Render Card Elements into columns
  todoCol.innerHTML = renderColumnCards(todoTasks, 'todo');
  inProgressCol.innerHTML = renderColumnCards(inProgressTasks, 'in_progress');
  doneCol.innerHTML = renderColumnCards(doneTasks, 'done');

  // Attach card event listeners (Drag, Click, Subtask toggles, Action Buttons)
  attachCardListeners();

  // Re-initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

function updateCounter(elementId, count) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = count;
}

// Expandable subtasks state set
const expandedSubtaskCards = new Set();

function toggleCardSubtasks(taskId, event) {
  if (event) event.stopPropagation();
  if (expandedSubtaskCards.has(taskId)) {
    expandedSubtaskCards.delete(taskId);
  } else {
    expandedSubtaskCards.add(taskId);
  }
  renderKanbanBoard();
}

function renderColumnCards(tasks, columnId) {
  if (tasks.length === 0) {
    return `
      <div class="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-dashed border-slate-800/80 bg-slate-900/10 text-slate-500 min-h-[120px]">
        <p class="text-xs font-medium">No tasks in this column</p>
        <button onclick="openCreateTaskModal('${columnId}')" class="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
          <i class="fa-solid fa-plus text-[10px]"></i> Add Task
        </button>
      </div>
    `;
  }

  return tasks.map(task => createCardHtml(task)).join('');
}

function createCardHtml(task) {
  // Priority styling
  let priorityClass = 'badge-priority-medium';
  let priorityLabel = 'Medium';
  if (task.priority === 'high') {
    priorityClass = 'badge-priority-high';
    priorityLabel = 'High';
  } else if (task.priority === 'low') {
    priorityClass = 'badge-priority-low';
    priorityLabel = 'Low';
  }

  // Category styling
  const catColor = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.General;

  // Deadline calculation
  const todayStr = getRelativeDateStr(0);
  let deadlineBadge = '';
  if (task.deadline) {
    if (task.column !== 'done' && task.deadline < todayStr) {
      deadlineBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium badge-overdue flex items-center gap-1">
        Overdue
      </span>`;
    } else if (task.deadline === todayStr) {
      deadlineBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium badge-today flex items-center gap-1">
        Today
      </span>`;
    } else {
      deadlineBadge = `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50 flex items-center gap-1">
        ${formatDateDisplay(task.deadline)}
      </span>`;
    }
  }

  // Subtasks calculation
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const isExpanded = expandedSubtaskCards.has(task.id);

  // Next status button preview
  let nextStatusBtn = '';
  if (task.column === 'todo') {
    nextStatusBtn = `<button onclick="store.moveTaskColumn('${task.id}', 'in_progress')" title="Start Task" class="p-1 rounded bg-slate-800/80 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-300 transition-colors">
      <i class="fa-solid fa-arrow-right text-[10px]"></i>
    </button>`;
  } else if (task.column === 'in_progress') {
    nextStatusBtn = `<button onclick="store.moveTaskColumn('${task.id}', 'done')" title="Mark Done" class="p-1 rounded bg-slate-800/80 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 transition-colors">
      <i class="fa-solid fa-check text-[10px]"></i>
    </button>`;
  } else if (task.column === 'done') {
    nextStatusBtn = `<button onclick="store.moveTaskColumn('${task.id}', 'in_progress')" title="Reopen Task" class="p-1 rounded bg-slate-800/80 hover:bg-amber-600/30 text-slate-400 hover:text-amber-300 transition-colors">
      <i class="fa-solid fa-rotate-left text-[10px]"></i>
    </button>`;
  }

  return `
    <div id="card-${task.id}" 
         data-task-id="${task.id}"
         draggable="true" 
         class="task-card glass-card rounded-lg p-3.5 mb-2.5 border relative group transition-all duration-150">
      
      <!-- Top Meta Bar -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${priorityClass}">
            ${priorityLabel}
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-medium border ${catColor}">
            ${task.category}
          </span>
          ${task.aiExtracted ? `
            <span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Extracted from WhatsApp">
              WhatsApp
            </span>
          ` : ''}
        </div>

        <!-- Quick Card Menu -->
        <div class="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          ${nextStatusBtn}
          <button onclick="editTaskModal('${task.id}')" title="Edit Task" class="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <i class="fa-solid fa-pen text-[10px]"></i>
          </button>
          <button onclick="store.deleteTask('${task.id}')" title="Delete Task" class="p-1 rounded bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors">
            <i class="fa-solid fa-trash-can text-[10px]"></i>
          </button>
        </div>
      </div>

      <!-- Title & Description -->
      <h4 class="font-semibold text-sm text-slate-100 mb-1 leading-snug hover:text-indigo-300 transition-colors cursor-pointer" onclick="editTaskModal('${task.id}')">
        ${escapeHtml(task.title)}
      </h4>
      ${task.description ? `
        <p class="text-[12px] text-slate-400 mb-2 line-clamp-2 leading-relaxed font-normal">
          ${escapeHtml(task.description)}
        </p>
      ` : ''}

      <!-- Compact Subtasks Bar / Expandable List -->
      ${subtasks.length > 0 ? `
        <div class="my-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <button onclick="toggleCardSubtasks('${task.id}', event)" class="font-medium flex items-center gap-1.5 hover:text-slate-200 transition-colors">
              <i data-lucide="check-square" class="w-3.5 h-3.5 text-indigo-400"></i> 
              <span>Subtasks: ${completedSubtasks}/${subtasks.length}</span>
              <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3 text-slate-500"></i>
            </button>
            <span class="font-mono text-[10px] text-slate-400">${Math.round((completedSubtasks / subtasks.length) * 100)}%</span>
          </div>

          <!-- Detailed checklist (only shown if expanded) -->
          ${isExpanded ? `
            <div class="space-y-1.5 mt-2 pt-2 border-t border-slate-800/80">
              ${subtasks.map((st, sIdx) => `
                <label class="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer hover:text-white select-none">
                  <input type="checkbox" 
                         ${st.completed ? 'checked' : ''} 
                         onchange="store.toggleSubtask('${task.id}', ${sIdx})"
                         class="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30 w-3.5 h-3.5">
                  <span class="${st.completed ? 'line-through text-slate-500' : ''}">${escapeHtml(st.text)}</span>
                </label>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Footer Info Bar -->
      <div class="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/50 text-[11px] text-slate-400">
        <div class="flex items-center gap-2">
          ${deadlineBadge}
        </div>
        
        <div class="flex items-center gap-2">
          <span class="flex items-center gap-1 text-slate-400 font-mono text-[10px]" title="Estimated hours">
            <i data-lucide="clock" class="w-3 h-3 text-slate-500"></i> ${task.estimatedHours || 2}h
          </span>
          <div class="w-5 h-5 rounded-full bg-indigo-600/80 text-white font-bold text-[9px] flex items-center justify-center border border-indigo-400/30 shadow-sm" title="Assignee: ${task.assignee}">
            ${getInitials(task.assignee)}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Attach Drag & Drop Listeners
function initKanbanEvents() {
  const columns = document.querySelectorAll('.kanban-column');

  columns.forEach(col => {
    const colId = col.dataset.column;

    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      // Avoid flickering when dragging over child elements
      if (e.target === col || !col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId) {
        store.moveTaskColumn(taskId, colId);
      }
    });
  });

  // Filter input listeners
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.filterSearch = e.target.value.trim();
      renderKanbanBoard();
    });
  }

  const prioritySelect = document.getElementById('filter-priority');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      store.filterPriority = e.target.value;
      renderKanbanBoard();
    });
  }

  const categorySelect = document.getElementById('filter-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      store.filterCategory = e.target.value;
      renderKanbanBoard();
    });
  }
}

function attachCardListeners() {
  const cards = document.querySelectorAll('.task-card');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
}

// Helper utilities
function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name) {
  if (!name) return 'AI';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

window.renderKanbanBoard = renderKanbanBoard;
window.toggleCardSubtasks = toggleCardSubtasks;
