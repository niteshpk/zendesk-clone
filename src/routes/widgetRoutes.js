// /src/routes/widgetRoutes.js
const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widgetController');

router.post('/create-widget', widgetController.createWidget);
router.get('/widget-config/:tenantId', widgetController.getWidgetConfig);
router.get('/widget-config/:tenantId', widgetController.getWidgetConfig);
router.post('/save-widget', widgetController.saveWidget);

module.exports = router;
