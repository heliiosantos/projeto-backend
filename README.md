# Projeto Backend — Geração Tech 4.0

API REST para gerenciamento de usuários, categorias e produtos, desenvolvida com Node.js, Express, Sequelize, MySQL e autenticação JWT.

## Tecnologias

- Node.js e Express
- MySQL e Sequelize ORM
- JWT (`jsonwebtoken`) e bcrypt
- dotenv
- Jest e Supertest
- Swagger UI

## Requisitos

- Node.js e npm instalados
- MySQL em execução

## Instalação

```bash
npm install
```

Crie o arquivo `.env` na raiz do projeto com as configurações do seu ambiente. Use `.env.example` como referência. Não publique o `.env` nem compartilhe senhas ou chaves JWT.

Exemplo das variáveis necessárias:

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

## Banco de dados e migrations

Crie previamente o banco configurado em `DB_NAME` e execute:

```bash
npx sequelize-cli db:migrate
```

Para desfazer a migration mais recente:

```bash
npx sequelize-cli db:migrate:undo
```

A migration de alinhamento de timestamps renomeia `createdAt` e `updatedAt` para `created_at` e `updated_at` nas tabelas `users`, `categories` e `products`, preservando os registros existentes.

## Executar a API

Desenvolvimento:

```bash
npm run dev
```

Execução normal:

```bash
npm start
```

A API estará disponível em `http://localhost:3000`. A rota raiz (`GET /`) informa o estado básico da aplicação. A documentação Swagger fica em `http://localhost:3000/api-docs`.

## Autenticação

O token é obtido em `POST /v1/user/token`, enviando e-mail e senha:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

Use o token retornado no cabeçalho das operações protegidas:

```text
Authorization: Bearer SEU_TOKEN
```

Conforme o contrato do projeto, as operações POST, PUT e DELETE exigem token. O middleware retorna HTTP 400 quando o token está ausente ou inválido.

## Endpoints

### Usuários

| Método | Endpoint | Descrição | Sucesso |
|---|---|---|---|
| POST | `/v1/user/token` | Gerar token JWT | 200 |
| GET | `/v1/user/:id` | Consultar usuário por ID | 200 |
| POST | `/v1/user` | Cadastrar usuário (`confirmPassword` obrigatório) | 201 |
| PUT | `/v1/user/:id` | Atualizar usuário | 204 |
| DELETE | `/v1/user/:id` | Excluir usuário | 204 |

O cadastro exige `firstname`, `surname`, `email`, `password` e `confirmPassword`. A senha é armazenada como hash bcrypt e não é retornada nas consultas.

### Categorias

| Método | Endpoint | Descrição | Sucesso |
|---|---|---|---|
| GET | `/v1/category/search` | Pesquisar categorias | 200 |
| GET | `/v1/category/:id` | Consultar categoria por ID | 200 |
| POST | `/v1/category` | Cadastrar categoria | 201 |
| PUT | `/v1/category/:id` | Atualizar categoria | 204 |
| DELETE | `/v1/category/:id` | Excluir categoria | 204 |

Parâmetros de `GET /v1/category/search`:

- `limit`: quantidade por página; padrão 12; `-1` retorna todos.
- `page`: página desejada; padrão 1.
- `fields`: campos retornados, separados por vírgula, por exemplo `name,slug`.
- `use_in_menu`: filtra categorias pelo valor booleano.

Exemplo:

```text
GET /v1/category/search?limit=12&page=1&fields=name,slug&use_in_menu=true
```

### Produtos

| Método | Endpoint | Descrição | Sucesso |
|---|---|---|---|
| GET | `/v1/product/search` | Pesquisar produtos | 200 |
| GET | `/v1/product/:id` | Consultar produto por ID | 200 |
| POST | `/v1/product` | Cadastrar produto | 201 |
| PUT | `/v1/product/:id` | Atualizar produto, imagens e opções | 204 |
| DELETE | `/v1/product/:id` | Excluir produto | 204 |

Parâmetros de `GET /v1/product/search`:

- `limit`: quantidade por página; padrão 12; `-1` retorna todos.
- `page`: página desejada; padrão 1.
- `fields`: campos retornados, por exemplo `name,images,price`.
- `match`: pesquisa o termo no nome ou na descrição.
- `category_ids`: IDs de categorias separados por vírgula, por exemplo `15,24`.
- `price-range`: faixa de preço, por exemplo `100-200`.
- `option[ID]`: filtra pelos valores de uma opção, por exemplo `option[45]=GG,PP`.

Exemplo:

```text
GET /v1/product/search?match=tenis&category_ids=15,24&price-range=100-200&page=1&limit=12
```

O cadastro de produto aceita `category_ids`, imagens em Base64 (`type` e `content`) e opções com `title`, `shape`, `radius`, `type` e `values`. Os valores das opções são persistidos como texto separado por vírgulas.

## Testes

Execute a suíte automatizada com:

```bash
npm test
```

Os testes usam Jest e Supertest para validar autenticação, operações CRUD, filtros, paginação, relacionamentos e tratamento de respostas.

## Códigos HTTP previstos

- `200`: consulta ou autenticação realizada com sucesso.
- `201`: recurso criado.
- `204`: atualização ou exclusão concluída sem corpo de resposta.
- `400`: dados/parâmetros inválidos ou token ausente/inválido, conforme o contrato deste projeto.
- `404`: recurso não encontrado.

## Segurança

O `.env` contém credenciais e segredos locais. Ele não deve ser enviado ao GitHub. Mantenha `.env` no `.gitignore` e publique somente `.env.example` sem valores secretos.
