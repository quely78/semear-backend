# SemeAR — Back-end

API do SemeAR em **Node.js + Express**, com **Prisma** e **PostgreSQL**.
O front-end fica em [`frontend/`](frontend/README.md).

## Como rodar

Pré-requisitos: Node.js 20+ e Docker Desktop aberto.

```bash
docker compose up -d        # sobe o PostgreSQL local (porta 5433)
npm install
npx prisma migrate deploy   # cria/atualiza as tabelas pelas migrations
npm run db:seed             # cadastra as comunidades iniciais
npm run dev                 # API em http://localhost:3000
```

### Mudanças no banco (migrations)

As tabelas são criadas pelas migrations da pasta `prisma/migrations/`, que **vão para o GitHub**. São elas que o Render usa para montar o banco de produção.

- **Para mudar o banco:** edite o `prisma/schema.prisma` e rode `npx prisma migrate dev --name descricao-curta`. Isso cria uma migration nova; faça o commit dela junto com o schema.
- **Não use mais `npx prisma db push`.** Ele altera o banco sem criar migration, e a mudança não chega ao Render.

> **Se o seu banco local foi criado com `db push`** (antes de as migrations irem para o GitHub), o `migrate deploy` vai reclamar que as tabelas já existem. Marque as migrations como já aplicadas, uma vez só:
> ```bash
> npx prisma migrate resolve --applied 20261029191831_init
> npx prisma migrate resolve --applied 20261112120000_responsaveis_colheita_e_senhas
> ```
> Ou apague o banco local e recrie do zero (perde os dados de teste): `docker compose down -v`, `docker compose up -d` e `npx prisma migrate deploy`.

Variáveis do arquivo `.env` (na raiz). Para começar, copie o modelo: `cp .env.example .env` (no Windows: `copy .env.example .env`).

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Endereço do PostgreSQL |
| `JWT_SECRET` | Chave usada para assinar e conferir os tokens de login |
| `PORT` | Porta da API (padrão `3000`) |
| `FRONT_URL` | Endereço do front, usado no link do e-mail de "esqueci minha senha" (padrão `http://localhost:5173`) |
| `CORS_ORIGIN` | Quem pode chamar a API pelo navegador. Vazio = qualquer origem (desenvolvimento). Em produção, o endereço do front; vários separados por vírgula. |
| `BREVO_API_KEY` | Chave de API do Brevo. **Quando preenchida, os e-mails saem pelo Brevo** (por HTTPS). É o jeito de usar em produção no Render. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Servidor SMTP (ex.: Gmail). Usado só quando não há `BREVO_API_KEY`. |
| `EMAIL_REMETENTE` | Quem aparece como remetente, ex.: `SemeAR <conta@gmail.com>`. No Brevo, precisa ser um e-mail confirmado. Se ficar vazio, usa `SemeAR <SMTP_USER>`. |

Sem `BREVO_API_KEY` nem `SMTP_HOST`, nenhum e-mail é enviado: o conteúdo aparece no terminal da API (serve para testar).

### Envio de e-mail pelo Brevo (recomendado; funciona no Render)

1. Crie uma conta gratuita em <https://www.brevo.com>.
2. Confirme o remetente: **Senders, Domains & Dedicated IPs → Senders → Add a sender**, com o e-mail que vai aparecer como remetente. O Brevo manda um código para esse e-mail.
3. Gere a chave: **SMTP & API → API Keys → Generate a new API key**. Copie (ela começa com `xkeysib-`).
4. No `.env`:
   ```
   BREVO_API_KEY=xkeysib-...
   EMAIL_REMETENTE="SemeAR <o-email-confirmado@gmail.com>"
   ```
5. Teste com `npm run email:teste` e reinicie a API.

O plano gratuito do Brevo envia cerca de 300 e-mails por dia. E-mails enviados em nome de um endereço `@gmail.com` podem cair no spam; isso melhora com um domínio próprio verificado no Brevo.

### Envio de e-mail pelo Gmail (SMTP)

1. Na conta Google que vai enviar os e-mails, ative a **verificação em duas etapas** (Conta Google → Segurança).
2. Crie uma **senha de app** em <https://myaccount.google.com/apppasswords> (nome sugerido: `SemeAR`). O Google mostra uma senha de 16 letras.
3. No `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=conta-do-semear@gmail.com
   SMTP_PASS=a senha de app, sem espaços
   ```
