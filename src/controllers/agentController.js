const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const prisma = require('../db');  // Prisma client

exports.getAgentList = async (req, res) => {
  const tenantId = req.params.tenantId;

  const agents = await prisma.agent.findMany({
    where: { tenantId }
  });

  res.json(agents);
};

exports.saveAgent = async (req, res) => {
  const { tenantId, agentId, agentName, agentPassword } = req.body;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
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
        tenantId: tenantId
      }
    });
  }

  res.status(200).json({ success: true });
};

exports.deleteAgent = async (req, res) => {
  const { agentId } = req.params;

  try {
    await prisma.agent.delete({
      where: { id: agentId }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting agent:', err);
    res.status(500).send('Error deleting agent');
  }
};

exports.loginAgent = async (req, res) => {
  const { tenantId, username, password } = req.body;

  const agent = await prisma.agent.findFirst({
    where: { tenantId, username }
  });

  if (!agent) return res.send('Invalid credentials');

  const match = await comparePassword(password, agent.passwordHash);
  if (!match) return res.send('Invalid credentials');

  res.cookie('tenantId', tenantId, { sameSite: 'lax', path: '/' });
  res.cookie('agentUsername', username, { sameSite: 'lax', path: '/' });
  res.redirect('/agent.html');
};
