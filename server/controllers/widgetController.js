// /server/controllers/widgetController.js
const { widgets } = require('../models/dataStore');

exports.createWidget = (req, res) => {
  const { tenantId, color, welcomeText, widgetTitle, logoUrl } = req.body;
  widgets[tenantId] = { tenantId, color, welcomeText, widgetTitle, logoUrl };
  res.redirect('/tenant-dashboard.html');
};

exports.getWidgetConfig = (req, res) => {
  const tenantId = req.params.tenantId;
  const config = widgets[tenantId];
  if (config) {
    res.json(config);
  } else {
    res.json({
      tenantId,
      color: '#000000',
      widgetTitle: 'Support Chat',
      welcomeText: 'Welcome!',
      logoUrl: '',
    });
  }
};
