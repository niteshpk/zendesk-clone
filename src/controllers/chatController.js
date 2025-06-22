// /src/controllers/chatController.js
const prisma = require('../db');  // Prisma client instance
const { onlineAgents, offlineMessages } = require('../models/dataStore');

// Get chat history for tenant
exports.getChatHistory = async (req, res) => {
  const tenantId = req.params.tenantId;

  const history = await prisma.message.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  res.json(history);
};

// Get online agents count (in-memory tracking only)
exports.getOnlineAgents = (req, res) => {
  const tenantId = req.params.tenantId;
  res.json({ onlineAgents: onlineAgents[tenantId] || 0 });
};

// WebSocket integration
exports.initWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log("A user connected");

    socket.on('join', async (tenantId) => {
      socket.join(tenantId);
      socket.tenantId = tenantId;
      onlineAgents[tenantId] = (onlineAgents[tenantId] || 0) + 1;

      // Deliver offline messages if any
      if (offlineMessages[tenantId]?.length > 0) {
        offlineMessages[tenantId].forEach(msg => {
          socket.emit('new_message', msg);
        });
        offlineMessages[tenantId] = [];
      }
    });

    // Handle client message
    socket.on('send_message', async (data) => {
      try {
        const messageData = await prisma.message.create({
          data: {
            tenantId: data.tenantId,
            sender: 'client',
            agentUsername: null,
            content: data.content
          }
        });

        // Store offline if no agents online
        if (!onlineAgents[data.tenantId]) {
          offlineMessages[data.tenantId] = offlineMessages[data.tenantId] || [];
          offlineMessages[data.tenantId].push(messageData);
        }

        io.to(data.tenantId).emit('new_message', messageData);
      } catch (err) {
        console.error('Error saving client message:', err);
      }
    });

    // Handle agent reply
    socket.on('reply_message', async (data) => {
      try {
        const replyData = await prisma.message.create({
          data: {
            tenantId: data.tenantId,
            sender: 'agent',
            agentUsername: data.agentUsername,
            content: data.content
          }
        });

        io.to(data.tenantId).emit('agent_reply', replyData);
      } catch (err) {
        console.error('Error saving agent reply:', err);
      }
    });

    // On disconnect
    socket.on('disconnect', () => {
      if (socket.tenantId) {
        onlineAgents[socket.tenantId] = Math.max(0, (onlineAgents[socket.tenantId] || 1) - 1);
      }
    });
  });
};
