// /src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.get('/chat-history/:tenantId', chatController.getChatHistory);
router.get('/online-agents/:tenantId', chatController.getOnlineAgents);

module.exports = router;
