// server.js
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

const cors = require("cors");
app.use(cors());
app.use(cookieParser());

const tenants = {
  tenant_1: {
    businessName: "Example Corp",
    email: "cb@email.com",
    password: "cv",
    passwordHash:"$2b$10$uwYlkyH6jasKlxJu.loZCOvSaL7SfItEKHpli8YBh.Vs7d2Yo.5.e",
    tenantId: "tenant_1",
  },
  tenant_2: {
    businessName: "CWN",
    email: "cwn@email.com",
    password: "cwn",
    passwordHash: "$2b$10$TDJlgDJo2pxuF2e2BN.55ePi.rnMz8YxelCNQm.CMiSCTLDid5C4.",
    tenantId: "tenant_2",
  },
};
const widgets = {
  tenant_1: {
    tenantId: "tenant_1",
    color: "#4CAF50",
    widgetTitle: "Example Corp Support",
    welcomeText: "Welcome to Example Corp support!",
    logoUrl: "https://picsum.photos/id/1/75/75",
  },
  tenant_2: {
    tenantId: "tenant_2",
    color: "#2196F3",
    widgetTitle: "CWN Support",
    welcomeText: "Welcome to CWN support!",
    logoUrl: "https://picsum.photos/id/1/50/50",
  },
};
const agents = {
  tenant_1: [
    {
      agentId: "agent_1",
      username: "n1",
      plainPassword: "n1",
      passwordHash:
        "$2b$10$Bp4tywHd65ZmoBr7gGyjYuEn1x2mDjEfdntFuLW0WaMLdL0qpo3A6",
    },
    {
      agentId: "agent_2",
      username: "n2",
      plainPassword: "n2",
      passwordHash:
        "$2b$10$3bVQPdL/tRf72z8c8xN7qO93Mzgnru9aZBPNPrOHCcJ57DAEsWdce",
    },
  ],
  tenant_2: [
    {
      agentId: "agent_3",
      username: "c1",
      plainPassword: "c2",
      passwordHash:
        "$2b$10$HbA1u3E/QzJBKajjFOu8Z.GthOBRZIXqnv5seim/E/XUre0Pickbe",
    },
    {
      agentId: "agent_4",
      username: "c2",
      plainPassword: "c2",
      passwordHash:
        "$2b$10$HbA1u3E/QzJBKajjFOu8Z.GthOBRZIXqnv5seim/E/XUre0Pickbe",
    },
  ],
};
const chats = {};
const onlineAgents = {}; // tenantId -> number of online agents
const offlineMessages = {}; // tenantId -> array of client messages

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Tenant Signup page
app.get("/tenant-signup", (req, res) =>
  res.sendFile(__dirname + "/public/tenant-signup.html")
);

app.post("/tenant-signup", async (req, res) => {
  const { businessName, email, password } = req.body;
  const tenantId = "tenant_" + Date.now();

  const passwordHash = await bcrypt.hash(password, 10);

  tenants[tenantId] = {
    businessName,
    email,
    plainPassword: password,   // ⚠ For prototype display only
    passwordHash,
    tenantId,
  };

  // ✅ Automatically create default widget config
  widgets[tenantId] = {
    tenantId,
    color: "#000000",
    widgetTitle: `${businessName} Support`,
    welcomeText: `Welcome to ${businessName} support!`,
    logoUrl: ""
  };

  console.log(`Tenant created: ${tenantId}`);
  console.log("Widget initialized for tenant:", widgets[tenantId]);

  res.redirect("/tenant-login");
});

// Tenant Login page
app.get("/tenant-login", (req, res) => res.sendFile(__dirname + "/public/tenant-login.html"));
app.post("/tenant-login", async (req, res) => {
  const { email, password } = req.body;
  
  const tenantEntry = Object.values(tenants).find(t => t.email === email);
  if (!tenantEntry) {
    return res.send("Invalid credentials");
  }
  console.log("Tenant login attempt:", await bcrypt.hash(password, 10));
  const match = await bcrypt.compare(password, tenantEntry.passwordHash);
  if (!match) {
    return res.send("Invalid credentials");
  }

  res.cookie("tenantId", tenantEntry.tenantId);
  res.redirect(`/tenant-dashboard.html`);
});

app.get('/widget-config/:tenantId', (req, res) => {
  const tenantId = req.params.tenantId;
  const config = widgets[tenantId];
  res.json(config);
});

// Widget creation
app.post("/create-widget", (req, res) => {
  const { tenantId, color, welcomeText, widgetTitle, logoUrl } = req.body;
  
  widgets[tenantId] = {
    tenantId,
    color,
    welcomeText,
    widgetTitle,
    logoUrl
  };
console.log("Widget created for tenant:", tenantId, widgets[tenantId]);
  res.redirect(`/tenant-dashboard.html`);
});


