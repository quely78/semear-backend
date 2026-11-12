# SemeAR — Back-end

API do SemeAR em **Node.js + Express**, com **Prisma** e **PostgreSQL**.
O front-end fica em [`frontend/`](frontend/README.md).

## Como rodar

Pré-requisitos: Node.js 18+ e Docker Desktop aberto.

```bash
docker compose up -d      # sobe o PostgreSQL local (porta 5433)
npm install
npx prisma db push        # cria/atualiza as tabelas
npm run db:seed           # cadastra as comunidades iniciais
npm run dev               # API em http://localhost:3000
```

Variáveis do arquivo `.env` (na raiz):

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Endereço do PostgreSQL |
| `JWT_SECRET` | Chave usada para assinar e conferir os tokens de login |
| `PORT` | Porta da API (padrão `3000`) |

---

## Autenticação (`/auth`)

Todas as requisições e respostas usam JSON (`Content-Type: application/json`).
Erros sempre vêm no formato:

```json
{ "message": "Texto explicando o erro." }
```

### Perfis

| `tipo` | Quem é |
|---|---|
| `AGRICULTORA` | Registra os próprios plantios. Precisa estar ligada a uma comunidade. |
| `COORDENADORA` | Responsável pela comunidade (no app aparece como "responsável"). |

O **contato** é o login: um telefone ou um e-mail. Ele é único entre os dois perfis: o mesmo contato não pode existir como agricultora e como responsável.

---

### `POST /auth/cadastro`

Cria uma conta. Não precisa de login.

**Corpo da requisição**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `nome` | texto | sim | |
| `contato` | texto | sim | Telefone ou e-mail. Precisa ser único. |
| `senha` | texto | sim | É guardada só como hash (bcrypt). |
| `tipo` | texto | sim | `AGRICULTORA` ou `COORDENADORA` |
| `comunidadeId` | número | só para `AGRICULTORA` | Id de uma comunidade existente (ver `GET /comunidades`). Opcional para `COORDENADORA`. |

```json
{
  "nome": "Maria Souza",
  "contato": "92 99999-0000",
  "senha": "minhasenha",
  "tipo": "AGRICULTORA",
  "comunidadeId": 1
}
```

**Resposta de sucesso — `201 Created`**

```json
{
  "id": 7,
  "nome": "Maria Souza",
  "contato": "92 99999-0000",
  "tipo": "AGRICULTORA"
}
```

O cadastro **não** devolve token: depois de cadastrar, é preciso fazer login.

**Erros — `400 Bad Request`**

| Mensagem | Quando acontece |
|---|---|
| `nome, contato, senha e tipo são obrigatórios.` | Falta algum desses campos. |
| `tipo deve ser AGRICULTORA ou COORDENADORA.` | `tipo` com outro valor. |
| `comunidadeId é obrigatório para agricultora.` | Agricultora sem `comunidadeId`. |
| `Contato já cadastrado.` | O contato já existe em qualquer um dos dois perfis. |

> ⚠️ **Limitações atuais** (item 1 da Sprint 1, ainda em andamento):
> - O tamanho mínimo da senha (6 caracteres) e o formato do contato são conferidos só no front-end.
> - Um `comunidadeId` que não existe no banco gera um erro interno do Prisma, devolvido com status `400` e a mensagem técnica dele.
> - O contato é comparado exatamente como foi digitado: `92 99999-0000` e `92999990000` contam como contatos diferentes.

---

### `POST /auth/login`

Confere o contato e a senha e devolve um token de acesso.

**Corpo da requisição**

```json
{
  "contato": "92 99999-0000",
  "senha": "minhasenha"
}
```

**Resposta de sucesso — `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 7,
    "nome": "Maria Souza",
    "contato": "92 99999-0000",
    "tipo": "AGRICULTORA"
  }
}
```

- O token é um **JWT** que vale **1 dia**.
- Dentro dele vão `id`, `tipo` e `contato` da usuária.
- O `tipo` diz qual tela abrir no front: `AGRICULTORA` vai para os plantios e `COORDENADORA` para a área da responsável.

**Erros — `401 Unauthorized`**

| Mensagem | Quando acontece |
|---|---|
| `contato e senha são obrigatórios.` | Falta o contato ou a senha. |
| `Contato ou senha inválidos.` | O contato não existe **ou** a senha está errada. A mensagem é a mesma de propósito, para não revelar quais contatos estão cadastrados. |

---

### Rotas protegidas (usando o token)

As rotas que exigem login esperam o token no cabeçalho `Authorization`, com o prefixo `Bearer`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O middleware [`src/middleware/auth.js`](src/middleware/auth.js) confere o token e coloca os dados da usuária em `req.user` (`id`, `tipo`, `contato`).

**Erros do middleware — `401 Unauthorized`**

| Mensagem | Quando acontece |
|---|---|
| `Token de autenticação não informado.` | Sem cabeçalho `Authorization`, ou sem o prefixo `Bearer `. |
| `Token de autenticação inválido.` | Token adulterado, assinado com outra chave ou **expirado**. |

Quando recebe `401` numa rota protegida, o front apaga a sessão e volta para a tela de login.

**Rotas que usam o token hoje**

| Rota | Quem pode usar |
|---|---|
| `/plantios` e `/plantios/:id/colheita` | Só `AGRICULTORA` (outro perfil recebe `403`). |
| `/coordenadora/agricultoras`, `/coordenadora/plantios` | Só `COORDENADORA` (outro perfil recebe `403`). |
| `/dashboard/comunidade` | Qualquer perfil logado. |

### Exemplo rápido (curl)

```bash
# Cadastro
curl -X POST http://localhost:3000/auth/cadastro \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria Souza","contato":"92 99999-0000","senha":"minhasenha","tipo":"AGRICULTORA","comunidadeId":1}'

# Login (guarde o "token" da resposta)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"contato":"92 99999-0000","senha":"minhasenha"}'

# Rota protegida
curl http://localhost:3000/plantios -H "Authorization: Bearer SEU_TOKEN"
```
