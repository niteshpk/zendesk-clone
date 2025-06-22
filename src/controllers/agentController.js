// /src/controllers/agentController.js
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { agents } = require('../models/dataStore');
const prisma = require('../db');  // Prisma client

exports.getAgentList = async (req, res) => {
  const tenantId = req.params.tenantId;

  const agents = await prisma.agent.findMany({
    where: {
      tenantId: tenantId  // correct usage
    }
  });

  res.json(agents);
};

exports.saveAgent = async (req, res) => {
  const { tenantId, agentId, agentName, agentPassword } = req.body;

  const tenant = await prisma.tenant.findUnique({
  where: { id: tenantId }
});


  if (!tenant) return res.status(404).send('Tenant not found');

  const passwordHash = await hashPassword(agentPassword);

  if (agentId) {
    // Update agent
    await prisma.agent.update({
      where: { id: agentId },
      data: { username: agentName, passwordHash }
    });
  } else {
    // Create new agent
    await prisma.agent.create({
      data: {
        username: agentName,
        passwordHash,
        tenant: { connect: { id: tenant.id } }
      }
    });
  }

  res.status(200).json({ success: true });
};


exports.deleteAgent = (req, res) => {
  const { tenantId, agentId } = req.params;
  agents[tenantId] = agents[tenantId].filter(a => a.agentId !== agentId);
  res.json({ success: true });
};

exports.loginAgent = async (req, res) => {
  const { tenantId, username, password } = req.body;

  // find agent from Prisma
  const agent = await prisma.agent.findFirst({
    where: {
      tenantId,
      username
    }
  });

  if (!agent) {
    return res.send('Invalid agent credentials');
  }

  const match = await comparePassword(password, agent.passwordHash);
  if (!match) {
    return res.send('Invalid agent credentials');
  }

  // ✅ Login successful: set cookies
  res.cookie('tenantId', tenantId, { sameSite: 'lax', path: '/' });
  res.cookie('agentUsername', username, { sameSite: 'lax', path: '/' });
  res.redirect('/agent.html');
};