4. Teste com `npm run email:teste`, que manda um e-mail para o próprio `SMTP_USER`. Para mandar para outro endereço: `npm run email:teste -- outro@email.com`.
5. Reinicie a API (`npm run dev`).

A senha de app só fica no `.env`, que não vai para o GitHub. Se ela vazar, apague-a na mesma página e crie outra. O Gmail gratuito envia até cerca de 500 e-mails por dia, o que basta para recuperação de senha.

---

## Publicar no Render

O arquivo [`render.yaml`](render.yaml) descreve tudo o que o Render precisa criar, no plano gratuito:

| Nome no Render | O que é |
|---|---|
| `semear-db` | Banco PostgreSQL |
| `semear-api` | A API. Ao ligar, aplica as migrations, garante as comunidades iniciais e sobe o servidor. O Render confere `GET /health`. |
| `semear-front` | O site do front-end (arquivos estáticos do React) |

### Passo a passo (uma vez só)

1. Crie uma conta em <https://render.com> entrando **com o GitHub** e autorize o acesso ao repositório `semear-backend`.
2. No painel: **New → Blueprint**, escolha o repositório e a branch `main`. O Render lê o `render.yaml` e mostra os três itens.
3. Ele pede os valores marcados como "preencher no painel". Use os endereços que o Render vai dar (normalmente o nome do serviço + `.onrender.com`):

   | Variável | Onde | Valor |
   |---|---|---|
   | `FRONT_URL` | semear-api | `https://semear-front.onrender.com` |
   | `CORS_ORIGIN` | semear-api | `https://semear-front.onrender.com` |
   | `VITE_API_URL` | semear-front | `https://semear-api.onrender.com` |
   | `BREVO_API_KEY` | semear-api | a chave de API do Brevo |
   | `EMAIL_REMETENTE` | semear-api | `SemeAR <o-email-confirmado-no-brevo@gmail.com>` |

4. Clique em **Apply** e espere os três ficarem verdes (a primeira vez demora alguns minutos).
5. Confira se o endereço de cada serviço é mesmo o da tabela (se o nome já existir no Render, ele acrescenta letras, ex.: `semear-api-x1y2.onrender.com`). Se for diferente, corrija as três variáveis de endereço em **Environment** e faça um novo deploy. O front precisa de um deploy novo sempre que o `VITE_API_URL` mudar.
6. Teste:
   - `https://semear-api.onrender.com/health` → `{"status":"ok","banco":"ok"}`
   - `https://semear-front.onrender.com` → tela de login. Cadastre uma conta e entre.

Depois disso, cada merge na `main` publica sozinho a versão nova.

### Limites do plano gratuito

- **A API "dorme"** depois de uns 15 minutos sem uso. O primeiro acesso depois disso demora cerca de 1 minuto para responder; os seguintes são normais.
- **O banco gratuito tem prazo e tamanho limitados.** Confira as regras atuais no painel do Render. Quando o banco vence, os dados são perdidos se não houver upgrade.
- **E-mail:** o plano gratuito do Render pode bloquear SMTP (portas 465/587), por isso o `render.yaml` usa o **Brevo**, que envia por HTTPS. Não configure SMTP no Render.

---

## API: visão geral

Endereços: `http://localhost:3000` no computador e `https://semear-api-37um.onrender.com` publicado.

