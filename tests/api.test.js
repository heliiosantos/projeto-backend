
const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../src/app');
const sequelize = require('../src/config/database');

const {
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
} = require('../src/models');

describe('Testes de integração da API', () => {
  let token;
  let testUser;
  let createdUserId;
  let categoryId;
  let productId;

  const unique = Date.now();

  const authEmail = `jest.auth.${unique}@teste.com`;
  const createdEmail = `jest.user.${unique}@teste.com`;

  beforeAll(async () => {
    await sequelize.authenticate();

    const passwordHash = await bcrypt.hash('TesteJest@2026', 10);

    testUser = await User.create({
      firstname: 'Usuario',
      surname: 'Jest',
      email: authEmail,
      password: passwordHash,
    });

    const login = await request(app)
      .post('/v1/login')
      .send({
        email: authEmail,
        password: 'TesteJest@2026',
      });

    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();

    token = login.body.token;
  });

  afterAll(async () => {
    try {
      if (productId) {
        await ProductImage.destroy({
          where: { product_id: productId },
        });

        await ProductOption.destroy({
          where: { product_id: productId },
        });

        await ProductCategory.destroy({
          where: { product_id: productId },
        });

        await Product.destroy({
          where: { id: productId },
        });
      }

      if (categoryId) {
        await ProductCategory.destroy({
          where: { category_id: categoryId },
        });

        await Category.destroy({
          where: { id: categoryId },
        });
      }

      await User.destroy({
        where: {
          email: [authEmail, createdEmail],
        },
      });
    } finally {
      await sequelize.close();
    }
  });

  // AUTENTICAÇÃO
  describe('Autenticação JWT', () => {
    test('deve realizar login com credenciais corretas', async () => {
      const response = await request(app)
        .post('/v1/login')
        .send({
          email: authEmail,
          password: 'TesteJest@2026',
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user.email).toBe(authEmail);
    });

    test('deve rejeitar senha incorreta', async () => {
      const response = await request(app)
        .post('/v1/login')
        .send({
          email: authEmail,
          password: 'SenhaIncorreta',
        });

      expect(response.status).toBe(401);
    });

    test('deve bloquear acesso sem token', async () => {
      const response = await request(app)
        .post('/v1/category')
        .send({
          name: 'Categoria sem token',
          slug: `sem-token-${unique}`,
        });

      expect(response.status).toBe(401);
    });

    test('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .post('/v1/category')
        .set('Authorization', 'Bearer token.invalido')
        .send({
          name: 'Categoria token inválido',
          slug: `token-invalido-${unique}`,
        });

      expect(response.status).toBe(401);
    });
  });

  // USUÁRIOS
  describe('CRUD de usuários', () => {
    test('deve cadastrar usuário', async () => {
      const response = await request(app)
        .post('/v1/user')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstname: 'Usuario',
          surname: 'Teste',
          email: createdEmail,
          password: 'SenhaTeste@2026',
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe(createdEmail);
      expect(response.body.password).toBeUndefined();

      createdUserId = response.body.id;
    });

    test('deve listar usuários', async () => {
      const response = await request(app)
        .get('/v1/user');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('não deve retornar senha na consulta do usuário', async () => {
      const response = await request(app)
        .get(`/v1/user/${createdUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.password).toBeUndefined();
    });

    test('deve atualizar usuário', async () => {
      const response = await request(app)
        .put(`/v1/user/${createdUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstname: 'Usuario Atualizado',
        });

      expect(response.status).toBe(200);
      expect(response.body.firstname).toBe('Usuario Atualizado');
    });

    test('deve excluir usuário', async () => {
      const response = await request(app)
        .delete(`/v1/user/${createdUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      createdUserId = null;
    });
  });

  // CATEGORIAS
  describe('CRUD de categorias', () => {
    test('deve cadastrar categoria', async () => {
      const response = await request(app)
        .post('/v1/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Categoria Jest ${unique}`,
          slug: `categoria-jest-${unique}`,
          use_in_menu: true,
        });

      expect(response.status).toBe(201);

      categoryId = response.body.id;
    });

    test('deve listar categorias', async () => {
      const response = await request(app)
        .get('/v1/category');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('deve consultar categoria por ID', async () => {
      const response = await request(app)
        .get(`/v1/category/${categoryId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(categoryId);
    });

    test('deve atualizar categoria', async () => {
      const response = await request(app)
        .put(`/v1/category/${categoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Categoria Atualizada ${unique}`,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(`Categoria Atualizada ${unique}`);
    });
  });

  // PRODUTOS
  describe('CRUD e filtros de produtos', () => {
    test('deve cadastrar produto com imagem, opção e categoria', async () => {
      const response = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Produto Jest ${unique}`,
          slug: `produto-jest-${unique}`,
          description: 'Produto criado pelo teste automatizado',
          price: 150,
          price_with_discount: 120,
          categoryIds: [categoryId],
          images: [
            'https://exemplo.com/imagem-teste.jpg',
          ],
          options: [
            {
              title: 'Tamanho',
              values: ['P', 'M', 'G'],
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(`Produto Jest ${unique}`);
      expect(response.body.categories.length).toBeGreaterThan(0);
      expect(response.body.images.length).toBe(1);
      expect(response.body.options.length).toBe(1);

      productId = response.body.id;
    });

    test('deve listar produtos com paginação', async () => {
      const response = await request(app)
        .get('/v1/product?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.currentPage).toBe(1);
    });

    test('deve consultar produto por ID', async () => {
      const response = await request(app)
        .get(`/v1/product/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
    });

    test('deve filtrar produto por nome', async () => {
      const response = await request(app)
        .get(`/v1/product?search=Produto%20Jest%20${unique}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(productId);
    });

    test('deve filtrar produto por faixa de preço', async () => {
      const response = await request(app)
        .get('/v1/product?min_price=100&max_price=200');

      expect(response.status).toBe(200);

      const found = response.body.data.some(
        (product) => product.id === productId
      );

      expect(found).toBe(true);
    });

    test('deve filtrar produto por categoria', async () => {
      const response = await request(app)
        .get(`/v1/product?category_id=${categoryId}`);

      expect(response.status).toBe(200);

      const found = response.body.data.some(
        (product) => product.id === productId
      );

      expect(found).toBe(true);
    });

    test('deve rejeitar página inválida', async () => {
      const response = await request(app)
        .get('/v1/product?page=0');

      expect(response.status).toBe(400);
    });

    test('deve rejeitar ordenação inválida', async () => {
      const response = await request(app)
        .get('/v1/product?order=invalido');

      expect(response.status).toBe(400);
    });

    test('deve atualizar produto', async () => {
      const response = await request(app)
        .put(`/v1/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Produto atualizado pelo Jest',
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(
        'Produto atualizado pelo Jest'
      );
    });
  });
});
