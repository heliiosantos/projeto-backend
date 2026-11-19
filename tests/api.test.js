
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
  let productImageId;
  let productOptionId;

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
      .post('/v1/user/token')
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
        .post('/v1/user/token')
        .send({
          email: authEmail,
          password: 'TesteJest@2026',
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(response.body.user).toBeUndefined();
    });

    test('deve rejeitar senha incorreta', async () => {
      const response = await request(app)
        .post('/v1/user/token')
        .send({
          email: authEmail,
          password: 'SenhaIncorreta',
        });

      expect(response.status).toBe(400);
    });

    test('deve bloquear acesso sem token', async () => {
      const response = await request(app)
        .post('/v1/category')
        .send({
          name: 'Categoria sem token',
          slug: `sem-token-${unique}`,
        });

      expect(response.status).toBe(400);
    });

    test('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .post('/v1/category')
        .set('Authorization', 'Bearer token.invalido')
        .send({
          name: 'Categoria token inválido',
          slug: `token-invalido-${unique}`,
        });

      expect(response.status).toBe(400);
    });
  });

  // USUÁRIOS
  describe('CRUD de usuários', () => {
    test('deve rejeitar cadastro quando as senhas não conferem', async () => {
      const response = await request(app)
        .post('/v1/user')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstname: 'Usuario',
          surname: 'Teste',
          email: `senhas.diferentes.${unique}@teste.com`,
          password: 'SenhaTeste@2026',
          confirmPassword: 'OutraSenha@2026',
        });

      expect(response.status).toBe(400);
    });

    test('deve cadastrar usuário', async () => {
      const response = await request(app)
        .post('/v1/user')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstname: 'Usuario',
          surname: 'Teste',
          email: createdEmail,
          password: 'SenhaTeste@2026',
          confirmPassword: 'SenhaTeste@2026',
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

      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    test('deve excluir usuário', async () => {
      const response = await request(app)
        .delete(`/v1/user/${createdUserId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);

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

    test('deve pesquisar categorias com paginação, campos e filtro de menu', async () => {
      const response = await request(app)
        .get('/v1/category/search?limit=12&page=1&fields=name,slug&use_in_menu=true');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 12);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body.data.every((item) => item.name && item.slug)).toBe(true);
      expect(response.body.data.every((item) => item.use_in_menu === undefined)).toBe(true);
    });

    test('deve retornar todas as categorias quando limit for -1', async () => {
      const response = await request(app)
        .get('/v1/category/search?limit=-1&page=99');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(-1);
      expect(response.body.page).toBe(1);
      expect(response.body.data.length).toBe(response.body.total);
    });

    test('deve rejeitar limite inválido na pesquisa de categorias', async () => {
      const response = await request(app)
        .get('/v1/category/search?limit=0');

      expect(response.status).toBe(400);
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

      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });
  });

  // PRODUTOS
  describe('CRUD e filtros de produtos conforme o enunciado', () => {
    const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/XioAAAAASUVORK5CYII=';

    test('deve cadastrar produto com imagem Base64, opção e categoria', async () => {
      const response = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: true,
          name: `Produto Jest ${unique}`,
          slug: `produto-jest-${unique}`,
          stock: 15,
          description: 'Descrição exclusiva para filtro de teste automatizado',
          price: 150,
          price_with_discount: 120,
          category_ids: [categoryId],
          images: [{ type: 'image/png', content: tinyPng }],
          options: [{ title: 'Tamanho', shape: 'square', radius: '4px', type: 'text', values: ['P', 'M', 'G'] }],
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(`Produto Jest ${unique}`);
      expect(response.body.category_ids).toContain(categoryId);
      expect(response.body.images).toHaveLength(1);
      expect(response.body.images[0].content).toMatch(/^\/uploads\/products\//);
      expect(response.body.options).toHaveLength(1);
      expect(response.body.options[0].values).toBe('P,M,G');
      expect(response.body.options[0].radius).toBe(4);
      productId = response.body.id;
      productImageId = response.body.images[0].id;
      productOptionId = response.body.options[0].id;
    });

    test('deve pesquisar produtos pelo endpoint oficial e formato de paginação', async () => {
      const response = await request(app)
        .get('/v1/product/search?match=Descrição%20exclusiva&page=1&limit=12');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('limit', 12);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body.data.some((item) => item.id === productId)).toBe(true);
    });

    test('deve filtrar por múltiplas categorias e faixa de preço', async () => {
      const response = await request(app)
        .get(`/v1/product/search?category_ids=${categoryId}&price-range=100-200`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((item) => item.id === productId)).toBe(true);
    });

    test('deve filtrar por valor de opção', async () => {
      const response = await request(app)
        .get(`/v1/product/search?option[${productOptionId}]=M`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((item) => item.id === productId)).toBe(true);
    });

    test('deve limitar os campos retornados', async () => {
      const response = await request(app)
        .get('/v1/product/search?fields=name,images,price&match=Descrição%20exclusiva');

      expect(response.status).toBe(200);
      const product = response.body.data.find((item) => item.id === productId);
      expect(product).toBeDefined();
      expect(Object.keys(product).sort()).toEqual(['id', 'images', 'name', 'price'].sort());
    });

    test('deve retornar todos os produtos quando limit for -1', async () => {
      const response = await request(app)
        .get('/v1/product/search?limit=-1&page=99');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(-1);
      expect(response.body.page).toBe(1);
      expect(response.body.data.length).toBe(response.body.total);
    });

    test('deve consultar produto por ID com category_ids, imagens e opções', async () => {
      const response = await request(app).get(`/v1/product/${productId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(productId);
      expect(response.body.category_ids).toContain(categoryId);
      expect(response.body.images[0].content).toBeTruthy();
      expect(response.body.options[0].values).toBe('P,M,G');
    });

    test('deve atualizar imagens e opções por ID sem substituir toda a coleção', async () => {
      const response = await request(app)
        .put(`/v1/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Produto atualizado pelo Jest',
          images: [{ id: productImageId, deleted: true }],
          options: [
            { id: productOptionId, radius: '10px', values: ['42/43', '44/45'] },
            { title: 'Cor', type: 'color', values: ['#000', '#333'] },
          ],
        });

      expect(response.status).toBe(204);
      expect(response.text).toBe('');
      const updated = await request(app).get(`/v1/product/${productId}`);
      expect(updated.body.description).toBe('Produto atualizado pelo Jest');
      expect(updated.body.images).toHaveLength(0);
      expect(updated.body.options).toHaveLength(2);
      expect(updated.body.options.find((item) => item.id === productOptionId).radius).toBe(10);
    });

    test('deve rejeitar parâmetros inválidos de pesquisa', async () => {
      const response = await request(app).get('/v1/product/search?price-range=200-100');
      expect(response.status).toBe(400);
    });

    test('deve excluir produto com resposta 204', async () => {
      const response = await request(app)
        .delete(`/v1/product/${productId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
      productId = null;
    });
  });
});
