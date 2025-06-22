// /server/routes/agentRoutes.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.post('/create-agent', agentController.createAgent);
router.get('/agent-list/:tenantId', agentController.getAgentList);
router.post('/agent-login', agentController.loginAgent);

module.exports = router;
