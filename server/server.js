const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const path = require('path');

// Route imports
const tenantRoutes = require('./routes/tenantRoutes');
const agentRoutes = require('./routes/agentRoutes');
const widgetRoutes = require('./routes/widgetRoutes');
const chatRoutes = require('./routes/chatRoutes');
const chatController = require('./controllers/chatController');

const { tenantAuthGuard, agentAuthGuard } = require('./middleware/authGuard');

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('layout', 'layout');

// API Routes
app.use(tenantRoutes);
app.use(agentRoutes);
app.use(widgetRoutes);
app.use(chatRoutes);

// Serve frontend HTML pages (Static routes)

app.get("/tenant-signup", (req, res) => {
  res.render('tenant-signup', { title: 'Tenant Signup', layout: 'layout' });
});

app.get("/tenant-login", (req, res) => {
  res.render('tenant-login', { title: 'Tenant Login', layout: 'layout' });
});

app.get("/tenant-dashboard.html", tenantAuthGuard, (req, res) => {
  res.render('tenant-dashboard', { title: 'Tenant Dashboard', layout: 'layout' });
});

app.get("/agent-login", (req, res) => {
  res.render('agent-login', { title: 'Agent Login', layout: 'layout' });
});

app.get("/agent.html", agentAuthGuard, (req, res) => {
  res.render('agent', { title: 'Agent Chat', layout: 'layout' });
});

// Initialize WebSocket chat handling
chatController.initWebSocket(io);

// Start server
const PORT = 3000;
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

