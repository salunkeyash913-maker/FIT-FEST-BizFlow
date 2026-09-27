const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  res.json({
    status: 'online',
    app: 'BizFlow AI Backend API',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node-express',
    timestamp: new Date().toISOString()
  });
});

// App Info endpoint
app.get(['/api/info', '/info'], (req, res) => {
  res.json({
    name: 'BizFlow AI',
    version: '1.0.0',
    description: 'Small Business Workflow & AI Task Automation Engine'
  });
});

// WhatsApp Extraction Backend Endpoint
app.post(['/api/extract', '/extract'], (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length < 5) {
    return res.status(400).json({ error: 'Valid text content is required' });
  }

  const tasks = [];
  const lines = text.split(/\n+/).filter(l => l.trim().length > 0);
  
  lines.forEach((line, idx) => {
    const clean = line.replace(/^\[.*?\]\s*:?/g, '').trim();
    if (clean.length < 5) return;
    
    let priority = 'medium';
    if (/urgent|asap|immediately|critical|emergency/i.test(clean)) priority = 'high';
    else if (/low|whenever|minor/i.test(clean)) priority = 'low';

    let category = 'General';
    if (/invoice|payment|tax|billing|finance|\$/i.test(clean)) category = 'Finance';
    else if (/order|stock|warehouse|inventory|logistics/i.test(clean)) category = 'Operations';
    else if (/campaign|marketing|newsletter|design/i.test(clean)) category = 'Marketing';
    else if (/support|ticket|bug|issue/i.test(clean)) category = 'Support';
    else if (/client|lead|demo|sales/i.test(clean)) category = 'Sales';

    tasks.push({
      id: `task-api-${Date.now()}-${idx}`,
      title: clean.length > 70 ? clean.substring(0, 67) + '...' : clean,
      description: `Auto-extracted by BizFlow AI Backend API. Context: "${clean}"`,
      column: 'todo',
      priority,
      category,
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      assignee: 'AI Extracted',
      estimatedHours: priority === 'high' ? 3 : 2,
      subtasks: [
        { text: 'Review extracted action item', completed: false },
        { text: 'Confirm task completion', completed: false }
      ],
      aiExtracted: true
    });
  });

  res.json({
    success: true,
    count: tasks.length,
    tasks
  });
});

// Catch-all API handler
app.all('*', (req, res) => {
  res.json({
    status: 'online',
    app: 'BizFlow AI Backend API',
    endpoint: req.url,
    availableEndpoints: ['/api/health', '/api/info', '/api/extract']
  });
});

module.exports = app;
