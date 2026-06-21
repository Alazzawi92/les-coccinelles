// Routes CMS — /api/cms
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const cmsController      = require('../controllers/cmsController');

router.get('/pages',         verifierToken, verifierRole('admin', 'super_admin'), cmsController.listerPages); // Admin
router.get('/pages/:slug',   cmsController.getPage);                                                          // Public
router.put('/pages/:slug',   verifierToken, verifierRole('admin', 'super_admin'), cmsController.modifierPage);// Admin

module.exports = router;
