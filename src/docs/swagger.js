const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Projeto Backend - API',
    version: '1.0.0',
    description: 'API do projeto Geração Tech 4.0, desenvolvida com Node.js, Express, Sequelize e MySQL.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
  tags: [
    { name: 'Autenticação' },
    { name: 'Usuários' },
    { name: 'Categorias' },
    { name: 'Produtos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      UserCreate: {
        type: 'object', required: ['firstname', 'surname', 'email', 'password', 'confirmPassword'],
        properties: {
          firstname: { type: 'string', example: 'João' },
          surname: { type: 'string', example: 'Silva' },
          email: { type: 'string', format: 'email', example: 'joao@exemplo.com' },
          password: { type: 'string', example: 'senha123' },
          confirmPassword: { type: 'string', example: 'senha123' },
        },
      },
      Category: {
        type: 'object', required: ['name', 'slug'],
        properties: {
          name: { type: 'string', example: 'Calçados' },
          slug: { type: 'string', example: 'calcados' },
          use_in_menu: { type: 'boolean', default: false },
        },
      },
      Product: {
        type: 'object', required: ['name', 'slug', 'price', 'price_with_discount'],
        properties: {
          enabled: { type: 'boolean', default: false },
          name: { type: 'string', example: 'Tênis' },
          slug: { type: 'string', example: 'tenis' },
          use_in_menu: { type: 'boolean', default: false },
          stock: { type: 'integer', default: 0 },
          description: { type: 'string' },
          price: { type: 'number', format: 'float' },
          price_with_discount: { type: 'number', format: 'float' },
          category_ids: { type: 'array', items: { type: 'integer' } },
          images: { type: 'array', items: { type: 'object', properties: { type: { type: 'string', example: 'image/png' }, content: { type: 'string', description: 'Conteúdo Base64 da imagem' } } } },
          options: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, shape: { type: 'string', enum: ['square', 'circle'] }, radius: { type: 'string', example: '4px' }, type: { type: 'string', enum: ['text', 'color'] }, values: { type: 'array', items: { type: 'string' } } } } },
        },
      },
    },
  },
  paths: {
    '/v1/user/token': {
      post: {
        tags: ['Autenticação'], summary: 'Gerar token JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Token gerado' }, 400: { description: 'Credenciais ou dados inválidos' } },
      },
    },
    '/v1/user': {
      get: { tags: ['Usuários'], summary: 'Listar usuários', responses: { 200: { description: 'Lista de usuários' } } },
      post: {
        tags: ['Usuários'], summary: 'Cadastrar usuário', security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } } },
        responses: { 201: { description: 'Usuário cadastrado' }, 400: { description: 'Dados inválidos' }, 400: { description: 'Token ausente ou inválido' } },
      },
    },
    '/v1/user/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: { tags: ['Usuários'], summary: 'Consultar usuário por ID', responses: { 200: { description: 'Usuário encontrado' }, 404: { description: 'Usuário não encontrado' } } },
      put: { tags: ['Usuários'], summary: 'Atualizar usuário', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Atualizado sem corpo de resposta' }, 400: { description: 'Dados inválidos ou token ausente/inválido' }, 404: { description: 'Usuário não encontrado' } } },
      delete: { tags: ['Usuários'], summary: 'Excluir usuário', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Excluído sem corpo de resposta' }, 400: { description: 'Token ausente ou inválido' }, 404: { description: 'Usuário não encontrado' } } },
    },
    '/v1/category/search': {
      get: { tags: ['Categorias'], summary: 'Pesquisar categorias', parameters: [
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 }, description: 'Use -1 para retornar todos' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'fields', in: 'query', schema: { type: 'string', example: 'name,slug' } },
        { name: 'use_in_menu', in: 'query', schema: { type: 'boolean' } },
      ], responses: { 200: { description: 'Resultado no formato data, total, limit e page' }, 400: { description: 'Parâmetros inválidos' } } },
    },
    '/v1/category': {
      get: { tags: ['Categorias'], summary: 'Listar categorias (rota complementar)', responses: { 200: { description: 'Lista de categorias' } } },
      post: { tags: ['Categorias'], summary: 'Cadastrar categoria', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Category' } } } }, responses: { 201: { description: 'Categoria cadastrada' }, 400: { description: 'Dados inválidos' } } },
    },
    '/v1/category/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: { tags: ['Categorias'], summary: 'Consultar categoria por ID', responses: { 200: { description: 'Categoria encontrada' }, 404: { description: 'Categoria não encontrada' } } },
      put: { tags: ['Categorias'], summary: 'Atualizar categoria', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Atualizada sem corpo de resposta' }, 400: { description: 'Dados inválidos ou token ausente/inválido' }, 404: { description: 'Categoria não encontrada' } } },
      delete: { tags: ['Categorias'], summary: 'Excluir categoria', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Excluída sem corpo de resposta' }, 400: { description: 'Token ausente ou inválido' }, 404: { description: 'Categoria não encontrada' } } },
    },
    '/v1/product/search': {
      get: { tags: ['Produtos'], summary: 'Pesquisar produtos', parameters: [
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 }, description: 'Use -1 para retornar todos' },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'fields', in: 'query', schema: { type: 'string', example: 'name,images,price' } },
        { name: 'match', in: 'query', schema: { type: 'string' }, description: 'Busca no nome ou descrição' },
        { name: 'category_ids', in: 'query', schema: { type: 'string', example: '15,24' } },
        { name: 'price-range', in: 'query', schema: { type: 'string', example: '100-200' } },
        { name: 'option[45]', in: 'query', schema: { type: 'string', example: 'GG,PP' } },
      ], responses: { 200: { description: 'Resultado paginado com categorias, imagens e opções' }, 400: { description: 'Parâmetros inválidos' } } },
    },
    '/v1/product': {
      post: { tags: ['Produtos'], summary: 'Cadastrar produto', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, responses: { 201: { description: 'Produto cadastrado' }, 400: { description: 'Dados inválidos' } } },
    },
    '/v1/product/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      get: { tags: ['Produtos'], summary: 'Consultar produto por ID', responses: { 200: { description: 'Produto com categorias, imagens e opções' }, 404: { description: 'Produto não encontrado' } } },
      put: { tags: ['Produtos'], summary: 'Atualizar produto, imagens e opções', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Atualizado sem corpo de resposta' }, 400: { description: 'Dados inválidos ou token ausente/inválido' }, 404: { description: 'Produto não encontrado' } } },
      delete: { tags: ['Produtos'], summary: 'Excluir produto', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Excluído sem corpo de resposta' }, 400: { description: 'Token ausente ou inválido' }, 404: { description: 'Produto não encontrado' } } },
    },
  },
};

module.exports = swaggerDocument;
