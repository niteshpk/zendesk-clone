// tenantRoutes.js
const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');

router.post('/tenant-signup', tenantController.signupTenant);
router.post('/tenant-login', tenantController.loginTenant);
router.get('/tenant-info/:tenantId', tenantController.getTenantInfo);

module.exports = router;
