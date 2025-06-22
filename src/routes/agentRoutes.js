// /src/routes/agentRoutes.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

router.get('/agent-list/:tenantId', agentController.getAgentList);
router.post('/save-agent', agentController.saveAgent);
router.delete('/delete-agent/:tenantId/:agentId', agentController.deleteAgent);
router.post('/agent-login', agentController.loginAgent);

module.exports = router;
