// /server/controllers/agentController.js
const bcrypt = require('bcryptjs');
const { agents } = require('../models/dataStore');

exports.createAgent = async (req, res) => {
  const { tenantId, agentName, agentPassword } = req.body;
  agents[tenantId] = agents[tenantId] || [];
  const passwordHash = await bcrypt.hash(agentPassword, 10);
  agents[tenantId].push({
    agentId: 'agent_' + Date.now(),
    username: agentName,
    plainPassword: agentPassword,
    passwordHash,
  });
  res.redirect('/tenant-dashboard.html');
};

exports.getAgentList = (req, res) => {
  const tenantId = req.params.tenantId;
  res.json(agents[tenantId] || []);
};

exports.loginAgent = async (req, res) => {
  const { tenantId, username, password } = req.body;
  const tenantAgents = agents[tenantId] || [];
  const agent = tenantAgents.find(a => a.username === username);
  if (!agent) return res.send('Invalid agent credentials');
  const match = await bcrypt.compare(password, agent.passwordHash);
  if (!match) return res.send('Invalid agent credentials');
  res.cookie('tenantId', tenantId);
  res.cookie('agentUsername', username);
  res.redirect('/agent.html');
};
