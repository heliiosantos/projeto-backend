# Projeto Backend — API

API REST desenvolvida com Node.js, Express, Sequelize e MySQL, como projeto final do curso Geração Tech 4.0.

## 1. Tecnologias utilizadas

- Node.js
- Express
- Sequelize
- MySQL
- JWT (JSON Web Token)
- Bcrypt
- Dotenv
- Jest
- Supertest
- Swagger UI

## 2. Funcionalidades

### Usuários
- Cadastro de usuários.
- Consulta e listagem de usuários.
- Atualização de dados.
- Exclusão de usuários.
- Criptografia de senhas com Bcrypt.

### Autenticação
- Login com e-mail e senha.
- Geração de token JWT.
- Proteção de rotas privadas.
- Validação de tokens de autenticação.

### Categorias
- Cadastro de categorias.
- Listagem e consulta por ID.
- Atualização e exclusão.
- Associação entre categorias e produtos.

### Produtos
- Cadastro, consulta, atualização e exclusão.
- Associação com categorias.
- Cadastro de imagens.
- Cadastro de opções de produtos.
- Filtros por nome, faixa de preço e categoria.
- Ordenação dos resultados.
- Paginação.

## 3. Estrutura do projeto

```text
projeto-backend/
├── config/
│   └── config.js
├── migrations/
├── seeders/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   ├── docs/
│   │   └── swagger.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/
│   ├── routes/
│   └── app.js
├── tests/
│   └── api.test.js
├── .env.example
├── .gitignore
├── index.js
├── package.json
└── README.md
```

## 4. Pré-requisitos

Antes de executar o projeto, é necessário possuir:

- Node.js instalado.
- npm instalado.
- MySQL instalado e em execução.

## 5. Instalação

Clone o repositório:

```bash
git clone https://github.com/heliiosantos/projeto-backend.git
```

Entre na pasta:

```bash
cd projeto-backend
```

Instale as dependências:

```bash
npm install
```

## 6. Configuração do banco de dados

Crie o banco de dados MySQL:

```sql
CREATE DATABASE projeto_backend
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Configure as variáveis de ambiente no arquivo `.env`, utilizando o `.env.example` como referência.

Exemplo de configuração:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=projeto_backend
DB_USER=root
DB_PASSWORD=sua_senha

PORT=3000

JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=1d
```

Substitua os valores de acordo com a configuração do seu ambiente.

**Importante:** o arquivo `.env` contém informações privadas e não deve ser enviado ao GitHub.

## 7. Executando as migrations

Para criar as tabelas no banco de dados, execute:

```bash
npx sequelize-cli db:migrate
```

## 8. Executando a aplicação

Para iniciar em modo de desenvolvimento:

```bash
npm run dev
```

Para iniciar em modo de produção:

```bash
npm start
```

A API ficará disponível em:

```text
http://localhost:3000
```

## 9. Documentação Swagger

A documentação interativa dos endpoints está disponível em:

```text
http://localhost:3000/api-docs
```

Por meio do Swagger é possível visualizar os endpoints e realizar requisições à API.

As rotas protegidas utilizam autenticação Bearer Token (JWT). Para acessá-las, realize o login e informe o token recebido na opção **Authorize**.

## 10. Principais endpoints

| Método | Endpoint | Descrição | Autenticação |
|---|---|---|---|
| POST | `/v1/login` | Autenticar usuário | Não |
| GET | `/v1/user` | Listar usuários | Não |
| POST | `/v1/user` | Cadastrar usuário | Sim |
| GET | `/v1/user/:id` | Consultar usuário | Não |
| PUT | `/v1/user/:id` | Atualizar usuário | Sim |
| DELETE | `/v1/user/:id` | Excluir usuário | Sim |
| GET | `/v1/category` | Listar categorias | Não |
| POST | `/v1/category` | Cadastrar categoria | Sim |
| GET | `/v1/category/:id` | Consultar categoria | Não |
| PUT | `/v1/category/:id` | Atualizar categoria | Sim |
| DELETE | `/v1/category/:id` | Excluir categoria | Sim |
| GET | `/v1/product` | Listar produtos | Não |
| POST | `/v1/product` | Cadastrar produto | Sim |
| GET | `/v1/product/:id` | Consultar produto | Não |
| PUT | `/v1/product/:id` | Atualizar produto | Sim |
| DELETE | `/v1/product/:id` | Excluir produto | Sim |

### Filtros de produtos

O endpoint `GET /v1/product` permite utilizar os seguintes parâmetros:

| Parâmetro | Descrição |
|---|---|
| `search` | Pesquisa pelo nome do produto |
| `min_price` | Preço mínimo |
| `max_price` | Preço máximo |
| `category_id` | Identificador da categoria |
| `page` | Página desejada |
| `limit` | Quantidade de registros por página |
| `order` | Ordenação dos resultados |

Opções de ordenação:

- `price_asc`: menor preço primeiro.
- `price_desc`: maior preço primeiro.
- `name_asc`: ordem alfabética crescente.
- `name_desc`: ordem alfabética decrescente.
- `newest`: mais recentes primeiro.
- `oldest`: mais antigos primeiro.

Exemplo:

```text
GET /v1/product?search=tenis&min_price=100&max_price=300&page=1&limit=10&order=price_asc
```

## 11. Testes automatizados

O projeto utiliza Jest e Supertest para realizar testes de integração.

Para executar os testes:

```bash
npm test
```

Os testes abrangem:

- Autenticação JWT.
- Validação de credenciais.
- Proteção de rotas.
- CRUD de usuários.
- CRUD de categorias.
- CRUD de produtos.
- Relacionamentos entre entidades.
- Filtros e paginação.

## 12. Tratamento de erros

A aplicação possui middleware para tratamento de rotas inexistentes e erros internos, retornando respostas HTTP adequadas.

## 13. Autor

Projeto desenvolvido como atividade final do curso Geração Tech 4.0.