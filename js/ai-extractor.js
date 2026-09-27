/**
 * BizFlow AI - AI WhatsApp Task Extractor Engine
 * Converts raw WhatsApp chats, voice notes, and unformatted emails into structured Kanban cards.
 */

// Presets for instant testing
const WHATSAPP_PRESETS = {
  invoicing: `[10:14 AM, Sarah M.]: Hey team, urgent update! Invoice #902 for Acme Corp ($4,500) is overdue. Please send a payment reminder to their controller before 4 PM today! 

Also, don't forget to reconcile September tax receipts before Friday end of day.`,

  operations: `[11:05 AM, Marcus]: Mark, warehouse stock for Model-X is running low! Order 100 new units from supplier immediately. Priority HIGH!

Once ordered, update the inventory tracking sheet and confirm delivery schedule with client desk by tomorrow noon.`,

  marketing: `[02:30 PM, Elena]: Hey guys, here are the action items from today's sync:
1. Draft the Q4 product newsletter campaign by Wednesday.
2. Review new hero image designs for landing page ASAP.
3. Schedule 30-min demo call with Apex Logistics for Thursday 2 PM.`,

  support: `[09:15 AM, Client Desk]: Emergency ticket #504 reported by Nexus Corp: API latency spikes on checkout flow!
- Investigate server logs immediately (Urgent!)
- Update status page for active incident
- Send root-cause analysis report to VP of Eng by tomorrow morning.`
};

class AIExtractor {
  constructor() {
    this.extractedResults = [];
  }

  loadPreset(key) {
    const textarea = document.getElementById('whatsapp-input');
    if (textarea && WHATSAPP_PRESETS[key]) {
      textarea.value = WHATSAPP_PRESETS[key];
      showToast(`Loaded ${key.toUpperCase()} preset template`, 'info');
    }
  }

  processRawText(rawText) {
    if (!rawText || rawText.trim().length < 5) {
      showToast('Please paste a WhatsApp message or select a preset template', 'warning');
      return [];
    }

    // Split raw text into sentences or numbered items
    const lines = rawText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedTasks = [];

    lines.forEach(line => {
      // Ignore timestamp metadata lines like [10:14 AM, Sarah]: if they have no action
      const cleanLine = line.replace(/^\[\d{1,2}:\d{2}\s*(?:AM|PM)?[^\]]*\]\s*:?/i, '').trim();
      if (!cleanLine || cleanLine.length < 6) return;

      // Check if line contains task-like sentences or split by period / bullet
      const sentences = cleanLine.split(/(?<=[.!?])\s+|\s*(?:[\d\-\*]\.|\-)\s+/).filter(s => s.trim().length > 8);

      sentences.forEach(sent => {
        const parsed = this.parseSentenceToTask(sent);
        if (parsed) {
          parsedTasks.push(parsed);
        }
      });
    });

    // Deduplicate or merge similar tasks if necessary
    this.extractedResults = parsedTasks.length > 0 ? parsedTasks : [this.parseSentenceToTask(rawText)];
    return this.extractedResults;
  }

  parseSentenceToTask(text) {
    const lower = text.toLowerCase();

    // 1. Detect Priority
    let priority = 'medium';
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('emergency') || lower.includes('high priority') || lower.includes('critical')) {
      priority = 'high';
    } else if (lower.includes('whenever') || lower.includes('low priority') || lower.includes('someday') || lower.includes('minor')) {
      priority = 'low';
    }

    // 2. Detect Category
    let category = 'General';
    if (/\b(invoice|payment|tax|receipt|reconcile|billing|finance|\$|account)\b/i.test(text)) {
      category = 'Finance';
    } else if (/\b(order|stock|warehouse|inventory|ship|dispatch|supplier|supplier|logistics)\b/i.test(text)) {
      category = 'Operations';
    } else if (/\b(campaign|newsletter|marketing|landing|design|social|q4|promo)\b/i.test(text)) {
      category = 'Marketing';
    } else if (/\b(ticket|bug|latency|support|incident|logs|checkout|issue)\b/i.test(text)) {
      category = 'Support';
    } else if (/\b(demo|lead|client|call|calendly|sales|nexus|acme)\b/i.test(text)) {
      category = 'Sales';
    }

    // 3. Detect Deadline
    let deadline = getRelativeDateStr(1); // default tomorrow
    if (lower.includes('today') || lower.includes('by 4 pm') || lower.includes('end of day')) {
      deadline = getRelativeDateStr(0);
    } else if (lower.includes('tomorrow')) {
      deadline = getRelativeDateStr(1);
    } else if (lower.includes('wednesday')) {
      deadline = getRelativeDateOffset('wednesday');
    } else if (lower.includes('thursday')) {
      deadline = getRelativeDateOffset('thursday');
    } else if (lower.includes('friday')) {
      deadline = getRelativeDateOffset('friday');
    } else if (lower.includes('next week')) {
      deadline = getRelativeDateStr(5);
    }

    // 4. Clean Title & Generate Description
    let title = text.replace(/^[^a-zA-Z0-9]+/, '')
                    .replace(/\[.*?\]/g, '')
                    .replace(/urgent!?|asap!?|immediately!?|priority high!?/gi, '')
                    .trim();

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (title.length > 70) {
      title = title.substring(0, 67) + '...';
    }

    // 5. Generate AI Smart Subtasks
    const subtasks = [];
    if (category === 'Finance') {
      subtasks.push({ text: 'Verify document / invoice numbers', completed: false });
      subtasks.push({ text: 'Send confirmation email', completed: false });
    } else if (category === 'Operations') {
      subtasks.push({ text: 'Check inventory stock log', completed: false });
      subtasks.push({ text: 'Confirm delivery timestamp', completed: false });
    } else if (category === 'Support') {
      subtasks.push({ text: 'Isolate error logs & metric trace', completed: false });
      subtasks.push({ text: 'Update incident status ticket', completed: false });
    } else {
      subtasks.push({ text: 'Review initial draft with team', completed: false });
      subtasks.push({ text: 'Confirm task completion status', completed: false });
    }

    return {
      selected: true,
      title: title,
      description: `Auto-extracted from WhatsApp chat transcript. Original context: "${text.substring(0, 120)}..."`,
      column: 'todo',
      priority: priority,
      category: category,
      deadline: deadline,
      assignee: 'AI Extracted',
      estimatedHours: priority === 'high' ? 3 : 2,
      subtasks: subtasks
    };
  }
}