| Método | Rota | Login | Quem pode | Para quê |
|---|---|---|---|---|
| GET | `/health` | não | todos | A API e o banco estão no ar? |
| GET | `/comunidades` | não | todos | Lista as comunidades (tela de cadastro) |
| POST | `/auth/cadastro` | não | todos | Criar conta |
| POST | `/auth/login` | não | todos | Entrar e receber o token |
| POST | `/auth/esqueci-senha` | não | todos | Pedir o link de senha nova por e-mail |
| POST | `/auth/redefinir-senha/validar` | não | todos | Conferir se o link do e-mail ainda vale |
| POST | `/auth/redefinir-senha` | não | todos | Criar a senha nova pelo link do e-mail |
| POST | `/auth/trocar-senha` | sim | qualquer perfil | Trocar a própria senha |
| GET, PUT | `/perfil` | sim | qualquer perfil | Ver e editar nome e contato |
| GET, POST | `/plantios` | sim | agricultora | Listar e registrar os próprios plantios |
| PUT, DELETE | `/plantios/:id` | sim | agricultora | Editar e excluir um plantio dela |
| PUT, DELETE | `/plantios/:id/colheita` | sim | agricultora | Registrar e desfazer a colheita |
| GET | `/coordenadora/agricultoras` | sim | responsável | Agricultoras da comunidade dela |
| GET | `/coordenadora/plantios` | sim | responsável | Plantios da comunidade (estoque) |
| POST | `/coordenadora/agricultoras/:id/redefinir-senha` | sim | responsável | Gerar senha provisória para uma agricultora |
| GET | `/dashboard/comunidade` | sim | qualquer perfil | Números da comunidade da usuária |
| GET | `/calendario/:especie` | não | todos | Época de plantio e colheita de uma espécie |

Todas as requisições e respostas usam JSON (`Content-Type: application/json`). Erros sempre vêm no formato:

```json
{
  "message": "Texto explicando o erro.",
  "campos": { "senha": "A senha precisa ter pelo menos 6 caracteres." }
}
```

- `message` sempre vem e pode ser mostrada para a usuária.
- `campos` só vem em erros de validação: diz o problema de **cada** campo, para o front mostrar embaixo dele. Quando há mais de um campo errado, a `message` é genérica e os detalhes ficam em `campos`.
- Erros inesperados (banco fora do ar, bug) voltam com status `500` e uma mensagem genérica. O detalhe técnico fica só no log do servidor.
- Um corpo que não é JSON válido volta com `400` e a mensagem `O corpo da requisição não é um JSON válido.`
- Corpo maior que 20 KB: `413` com `O corpo da requisição é grande demais.`
- Rota que não existe: `404` com `Rota não encontrada.`
- Perfil errado (ex.: responsável numa rota de plantio): `403`.
- Algo que não existe **ou é de outra pessoa** (ex.: plantio de outra agricultora): `404`. A resposta é a mesma de propósito, para não revelar o que existe.

### Segurança

