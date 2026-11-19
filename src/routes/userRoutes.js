
const express = require('express');
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/user', authMiddleware, UserController.create);
router.get('/user', UserController.findAll);
router.get('/user/:id', UserController.findOne);
router.put('/user/:id', authMiddleware, UserController.update);
router.delete('/user/:id', authMiddleware, UserController.remove);

module.exports = router;
