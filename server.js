// server.js
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());

const tenants = { 'tenant_1': { businessName: 'Example Corp', email: 'cb@email.com', password: 'cv', tenantId: 'tenant_1' } };
const widgets = {};
const agents = {
  tenant_1: [
    {
      agentId: "agent_1750514985846",
      username: "n1",
      plainPassword: "n1",
      passwordHash:
        "$2b$10$Bp4tywHd65ZmoBr7gGyjYuEn1x2mDjEfdntFuLW0WaMLdL0qpo3A6",
    },
    {
      agentId: "agent_1750514996509",
      username: "n2",
      plainPassword: "n2",
      passwordHash:
        "$2b$10$3bVQPdL/tRf72z8c8xN7qO93Mzgnru9aZBPNPrOHCcJ57DAEsWdce",
    },
  ],
};
const chats = {};
const onlineAgents = {};  // tenantId -> number of online agents
const offlineMessages = {}; // tenantId -> array of client messages

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

app.get('/chat-history/:tenantId', (req, res) => {
  const tenantId = req.params.tenantId;
  const history = chats[tenantId] || [];
  res.json(history);
});

// Agent interface
app.get('/agent', (req, res) => res.sendFile(__dirname + '/public/agent.html'));

app.post('/create-agent', async (req, res) => {
  const { tenantId, agentName, agentPassword } = req.body;

  agents[tenantId] = agents[tenantId] || [];

  const passwordHash = await bcrypt.hash(agentPassword, 10);

  agents[tenantId].push({
    agentId: 'agent_' + Date.now(),
    username: agentName,
    plainPassword: agentPassword,  // ⚠ prototype only
    passwordHash
  });

  console.log(JSON.stringify(agents));

  res.redirect(`/dashboard.html?tenantId=${tenantId}`);
});

app.get('/agent-list/:tenantId', (req, res) => {
  const tenantId = req.params.tenantId;
  const agentList = agents[tenantId] || [];
  res.json(agentList);
});

app.get('/agent-login', (req, res) => {
  res.sendFile(__dirname + '/public/agent-login.html');
});

app.post('/agent-login', async (req, res) => {
  const { tenantId, username, password } = req.body;
  const tenantAgents = agents[tenantId] || [];
  const agent = tenantAgents.find(a => a.username === username);

  if (!agent) return res.send('Invalid agent credentials');

  const match = await bcrypt.compare(password, agent.passwordHash);
  if (!match) return res.send('Invalid login credentials');

  // ✅ Set cookie with tenantId for this agent
  res.cookie('tenantId', tenantId);
  res.cookie('agentUsername', username);
  res.redirect(`/agent.html`);
});

app.get('/online-agents/:tenantId', (req, res) => {
  const tenantId = req.params.tenantId;
  const count = onlineAgents[tenantId] || 0;
  res.json({ onlineAgents: count });
});

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (tenantId) => {
    socket.join(tenantId);
    socket.tenantId = tenantId;

    onlineAgents[tenantId] = (onlineAgents[tenantId] || 0) + 1;
    console.log(`Agent joined tenant: ${tenantId}`);

    // Send offline messages to agent after connecting
    if (offlineMessages[tenantId] && offlineMessages[tenantId].length > 0) {
      offlineMessages[tenantId].forEach(msg => {
        socket.emit('new_message', msg);
      });

      // Once delivered, clear offline queue for that tenant
      offlineMessages[tenantId] = [];
    }
  });

  socket.on('send_message', (data) => {
    console.log('Message received: ', data);
    chats[data.tenantId] = chats[data.tenantId] || [];
    chats[data.tenantId].push({ ...data, type: 'client_message' });

    // If no agent online, store in offline queue
    if (!onlineAgents[data.tenantId] || onlineAgents[data.tenantId] === 0) {
      offlineMessages[data.tenantId] = offlineMessages[data.tenantId] || [];
      offlineMessages[data.tenantId].push(data);
      console.log(`Stored offline message for tenant: ${data.tenantId}`);
    }

    // Send to agents normally anyway
    io.emit('new_message', data);
  });

  socket.on('reply_message', (data) => {
    const replyData = {
      tenantId: data.tenantId,
      message: data.message,
      type: 'agent_reply',
      agentUsername: data.agentUsername
    };
    chats[data.tenantId] = chats[data.tenantId] || [];
    chats[data.tenantId].push(replyData);

    io.to(data.tenantId).emit('agent_reply', replyData);
  });

  socket.on('disconnect', () => {
    if (socket.tenantId) {
      onlineAgents[socket.tenantId] = Math.max(0, (onlineAgents[socket.tenantId] || 1) - 1);
      console.log(`Agent disconnected from tenant: ${socket.tenantId}. Agents online: ${onlineAgents[socket.tenantId]}`);
    }
  });

  socket.on('register_agent', (data) => {
    const { tenantId, username } = data;
    socket.join(tenantId);
    socket.tenantId = tenantId;
    socket.agentUsername = username;
    console.log(`Agent ${username} joined tenant room: ${tenantId}`);
  });
});



const PORT = 3000;
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));








