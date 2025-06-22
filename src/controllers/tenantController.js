// /src/controllers/tenantController.js
const prisma = require('../db');  // New: prisma client
const { hashPassword, comparePassword } = require('../utils/passwordUtils');

exports.signupTenant = async (req, res) => {
  const { businessName, email, password } = req.body;

  try {
    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) return res.send('Email already registered.');

    const passwordHash = await hashPassword(password);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        businessName,
        email,
        passwordHash
      }
    });

    // Create default widget for this tenant
    await prisma.widget.create({
      data: {
        widgetTitle: `${businessName} Support`,
        welcomeText: `Welcome to ${businessName} support!`,
        color: '#000000',
        logoUrl: '',
        tenantId: tenant.id
      }
    });

    res.redirect('/tenant-login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating tenant');
  }
};

exports.loginTenant = async (req, res) => {
  const { email, password } = req.body;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { email } });
    if (!tenant) return res.send('Invalid credentials');

    const match = await comparePassword(password, tenant.passwordHash);
    if (!match) return res.send('Invalid credentials');

    res.cookie('tenantId', tenant.id, { sameSite: 'lax', path: '/' });
    res.redirect('/tenant-dashboard.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error logging in tenant');
  }
};

exports.getTenantInfo = async (req, res) => {
  const tenantId = req.params.tenantId;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { widgets: true, agents: true }
    });

    if (!tenant) {
      res.status(404).send('Tenant not found');
    } else {
      res.json(tenant);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching tenant info');
  }
};
