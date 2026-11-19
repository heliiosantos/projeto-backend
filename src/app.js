
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./docs/swagger');

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas da API
app.use('/v1', authRoutes);
app.use('/v1', userRoutes);
app.use('/v1', categoryRoutes);
app.use('/v1', productRoutes);

// Rota inicial
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API Projeto Backend funcionando!',
  });
});

// Tratamento de rotas inexistentes e erros
app.use(notFound);
app.use(errorHandler);

module.exports = app;
