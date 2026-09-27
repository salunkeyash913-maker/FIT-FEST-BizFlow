const express = require('express');
const path = require('path');
const apiHandler = require('./api/index.js');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes (/api/health, /api/info, /api/extract)
app.use(apiHandler);

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Route fallback for single-page app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app module
module.exports = app;

// Run standalone server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 BizFlow AI server running on port ${PORT}`);
  });
}