- **Cabeçalhos de segurança** com o [helmet](https://helmetjs.github.io/): o navegador não "adivinha" o tipo dos arquivos, a API não abre dentro de iframes de outros sites e o servidor não anuncia que é Express.
- **CORS:** em produção, só o endereço do front (`CORS_ORIGIN`) pode chamar a API pelo navegador.
- **Validação de entradas:** todo corpo, filtro e id da URL é conferido antes de chegar ao banco, com as mesmas regras do front. Valores fora do esperado voltam como `400` com `campos`, nunca como erro interno.
- **Dados de cada pessoa:** o id da usuária vem sempre do token, nunca da requisição. Uma agricultora só vê e altera os próprios plantios; a responsável só vê a própria comunidade.
- **Limite de tentativas** (resposta `429`, com o cabeçalho `RateLimit` dizendo quando tentar de novo):

| Rota | Limite | Mensagem |
|---|---|---|
| `POST /auth/login` | 5 senhas **erradas** seguidas para a mesma conta, no mesmo aparelho, em 15 min (logins certos não contam) | `Muitas tentativas de entrar com senha errada. Espere 15 minutos e tente de novo.` |
| `POST /auth/login` | 30 tentativas erradas do mesmo aparelho em 15 min, somando todas as contas | `Muitas tentativas de login a partir desta conexão. Espere 15 minutos e tente de novo.` |
| `POST /auth/cadastro` | 10 por hora, por aparelho | `Muitos cadastros a partir desta conexão. Tente de novo mais tarde.` |
| `/auth/esqueci-senha` e `/auth/redefinir-senha*` | 10 em 15 min, por aparelho | `Muitos pedidos de recuperação de senha. Espere 15 minutos e tente de novo.` |

Os limites ficam na memória da API e zeram quando ela reinicia. No Render, a API confia no IP enviado pelo proxy dele (`trust proxy`), para cada usuária ser contada separadamente. Para testes automatizados, `LIMITES_DESLIGADOS=1` desliga todos.

---

## Autenticação (`/auth`)

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

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | texto | sim | Até 100 caracteres. Espaços nas pontas são removidos. |
| `contato` | texto | sim | Telefone (8 a 13 dígitos; aceita espaços, parênteses, `+`, `.` e `-`) ou e-mail. Até 120 caracteres. Espaços nas pontas são removidos. Precisa ser único. |
| `senha` | texto | sim | De 6 a 72 caracteres. É guardada só como hash (bcrypt). |
| `tipo` | texto | sim | `AGRICULTORA` ou `COORDENADORA` |
| `comunidadeId` | número inteiro | só para `AGRICULTORA` | Id de uma comunidade que existe (ver `GET /comunidades`). Opcional para `COORDENADORA`. |

As mesmas regras são conferidas no front ([`frontend/src/utils/validacoes.js`](frontend/src/utils/validacoes.js)) e na API ([`src/validators/authValidator.js`](src/validators/authValidator.js)). Se mudar uma, mude a outra.

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

Todos os problemas encontrados voltam juntos em `campos`. Mensagens de cada campo:

| Campo | Mensagem | Quando acontece |
|---|---|---|
| `nome` | `Informe o nome.` | Vazio ou só espaços. |
| `nome` | `O nome pode ter no máximo 100 caracteres.` | Nome longo demais. |
| `contato` | `Informe um telefone ou e-mail.` | Vazio. |
| `contato` | `Digite um telefone ou e-mail válido.` | Não é telefone nem e-mail. |
| `contato` | `Este telefone ou e-mail já tem uma conta.` | O contato já existe em qualquer um dos dois perfis. A `message` é `Contato já cadastrado.` |
| `senha` | `Crie uma senha.` | Vazia ou ausente. |
| `senha` | `A senha precisa ter pelo menos 6 caracteres.` | Menos de 6 caracteres. |
| `senha` | `A senha está longa demais.` | Mais de 72 caracteres. |
| `senha` | `A senha precisa ser enviada como texto.` | Enviada como número ou outro tipo. |
| `tipo` | `tipo deve ser AGRICULTORA ou COORDENADORA.` | Outro valor. |
| `comunidadeId` | `Escolha sua comunidade.` | Agricultora sem comunidade. |
| `comunidadeId` | `Comunidade inválida.` | Não é um número inteiro positivo. |
| `comunidadeId` | `Comunidade não encontrada.` | O id não existe no banco. |

Exemplo (senha curta):

```json
{
  "message": "A senha precisa ter pelo menos 6 caracteres.",
  "campos": { "senha": "A senha precisa ter pelo menos 6 caracteres." }
}
```

> ⚠️ **Limitação atual:** o contato é comparado como foi digitado (sem os espaços das pontas): `92 99999-0000` e `92999990000` contam como contatos diferentes.

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
    "tipo": "AGRICULTORA",
    "trocarSenha": false
  }
}
```

- O token é um **JWT** que vale **1 dia**.
- Dentro dele vão `id`, `tipo` e `contato` da usuária.
- O `tipo` diz qual tela abrir no front: `AGRICULTORA` vai para os plantios e `COORDENADORA` para a área da responsável.
- `trocarSenha: true` quer dizer que ela entrou com uma **senha provisória** (ver "Esqueci minha senha" abaixo). O front leva direto para a tela de criar senha nova e não libera as outras telas antes disso.

**Erros — `401 Unauthorized`**

| Mensagem | Quando acontece |
|---|---|
| `contato e senha são obrigatórios.` | Falta o contato ou a senha (ou a senha não veio como texto). |
| `Contato ou senha inválidos.` | O contato não existe **ou** a senha está errada. A mensagem é a mesma de propósito, para não revelar quais contatos estão cadastrados. |

Depois de 5 senhas erradas seguidas, a resposta passa a ser `429` por 15 minutos, mesmo com a senha certa (ver **Segurança**).

---

### Esqueci minha senha

Há dois caminhos, conforme o contato da conta. A tela `/esqueci-senha` do front escolhe sozinha:

| Contato da conta | Como recupera |
|---|---|
| **E-mail** | Recebe um link por e-mail e cria a senha nova sozinha. |
| **Telefone** | A **responsável pela comunidade** gera uma senha provisória (não há envio de SMS). |

#### Pelo e-mail

1. Em **Esqueci minha senha**, a pessoa digita o e-mail da conta.
2. A API manda um e-mail com o link `FRONT_URL/redefinir-senha?token=...`. O link **vale 30 minutos e só funciona uma vez**.
3. O link abre a tela **Criar senha nova**. Depois de salvar, a pessoa volta para o login.

Vale para os dois perfis: a responsável que se cadastrou com e-mail também recupera a própria senha assim.

##### `POST /auth/esqueci-senha`

Não precisa de login.

```json
{ "contato": "maria@email.com" }
```

**Resposta — `200 OK`**, **exista a conta ou não**, para ninguém usar esta rota para descobrir quais e-mails estão cadastrados:

```json
{ "message": "Se esse e-mail tiver uma conta no SemeAR, enviamos um link para criar uma senha nova." }
```

- O e-mail é comparado sem diferenciar maiúsculas de minúsculas.
- Um link novo cancela os links anteriores que não foram usados.
- No máximo um e-mail por minuto para a mesma conta. Pedidos repetidos nesse intervalo recebem a mesma resposta, mas nenhum e-mail novo é enviado.
- O banco guarda só o **hash** do token (tabela `RedefinicaoSenha`), nunca o token em si.

**Erros — `400`** (com `campos.contato`)

| Mensagem | Quando acontece |
|---|---|
| `Informe o e-mail da sua conta.` | Sem contato. |
| `A recuperação por e-mail só funciona para contas criadas com e-mail. Se você usa telefone, peça uma senha provisória para a responsável pela sua comunidade.` | O contato é um telefone. |

Se o servidor de e-mail falhar, a resposta é `500` com `Não foi possível enviar o e-mail agora. Tente novamente mais tarde.`

##### `POST /auth/redefinir-senha/validar`

Confere se o link ainda vale, para a tela avisar logo, antes de a pessoa digitar a senha nova.

```json
{ "token": "<token do link>" }
```

Responde `200 { "valido": true }` ou `400` com `Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".`

