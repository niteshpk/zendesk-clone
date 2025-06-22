// /server/controllers/tenantController.js
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { tenants, widgets } = require('../models/dataStore');

exports.signupTenant = async (req, res) => {
  const { businessName, email, password } = req.body;
  const tenantId = 'tenant_' + Date.now();
  const passwordHash = await hashPassword(password);

  tenants[tenantId] = {
    businessName,
    email,
    plainPassword: password,
    passwordHash,
    tenantId,
  };

  widgets[tenantId] = {
    tenantId,
    color: '#000000',
    widgetTitle: `${businessName} Support`,
    welcomeText: `Welcome to ${businessName} support!`,
    logoUrl: '',
  };

  res.redirect('/tenant-login');
};

exports.loginTenant = async (req, res) => {
  const { email, password } = req.body;
  const tenantEntry = Object.values(tenants).find(t => t.email === email);
  if (!tenantEntry) return res.send('Invalid credentials');
  const match = await comparePassword(password, tenantEntry.passwordHash);
  if (!match) return res.send('Invalid credentials');
  res.cookie('tenantId', tenantId, { sameSite: 'lax', path: '/' });
  res.redirect('/tenant-dashboard.html');
};

exports.getTenantInfo = (req, res) => {
  const tenantId = req.params.tenantId;
  const tenant = tenants[tenantId];
  if (tenant) {
    res.json(tenant);
  } else {
    res.status(404).send('Tenant not found');
  }
};
