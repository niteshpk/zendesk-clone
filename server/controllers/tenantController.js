// /server/controllers/tenantController.js
const bcrypt = require('bcryptjs');
const { tenants, widgets } = require('../models/dataStore');

exports.signupTenant = async (req, res) => {
  const { businessName, email, password } = req.body;
  const tenantId = 'tenant_' + Date.now();
  const passwordHash = await bcrypt.hash(password, 10);

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
  const match = await bcrypt.compare(password, tenantEntry.passwordHash);
  if (!match) return res.send('Invalid credentials');
  res.cookie('tenantId', tenantEntry.tenantId);
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
