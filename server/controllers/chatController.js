// /server/controllers/chatController.js
const { chats, offlineMessages, onlineAgents } = require('../models/dataStore');

exports.getChatHistory = (req, res) => {
  const tenantId = req.params.tenantId;
  res.json(chats[tenantId] || []);
};

exports.getOnlineAgents = (req, res) => {
  const tenantId = req.params.tenantId;
  res.json({ onlineAgents: onlineAgents[tenantId] || 0 });
};

exports.initWebSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (tenantId) => {
      socket.join(tenantId);
      socket.tenantId = tenantId;
      onlineAgents[tenantId] = (onlineAgents[tenantId] || 0) + 1;

      if (offlineMessages[tenantId] && offlineMessages[tenantId].length > 0) {
        offlineMessages[tenantId].forEach(msg => {
          socket.emit('new_message', msg);
        });
        offlineMessages[tenantId] = [];
      }
    });

    socket.on('send_message', (data) => {
      chats[data.tenantId] = chats[data.tenantId] || [];
      chats[data.tenantId].push({ ...data, type: 'client_message' });

      if (!onlineAgents[data.tenantId]) {
        offlineMessages[data.tenantId] = offlineMessages[data.tenantId] || [];
        offlineMessages[data.tenantId].push(data);
      }

      io.emit('new_message', data);
    });

    socket.on('reply_message', (data) => {
      const replyData = {
        tenantId: data.tenantId,
        message: data.message,
        type: 'agent_reply',
        agentUsername: data.agentUsername,
      };
      chats[data.tenantId] = chats[data.tenantId] || [];
      chats[data.tenantId].push(replyData);
      io.to(data.tenantId).emit('agent_reply', replyData);
    });

    socket.on('disconnect', () => {
      if (socket.tenantId) {
        onlineAgents[socket.tenantId] = Math.max(0, (onlineAgents[socket.tenantId] || 1) - 1);
      }
    });
  });
};
