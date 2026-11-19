const express = require('express');
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/product', authMiddleware, ProductController.create);
router.get('/product/search', ProductController.findAll);
// Mantém a rota antiga como compatibilidade; o contrato oficial é /search.
router.get('/product', ProductController.findAll);
router.get('/product/:id', ProductController.findOne);
router.put('/product/:id', authMiddleware, ProductController.update);
router.delete('/product/:id', authMiddleware, ProductController.remove);

module.exports = router;
