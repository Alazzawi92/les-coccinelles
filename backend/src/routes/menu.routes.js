// Routes menus — /api/menus
const express = require('express');
const router  = express.Router();

const { verifierToken }  = require('../middlewares/auth.middleware');
const { verifierRole }   = require('../middlewares/role.middleware');
const menuController     = require('../controllers/menuController');

router.get('/',           menuController.lister);              // Semaine courante (public)
router.get('/:semaine',   menuController.getMenuSemaine);      // Semaine précise (public)
router.post('/',          verifierToken, verifierRole('admin', 'super_admin'), menuController.creer);
router.put('/:id',        verifierToken, verifierRole('admin', 'super_admin'), menuController.modifier);
router.delete('/:id',     verifierToken, verifierRole('admin', 'super_admin'), menuController.supprimer);

module.exports = router;
