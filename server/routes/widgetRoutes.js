// /server/routes/widgetRoutes.js
const express = require('express');
const router = express.Router();
const widgetController = require('../controllers/widgetController');

router.post('/create-widget', widgetController.createWidget);
router.get('/widget-config/:tenantId', widgetController.getWidgetConfig);

module.exports = router;
