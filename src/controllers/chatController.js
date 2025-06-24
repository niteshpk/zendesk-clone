// /src/controllers/chatController.js
const prisma = require('../db');

exports.getChatHistory = async (req, res) => {
  const tenantId = req.params.tenantId;
  const history = await prisma.message.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });
  res.json(history);
};

exports.getOnlineAgents = async (req, res) => {
  const tenantId = req.params.tenantId;
  const onlineAgentsCount = await prisma.onlineAgent.count({
    where: { tenantId }
  });
  res.json({ onlineAgents: onlineAgentsCount });
};

exports.initWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log("A user connected");

    // Agent joins
    socket.on('agent_join', async ({ tenantId, agentUsername }) => {
      socket.join(tenantId);
      socket.tenantId = tenantId;
      socket.agentUsername = agentUsername;

      await prisma.onlineAgent.create({
        data: {
          tenantId,
          agentUsername
        }
      });

      // Notify all clients widgets about new online agent count
      const count = await prisma.onlineAgent.count({ where: { tenantId } });
      io.to(tenantId).emit('online_agents_count', { onlineAgents: count });

      // Deliver any offline messages to agent
      const offlineMsgs = await prisma.offlineMessage.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' }
      });
      offlineMsgs.forEach(msg => {
        socket.emit('new_message', { tenantId, content: msg.content });
      });

      // Clear delivered offline messages
      await prisma.offlineMessage.deleteMany({ where: { tenantId } });
    });

    // Client sends message
    socket.on('send_message', async (data) => {
      const message = await prisma.message.create({
        data: {
          tenantId: data.tenantId,
          sender: 'client',
          agentUsername: null,
          content: data.content
        }
      });

      const onlineAgents = await prisma.onlineAgent.count({
        where: { tenantId: data.tenantId }
      });

      if (onlineAgents === 0) {
        await prisma.offlineMessage.create({
          data: {
            tenantId: data.tenantId,
            content: data.content
          }
        });
      }

      io.to(data.tenantId).emit('new_message', message);
    });

    // Agent replies
    socket.on('reply_message', async (data) => {
      const reply = await prisma.message.create({
        data: {
          tenantId: data.tenantId,
          sender: 'agent',
          agentUsername: data.agentUsername,
          content: data.content
        }
      });
      io.to(data.tenantId).emit('agent_reply', reply);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      if (socket.tenantId && socket.agentUsername) {
        await prisma.onlineAgent.deleteMany({
          where: {
            tenantId: socket.tenantId,
            agentUsername: socket.agentUsername
          }
        });

        const count = await prisma.onlineAgent.count({
          where: { tenantId: socket.tenantId }
        });
        io.to(socket.tenantId).emit('online_agents_count', { onlineAgents: count });
      }
    });
  });
};
