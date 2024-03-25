const express = require('express');
const path = require('path');
const fs = require('fs'); // File System module to check if file exists
const app = express();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.VITE_BASE_URL || '/';

// Serve files from the public directory (with precedence)
app.use(BASE_URL, express.static(path.join(__dirname, 'public'), {fallthrough: true}));

// Serve files from the pre-built dist directory only if not found in public
app.use(BASE_URL, express.static(path.join(__dirname, 'dist')));

// Handle fallback for SPA (Single Page Application) and return 404 for missing files
app.use((req, res, next) => {
  // Try to find the file in the 'public' directory first
  const publicFilePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(publicFilePath)) {
    // If the file exists in the public folder, serve it
    return res.sendFile(publicFilePath);
  }

  // If not found in 'public', check the 'dist' directory
  const distFilePath = path.join(__dirname, 'dist', req.path);
  if (fs.existsSync(distFilePath)) {
    // If the file exists in the dist folder, serve it
    return res.sendFile(distFilePath);
  }

  // For SPA: If it's a navigation request (no file extension), serve index.html from 'dist'
  if (!path.extname(req.path)) {
    return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } 

  // If it's a file request but the file doesn't exist in both directories, return 404
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${BASE_URL}`);
});
