const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// API Health & Info endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'BizFlow AI',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone-node',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'BizFlow AI',
    version: '1.0.0',
    description: 'Small Business Workflow & AI Task Automation Platform'
  });
});

// Route fallback for single-page app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel Serverless Function deployment
module.exports = app;

// Run standalone HTTP server if executed directly (node server.js / local / Docker)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 BizFlow AI server running on port ${PORT}`);
  });
}