##### `POST /auth/redefinir-senha`

```json
{ "token": "<token do link>", "novaSenha": "minhasenhanova" }
```

**Resposta — `200 OK`:** `{ "message": "Senha alterada." }`. O link deixa de valer, e se a senha era provisória, deixa de ser.

**Erros — `400`**

| Mensagem | Quando acontece |
|---|---|
| As mensagens da senha do cadastro (em `campos.novaSenha`) | Senha nova fora das regras. |
| `Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".` | Token inventado, vencido ou já usado. |

#### Pela responsável (contas com telefone)

1. Na lista de agricultoras, ela toca em **Redefinir senha** e gera uma **senha provisória** (ex.: `e3jk-rgy5`). A senha antiga deixa de funcionar na hora.
2. Ela passa a senha provisória para a agricultora, de boca ou por WhatsApp. A senha aparece uma vez só.
3. A agricultora entra com o contato dela e a senha provisória. O login devolve `trocarSenha: true` e o app abre a tela **Crie sua senha nova**.
4. Depois de criar a senha nova, a provisória deixa de funcionar e o app abre normalmente.

##### `POST /coordenadora/agricultoras/:id/redefinir-senha`

Só `COORDENADORA`, e só para agricultoras **da comunidade dela**. Não tem corpo.

**Resposta — `200 OK`**

```json
{
  "senhaProvisoria": "e3jk-rgy5",
  "agricultora": { "id": 7, "nome": "Maria Souza" }
}
```

A senha provisória tem 8 letras e números sorteados, sem os que se confundem (`l`, `1`, `o`, `0`, `i`).

**Erros**

| Status | Mensagem | Quando acontece |
|---|---|---|
| `401` | (erros do middleware) | Sem token ou token inválido. |
| `403` | `Apenas a responsável pela comunidade pode ver estes dados.` | Quem chamou não é `COORDENADORA`. |
| `404` | `Agricultora não encontrada na sua comunidade.` | O id não existe **ou** é de outra comunidade (a resposta é a mesma de propósito). |
| `404` | `Você ainda não está ligada a nenhuma comunidade.` | A responsável não tem comunidade. |

#### Trocar a senha estando logada

##### `POST /auth/trocar-senha`

