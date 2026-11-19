
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Projeto Backend - API',
    version: '1.0.0',
    description: 'Documentação da API desenvolvida com Node.js, Express, Sequelize e MySQL.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Autenticação', description: 'Login e geração de token JWT' },
    { name: 'Usuários', description: 'Gerenciamento de usuários' },
    { name: 'Categorias', description: 'Gerenciamento de categorias' },
    { name: 'Produtos', description: 'Gerenciamento de produtos' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/v1/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autenticar usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'teste@exemplo.com' },
                  password: { type: 'string', example: 'senha123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Autenticação realizada com sucesso' },
          401: { description: 'Credenciais inválidas' },
        },
      },
    },
    '/v1/user': {
      get: {
        tags: ['Usuários'],
        summary: 'Listar usuários',
        responses: {
          200: { description: 'Lista de usuários' },
        },
      },
      post: {
        tags: ['Usuários'],
        summary: 'Cadastrar usuário',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstname', 'surname', 'email', 'password'],
                properties: {
                  firstname: { type: 'string', example: 'João' },
                  surname: { type: 'string', example: 'Silva' },
                  email: { type: 'string', example: 'joao@exemplo.com' },
                  password: { type: 'string', example: 'senha123' },
                  isAdmin: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário cadastrado' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/v1/user/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      get: {
        tags: ['Usuários'],
        summary: 'Buscar usuário por ID',
        responses: {
          200: { description: 'Usuário encontrado' },
          404: { description: 'Usuário não encontrado' },
        },
      },
      put: {
        tags: ['Usuários'],
        summary: 'Atualizar usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Usuário atualizado' },
          401: { description: 'Não autorizado' },
          404: { description: 'Usuário não encontrado' },
        },
      },
      delete: {
        tags: ['Usuários'],
        summary: 'Excluir usuário',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Usuário excluído' },
          401: { description: 'Não autorizado' },
          404: { description: 'Usuário não encontrado' },
        },
      },
    },
    '/v1/category': {
      get: {
        tags: ['Categorias'],
        summary: 'Listar categorias',
        responses: {
          200: { description: 'Lista de categorias' },
        },
      },
      post: {
        tags: ['Categorias'],
        summary: 'Cadastrar categoria',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Categoria cadastrada' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/v1/category/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      get: {
        tags: ['Categorias'],
        summary: 'Buscar categoria por ID',
        responses: {
          200: { description: 'Categoria encontrada' },
          404: { description: 'Categoria não encontrada' },
        },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Atualizar categoria',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Categoria atualizada' },
          401: { description: 'Não autorizado' },
        },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Excluir categoria',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Categoria excluída' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/v1/product': {
      get: {
        tags: ['Produtos'],
        summary: 'Listar produtos com filtros e paginação',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar pelo nome' },
          { name: 'min_price', in: 'query', schema: { type: 'number' } },
          { name: 'max_price', in: 'query', schema: { type: 'number' } },
          { name: 'category_id', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          {
            name: 'order',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'oldest'],
            },
          },
        ],
        responses: {
          200: { description: 'Produtos encontrados com informações de paginação' },
          400: { description: 'Parâmetros inválidos' },
        },
      },
      post: {
        tags: ['Produtos'],
        summary: 'Cadastrar produto',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Produto cadastrado' },
          401: { description: 'Não autorizado' },
        },
      },
    },
    '/v1/product/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      get: {
        tags: ['Produtos'],
        summary: 'Buscar produto por ID',
        responses: {
          200: { description: 'Produto encontrado com categorias, imagens e opções' },
          404: { description: 'Produto não encontrado' },
        },
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualizar produto',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Produto atualizado' },
          401: { description: 'Não autorizado' },
        },
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Excluir produto',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Produto excluído' },
          401: { description: 'Não autorizado' },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
