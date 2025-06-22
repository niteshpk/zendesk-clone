const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

// Route imports
const tenantRoutes = require('./routes/tenantRoutes');
const agentRoutes = require('./routes/agentRoutes');
const widgetRoutes = require('./routes/widgetRoutes');
const chatRoutes = require('./routes/chatRoutes');
const chatController = require('./controllers/chatController');
// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes
app.use(tenantRoutes);
app.use(agentRoutes);
app.use(widgetRoutes);
app.use(chatRoutes);

// Serve frontend HTML pages (Static routes)

app.get("/tenant-signup", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'tenant-signup.html'));
});

app.get("/tenant-login", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'tenant-login.html'));
});

app.get("/tenant-dashboard.html", (req, res) => {
  const tenantId = req.cookies.tenantId;
  if (!tenantId) return res.redirect('/tenant-login');
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'tenant-dashboard.html'));
});

app.get("/agent-login", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'agent-login.html'));
});

app.get("/agent.html", (req, res) => {
  const tenantId = req.cookies.tenantId;
  if (!tenantId) return res.redirect('/agent-login');
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'agent.html'));
});

// Initialize WebSocket chat handling
chatController.initWebSocket(io);

// Start server
const PORT = 3000;
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