Qualquer usuária logada troca a própria senha. Serve para sair da senha provisória e para quem só quer trocar.

**Corpo da requisição**

```json
{ "senhaAtual": "e3jk-rgy5", "novaSenha": "minhasenhanova" }
```

`novaSenha` segue as mesmas regras do cadastro (6 a 72 caracteres) e precisa ser diferente da atual.

**Resposta — `200 OK`**

```json
{ "message": "Senha alterada." }
```

**Erros — `400 Bad Request`** (com `campos`)

| Campo | Mensagem |
|---|---|
| `senhaAtual` | `Informe a senha atual.` |
| `senhaAtual` | `A senha atual está incorreta.` |
| `novaSenha` | As mesmas mensagens da senha do cadastro. |
| `novaSenha` | `A senha nova precisa ser diferente da atual.` |

> ⚠️ **Limitações atuais:**
> - Uma sessão que já estava aberta antes da redefinição (por e-mail ou pela responsável) continua valendo até o token vencer (1 dia).
> - A obrigação de trocar a senha provisória é garantida pelo front. A API ainda aceita as outras rotas com o token de quem entrou com senha provisória.
> - A responsável que se cadastrou com **telefone** não tem como recuperar a própria senha pelo app.
> - Para os e-mails chegarem de verdade, alguém da equipe precisa configurar um serviço de envio (SMTP) no `.env` do servidor.

---

### Perfil (`/perfil`)

Dados da usuária logada, agricultora ou responsável. O id vem sempre do token: ninguém consegue ver ou editar o perfil de outra pessoa por aqui. No front, a tela abre ao tocar no **"Olá, Nome"** do cabeçalho.

#### `GET /perfil`

**Resposta — `200 OK`**

```json
{
  "id": 7,
  "nome": "Maria Souza",
  "contato": "92 99999-0000",
  "tipo": "AGRICULTORA",
  "comunidade": { "id": 1, "nome": "Comunidade 1" },
  "criadoEm": "2026-11-12T22:00:00.000Z"
}
```

Nunca devolve a senha nem o hash dela. `comunidade` é `null` para uma responsável sem comunidade.

#### `PUT /perfil`

Muda o **nome** e o **contato**. O contato é também o login.

```json
{ "nome": "Maria Souza", "contato": "maria@email.com" }
```

- Os dois campos são obrigatórios e seguem as mesmas regras do cadastro.
- O contato continua único entre agricultoras e responsáveis. Manter o próprio contato é permitido.
- **Tipo, comunidade e senha não mudam por aqui.** Outros campos enviados são ignorados. A senha tem rota própria (`POST /auth/trocar-senha`).
- Depois de mudar o contato, o login passa a ser feito com o contato novo. O token atual continua valendo.

**Resposta — `200 OK`:** o perfil atualizado, no mesmo formato do `GET`.

**Erros**

| Status | Mensagem | Quando acontece |
|---|---|---|
| `400` | Mensagens do cadastro em `campos.nome` / `campos.contato` | Nome vazio ou longo demais, contato inválido. |
| `400` | `Este telefone ou e-mail já é usado por outra conta.` (em `campos.contato`) | O contato já é de outra conta. |
| `401` | Erros do middleware, ou `Sessão inválida. Entre de novo.` | Sem token, token inválido ou conta que não existe mais. |

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

Quais rotas pedem login e qual perfil pode usar cada uma: tabela em **API: visão geral**. O perfil é conferido pelos middlewares de [`src/middleware/perfil.js`](src/middleware/perfil.js) (`soAgricultora`, `soResponsavel`); outro perfil recebe `403`.

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

---

## Plantios (`/plantios`)

Só `AGRICULTORA`, com login. Cada agricultora vê e altera **só os próprios** plantios: o plantio de outra pessoa responde `404 Plantio não encontrado.`

Formato de um plantio:

