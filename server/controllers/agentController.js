// /server/controllers/agentController.js
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { agents } = require('../models/dataStore');

exports.createAgent = async (req, res) => {
  const { tenantId, agentName, agentPassword } = req.body;
  agents[tenantId] = agents[tenantId] || [];
  const passwordHash = await hashPassword(agentPassword);
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
  const match = await comparePassword(password, agent.passwordHash);
  if (!match) return res.send('Invalid agent credentials');
  res.cookie('tenantId', tenantId, { sameSite: 'lax', path: '/' });
  res.cookie('agentUsername', username, { sameSite: 'lax', path: '/' });
  res.redirect('/agent.html');
};
