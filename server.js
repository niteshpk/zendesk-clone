// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",  // allow all origins for now
    methods: ["GET", "POST"]
  }
});

const cors = require('cors');
app.use(cors());

const tenants = { 'tenant_1': { businessName: 'Example Corp', email: 'cb@email.com', password: 'cv', tenantId: 'tenant_1' } };
const widgets = {};
const agents = {};
const chats = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Signup page
app.get('/signup', (req, res) => res.sendFile(__dirname + '/public/signup.html'));
app.post('/signup', (req, res) => {
  const { businessName, email, password } = req.body;
  const tenantId = 'tenant_' + Date.now();
  tenants[tenantId] = { businessName, email, password, tenantId };
  res.redirect('/login');
});

// Login page
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const tenantEntry = Object.values(tenants).find(t => t.email === email && t.password === password);
  if (tenantEntry) {
    res.redirect(`/dashboard.html?tenantId=${tenantEntry.tenantId}`);
  } else {
    res.send('Invalid credentials');
  }
});

// Widget creation
app.post('/create-widget', (req, res) => {
  const { tenantId, color } = req.body;
  widgets[tenantId] = { tenantId, color };
  res.redirect(`/dashboard.html?tenantId=${tenantId}`);
});

// Agent creation
app.post('/create-agent', (req, res) => {
  const { tenantId, agentName } = req.body;
  agents[tenantId] = { tenantId, agentName };
  res.redirect(`/dashboard.html?tenantId=${tenantId}`);
});

// Agent interface
app.get('/agent', (req, res) => res.sendFile(__dirname + '/public/agent.html'));

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (tenantId) => {
    socket.join(tenantId);
    console.log(`Client joined room: ${tenantId}`);
  });

  socket.on('send_message', (data) => {
    console.log('Message received: ', data);
    chats[data.tenantId] = chats[data.tenantId] || [];
    chats[data.tenantId].push(data);
    
    // Agent receives all messages globally
    io.emit('new_message', data); 
    
    // Still keep emitting to client room for client reply isolation
    io.to(data.tenantId).emit('client_message', data);
  });

  socket.on('reply_message', (data) => {
    console.log('Reply sent: ', data);
    chats[data.tenantId].push(data);
    io.to(data.tenantId).emit('agent_reply', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});



const PORT = 3000;
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));








