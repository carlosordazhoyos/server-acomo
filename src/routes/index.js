const express = require('express');
const { validateUsers, validateUserByDni, consultaDni, fixReporByDni } = require('../controllers');
const router = express.Router();

router.get('/validate', validateUsers);
router.get('/validate/dni', validateUserByDni);
router.get('/validate/name', consultaDni);
router.get('/validate/fix', fixReporByDni);


module.exports = router;