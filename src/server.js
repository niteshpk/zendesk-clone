const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const cors = require("cors");
const path = require("path");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Route imports
const tenantRoutes = require("./routes/tenantRoutes");
const agentRoutes = require("./routes/agentRoutes");
const widgetRoutes = require("./routes/widgetRoutes");
const chatRoutes = require("./routes/chatRoutes");
const chatController = require("./controllers/chatController");

const { tenantAuthGuard, agentAuthGuard } = require("./middleware/authGuard");

// Middlewares
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add JSON parser also
app.use(express.static("public"));

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.set("layout", "layout");

// Global middleware to inject into all EJS views
app.use((req, res, next) => {
  res.locals.tenantId = req.cookies.tenantId || null;
  res.locals.agentUsername = req.cookies.agentUsername || null;
  res.locals.path = req.path;
  res.locals.layout = "layout";
  next();
});

// API Routes
app.use(tenantRoutes);
app.use(agentRoutes);
app.use(widgetRoutes);
app.use(chatRoutes);

// Serve frontend pages

app.get("/tenant-signup", (req, res) => {
  res.render("tenant-signup", { title: "Tenant Signup" });
});

app.get("/tenant-login", (req, res) => {
  res.render("tenant-login", { title: "Tenant Login" });
});

// 🔥 Main fix here — load tenant + widget data before rendering dashboard
app.get("/tenant-dashboard.html", tenantAuthGuard, async (req, res) => {
  const tenantId = req.cookies.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  const widget = await prisma.widget.findFirst({
    where: { tenantId },
  });

  res.render("tenant-dashboard", {
    title: "Tenant Dashboard",
    tenant,
    widget,
    tenantId,
    path: req.path,
  });
});

// Agent side pages
app.get("/agent-login", (req, res) => {
  res.render("agent-login", { title: "Agent Login" });
});

app.get("/agent.html", agentAuthGuard, (req, res) => {
  res.render("agent", {
    title: "Agent Chat",
    tenantId: req.cookies.tenantId,
    agentUsername: req.cookies.agentUsername,
  });
});

// Default index
app.get("/", (req, res) => {
  res.render("index", { title: "SaaS Chat" });
});

// Initialize WebSocket chat
chatController.initWebSocket(io);

// Start server
const PORT = 3000;
http.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