// Calculate upcoming weekday date
function getRelativeDateOffset(targetDayName) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(targetDayName.toLowerCase());
  
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;

  const targetDate = new Date();
  targetDate.setDate(today.getDate() + diff);
  return targetDate.toISOString().split('T')[0];
}

window.aiExtractor = new AIExtractor();

// Handler to trigger AI extraction in UI
function handleExtractTasks() {
  const rawText = document.getElementById('whatsapp-input').value;
  const statusContainer = document.getElementById('ai-processing-status');
  const resultsContainer = document.getElementById('ai-results-container');
  const resultsList = document.getElementById('ai-results-list');

  if (!rawText.trim()) {
    showToast('Please paste a WhatsApp message or select a preset template first', 'warning');
    return;
  }

  // Show processing animation
  statusContainer.classList.remove('hidden');
  resultsContainer.classList.add('hidden');

  // Simulate AI parsing delay for realistic effect
  setTimeout(() => {
    const tasks = aiExtractor.processRawText(rawText);
    statusContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    renderExtractedResults(tasks);
    if (window.lucide) lucide.createIcons();
  }, 900);
}

function renderExtractedResults(tasks) {
  const resultsList = document.getElementById('ai-results-list');
  const countBadge = document.getElementById('ai-extracted-count');

  if (countBadge) countBadge.textContent = `${tasks.length} Tasks Detected`;

  if (tasks.length === 0) {
    resultsList.innerHTML = `<p class="text-sm text-slate-400 p-4 text-center">No actionable tasks detected. Try adjusting text.</p>`;
    return;
  }

  resultsList.innerHTML = tasks.map((t, idx) => `
    <div class="p-3.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:border-indigo-500/40 transition-all flex items-start gap-3">
      <input type="checkbox" 
             id="ai-chk-${idx}" 
             ${t.selected ? 'checked' : ''} 
             onchange="aiExtractor.extractedResults[${idx}].selected = this.checked"
             class="mt-1 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30 w-4 h-4 cursor-pointer">
      
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.priority === 'high' ? 'badge-priority-high' : t.priority === 'low' ? 'badge-priority-low' : 'badge-priority-medium'}">
            ${t.priority}
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            ${t.category}
          </span>
          <span class="text-[11px] font-mono text-indigo-300 ml-auto flex items-center gap-1">
            <i data-lucide="calendar" class="w-3 h-3"></i> ${t.deadline}
          </span>
        </div>
        
        <h5 class="text-sm font-semibold text-white mb-1 leading-snug">${escapeHtml(t.title)}</h5>
        <p class="text-xs text-slate-400 line-clamp-2">${escapeHtml(t.description)}</p>

        <div class="mt-2 text-[11px] text-slate-400 flex items-center gap-3">
          <span class="flex items-center gap-1 text-slate-400">
            <i data-lucide="list-checks" class="w-3 h-3 text-emerald-400"></i> ${t.subtasks.length} Subtasks Generated
          </span>
          <span class="flex items-center gap-1 text-slate-400">
            <i data-lucide="clock" class="w-3 h-3 text-amber-400"></i> Est: ${t.estimatedHours}h
          </span>
        </div>
      </div>
    </div>
  `).join('');
}

function importSelectedAITasks() {
  const selected = aiExtractor.extractedResults.filter(t => t.selected);
  if (selected.length === 0) {
    showToast('Please select at least one task to import', 'warning');
    return;
  }

  store.addBatchTasks(selected);
  showToast(`Imported ${selected.length} tasks to To Do column`, 'success');

  // Close AI modal/drawer
  closeAIModal();
}

function openAIModal() {
  const modal = document.getElementById('ai-extractor-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }
}

function closeAIModal() {
  const modal = document.getElementById('ai-extractor-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
  }
}

window.handleExtractTasks = handleExtractTasks;
window.importSelectedAITasks = importSelectedAITasks;
window.openAIModal = openAIModal;
window.closeAIModal = closeAIModal;
