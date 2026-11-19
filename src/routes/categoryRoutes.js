
const express = require('express');
const CategoryController = require('../controllers/CategoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/category', authMiddleware, CategoryController.create);
router.get('/category', CategoryController.findAll);
router.get('/category/:id', CategoryController.findOne);
router.put('/category/:id', authMiddleware, CategoryController.update);
router.delete('/category/:id', authMiddleware, CategoryController.remove);

module.exports = router;
