// /src/middleware/authGuard.js

function tenantAuthGuard(req, res, next) {
  const tenantId = req.cookies.tenantId;
  if (!tenantId) {
    return res.redirect('/tenant-login');
  }
  // Attach tenantId to request object for convenience
  req.tenantId = tenantId;
  next();
}

function agentAuthGuard(req, res, next) {
  const tenantId = req.cookies.tenantId;
  const agentUsername = req.cookies.agentUsername;
  if (!tenantId || !agentUsername) {
    return res.redirect('/agent-login');
  }
  req.tenantId = tenantId;
  req.agentUsername = agentUsername;
  next();
}

module.exports = {
  tenantAuthGuard,
  agentAuthGuard
};
