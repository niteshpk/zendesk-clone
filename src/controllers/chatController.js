// /src/controllers/chatController.js
const prisma = require('../db');

// ✅ Get all chat history for a given conversation
exports.getChatHistory = async (req, res) => {
  const { tenantId, conversationId } = req.params;

  const history = await prisma.message.findMany({
    where: { tenantId, conversationId },
    orderBy: { createdAt: 'asc' }
  });

  res.json(history);
};

// ✅ Get list of open conversations for tenant (for future agent dashboard)
exports.getOpenConversations = async (req, res) => {
  const { tenantId } = req.params;

  const conversations = await prisma.conversation.findMany({
    where: { tenantId, closedAt: null },
    include: { messages: true }
  });

  res.json(conversations);
};

// ✅ Get online agents count (unchanged)
exports.getOnlineAgents = async (req, res) => {
  const tenantId = req.params.tenantId;
  const onlineAgentsCount = await prisma.onlineAgent.count({
    where: { tenantId }
  });
  res.json({ onlineAgents: onlineAgentsCount });
};

// ✅ Main WebSocket logic
exports.initWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log("A user connected");

    // Agent joins
    socket.on('agent_join', async ({ tenantId, agentUsername }) => {
      socket.join(tenantId);
      socket.tenantId = tenantId;
      socket.agentUsername = agentUsername;

      await prisma.onlineAgent.create({
        data: { tenantId, agentUsername }
      });

      const count = await prisma.onlineAgent.count({ where: { tenantId } });
      io.to(tenantId).emit('online_agents_count', { onlineAgents: count });

      const offlineMsgs = await prisma.offlineMessage.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' }
      });

      offlineMsgs.forEach(msg => {
        socket.emit('new_message', {
          tenantId,
          conversationId: msg.conversationId,
          content: msg.content
        });
      });

      await prisma.offlineMessage.deleteMany({ where: { tenantId } });
    });

    // Client sends message
    socket.on('send_message', async (data) => {
      const { tenantId, content } = data;
      let conversationId = data.conversationId;

      if (!conversationId) {
        // Create new conversation if not present
        const conversation = await prisma.conversation.create({
          data: { tenantId }
        });
        conversationId = conversation.id;
      }

      const message = await prisma.message.create({
        data: {
          tenantId,
          conversationId,
          sender: 'client',
          agentUsername: null,
          content
        }
      });

      const onlineAgents = await prisma.onlineAgent.count({ where: { tenantId } });

      if (onlineAgents === 0) {
        await prisma.offlineMessage.create({
          data: {
            tenantId,
            conversationId,
            content
          }
        });
      }

      io.to(tenantId).emit('new_message', { tenantId, conversationId, message });
    });

    // Agent replies
    socket.on('reply_message', async (data) => {
      const { tenantId, conversationId, agentUsername, content } = data;

      const reply = await prisma.message.create({
        data: {
          tenantId,
          conversationId,
          sender: 'agent',
          agentUsername,
          content
        }
      });

      io.to(tenantId).emit('agent_reply', { tenantId, conversationId, message: reply });
    });

    // Disconnect logic
    socket.on('disconnect', async () => {
      if (socket.tenantId && socket.agentUsername) {
        await prisma.onlineAgent.deleteMany({
          where: { tenantId: socket.tenantId, agentUsername: socket.agentUsername }
        });

        const count = await prisma.onlineAgent.count({ where: { tenantId: socket.tenantId } });
        io.to(socket.tenantId).emit('online_agents_count', { onlineAgents: count });
      }
    });
  });
};