```json
{
  "id": 16,
  "especie": "Milho",
  "dataPlantio": "2026-10-01T00:00:00.000Z",
  "area": 12.5,
  "tipoCultivo": "orgânico",
  "dataColheita": null,
  "quantidadeColhida": null,
  "agricultoraId": 7,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `GET /plantios`

Lista os plantios da agricultora, do mais novo para o mais antigo. Filtros opcionais na URL:

| Filtro | Exemplo | O que faz |
|---|---|---|
| `especie` | `?especie=milho` | Espécie que contém o texto (sem diferenciar maiúsculas) |
| `dataInicio` | `?dataInicio=2026-01-01` | Plantados a partir desta data |
| `dataFim` | `?dataFim=2026-12-31` | Plantados até esta data |

Data inválida no filtro: `400` com `campos.dataInicio` / `campos.dataFim`.

### `POST /plantios` e `PUT /plantios/:id`

```json
{ "especie": "Milho", "dataPlantio": "2026-10-01", "area": "12,5", "tipoCultivo": "orgânico" }
```

| Campo | Regras |
|---|---|
| `especie` | Texto, até 60 caracteres. |
| `dataPlantio` | `AAAA-MM-DD`, uma data que existe (31/02 não passa), no máximo **12 meses no futuro** (RN03). |
| `area` | Em m², maior que zero (RN02), até 10.000.000. Aceita `12,5` ou `12.5`. |
| `tipoCultivo` | `orgânico` ou `convencional` (aceita sem acento e com maiúsculas; é gravado como `orgânico` / `convencional`). |

Respostas: `201` (criar) ou `200` (editar) com o plantio. Erros de validação: `400` com `campos`. Editar um plantio já colhido com a data de plantio depois da colheita também dá `400`.

### `DELETE /plantios/:id`

`204` sem corpo. Apaga o plantio (e a colheita registrada nele).

### `PUT /plantios/:id/colheita` e `DELETE /plantios/:id/colheita`

Registra a colheita (a "saída" do estoque) ou desfaz um registro feito por engano.

```json
{ "dataColheita": "2026-11-10", "quantidadeColhida": 35.5 }
```

| Campo | Regras |
|---|---|
| `dataColheita` | `AAAA-MM-DD`, não pode estar no futuro nem ser antes do plantio. |
| `quantidadeColhida` | Em kg, maior que zero, até 1.000.000. |

Resposta: `200` com o plantio atualizado (o `DELETE` volta `dataColheita` e `quantidadeColhida` para `null`).

---

## Comunidade e responsável

### `GET /comunidades`

Pública. `[{ "id": 1, "nome": "Comunidade 1" }, ...]`, em ordem de nome.

### `GET /coordenadora/agricultoras`

Só `COORDENADORA`. Agricultoras da comunidade dela, com totais:

```json
{
  "comunidade": { "id": 1, "nome": "Comunidade 1" },
  "agricultoras": [
    { "id": 7, "nome": "Maria Souza", "contato": "92 99999-0000", "totalPlantios": 3, "areaTotal": 125, "areaEmCampo": 65 }
  ]
}
```

`areaEmCampo` é a área dos plantios ainda sem colheita.

### `GET /coordenadora/plantios`

Só `COORDENADORA`. Todos os plantios da comunidade, cada um com `agricultora: { id, nome }`. É a base da tela de estoque.

### `GET /dashboard/comunidade`

Qualquer perfil logado. Números da comunidade de quem está logada:

```json
{
  "comunidade": { "id": 1, "nome": "Comunidade 1" },
  "areaTotal": 170.5,
  "agricultorasAtivas": 2,
  "especies": [{ "especie": "Milho", "area": 40, "quantidade": 1 }]
}
```

Rotas da responsável sem comunidade ligada: `404 Você ainda não está ligada a nenhuma comunidade.`

---

## Calendário (`/calendario/:especie`)

Público. Época de plantio e de colheita de uma espécie da tabela `CalendarioAgricola`:

```json
{ "id": 1, "especie": "Milho", "epocaPlantio": "set–nov", "epocaColheita": "fev–mar" }
```

Espécie que não está na tabela: `404 Calendário não encontrado para a espécie informada.` A tabela ainda não tem seed; o calendário de cada plantio no app usa o ciclo das espécies guardado no front.

---

## Saúde (`/health`)

Público. Usado pelo Render para saber se a publicação deu certo.

- `200 { "status": "ok", "banco": "ok" }`: a API e o banco estão funcionando.
- `503 { "status": "erro", "banco": "indisponível" }`: a API está no ar, mas não consegue falar com o banco.