app.get("/chat-history/:tenantId", (req, res) => {
  const tenantId = req.params.tenantId;
  const history = chats[tenantId] || [];
  res.json(history);
});

// Agent interface
app.get("/agent", (req, res) => res.sendFile(__dirname + "/public/agent.html"));

app.post("/create-agent", async (req, res) => {
  const { tenantId, agentName, agentPassword } = req.body;

  agents[tenantId] = agents[tenantId] || [];

  const passwordHash = await bcrypt.hash(agentPassword, 10);

  agents[tenantId].push({
    agentId: "agent_" + Date.now(),
    username: agentName,
    plainPassword: agentPassword, // ⚠ prototype only
    passwordHash,
  });

  console.log(JSON.stringify(agents));

  res.redirect(`/tenant-dashboard.html`);
});

app.get("/agent-list/:tenantId", (req, res) => {
  const tenantId = req.params.tenantId;
  const agentList = agents[tenantId] || [];
  res.json(agentList);
});

app.get('/tenant-info/:tenantId', (req, res) => {
  const tenantId = req.params.tenantId;
  const tenant = tenants[tenantId];
  if (tenant) {
    res.json(tenant);
  } else {
    res.status(404).send('Tenant not found');
  }
});

app.get("/agent-login", (req, res) => {
  res.sendFile(__dirname + "/public/agent-login.html");
});

app.post("/agent-login", async (req, res) => {
  const { tenantId, username, password } = req.body;
  const tenantAgents = agents[tenantId] || [];
  const agent = tenantAgents.find((a) => a.username === username);

  if (!agent) return res.send("Invalid agent credentials");

  console.log("Agent login attempt for:", await bcrypt.hash(password, 10), agent.passwordHash);
  const match = await bcrypt.compare(password, agent.passwordHash);
  if (!match) return res.send("Invalid agent login credentials");

  // ✅ Set cookie with tenantId for this agent
  res.cookie("tenantId", tenantId);
  res.cookie("agentUsername", username);
  res.redirect(`/agent.html`);
});

app.get("/online-agents/:tenantId", (req, res) => {
  const tenantId = req.params.tenantId;
  const count = onlineAgents[tenantId] || 0;
  res.json({ onlineAgents: count });
});

// WebSocket logic
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (tenantId) => {
    socket.join(tenantId);
    socket.tenantId = tenantId;

    onlineAgents[tenantId] = (onlineAgents[tenantId] || 0) + 1;
    console.log(`Agent joined tenant: ${tenantId}`);

    // Send offline messages to agent after connecting
    if (offlineMessages[tenantId] && offlineMessages[tenantId].length > 0) {
      offlineMessages[tenantId].forEach((msg) => {
        socket.emit("new_message", msg);
      });

      // Once delivered, clear offline queue for that tenant
      offlineMessages[tenantId] = [];
    }
  });

  socket.on("send_message", (data) => {
    console.log("Message received: ", data);
    chats[data.tenantId] = chats[data.tenantId] || [];
    chats[data.tenantId].push({ ...data, type: "client_message" });

    // If no agent online, store in offline queue
    if (!onlineAgents[data.tenantId] || onlineAgents[data.tenantId] === 0) {
      offlineMessages[data.tenantId] = offlineMessages[data.tenantId] || [];
      offlineMessages[data.tenantId].push(data);
      console.log(`Stored offline message for tenant: ${data.tenantId}`);
    }

    // Send to agents normally anyway
    io.emit("new_message", data);
  });

  socket.on("reply_message", (data) => {
    const replyData = {
      tenantId: data.tenantId,
      message: data.message,
      type: "agent_reply",
      agentUsername: data.agentUsername,
    };
    chats[data.tenantId] = chats[data.tenantId] || [];
    chats[data.tenantId].push(replyData);

    io.to(data.tenantId).emit("agent_reply", replyData);
  });

  socket.on("disconnect", () => {
    if (socket.tenantId) {
      onlineAgents[socket.tenantId] = Math.max(
        0,
        (onlineAgents[socket.tenantId] || 1) - 1
      );
      console.log(
        `Agent disconnected from tenant: ${socket.tenantId}. Agents online: ${
          onlineAgents[socket.tenantId]
        }`
      );
    }
  });

  socket.on("register_agent", (data) => {
    const { tenantId, username } = data;
    socket.join(tenantId);
    socket.tenantId = tenantId;
    socket.agentUsername = username;
    console.log(`Agent ${username} joined tenant room: ${tenantId}`);
  });
});

const PORT = 3000;
http.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
