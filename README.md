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

Variáveis do arquivo `.env` (na raiz). Para começar, copie o modelo: `cp .env.example .env` (no Windows: `copy .env.example .env`).

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Endereço do PostgreSQL |
| `JWT_SECRET` | Chave usada para assinar e conferir os tokens de login |
| `PORT` | Porta da API (padrão `3000`) |
| `FRONT_URL` | Endereço do front, usado no link do e-mail de "esqueci minha senha" (padrão `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Servidor de envio de e-mail. **Sem `SMTP_HOST`, nenhum e-mail é enviado:** o conteúdo aparece no terminal da API (serve para testar). |
| `EMAIL_REMETENTE` | Quem aparece como remetente. Se ficar vazio, usa `SemeAR <SMTP_USER>`. |

### Envio de e-mail pelo Gmail

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

## Autenticação (`/auth`)

Todas as requisições e respostas usam JSON (`Content-Type: application/json`).
Erros sempre vêm no formato:

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
| `/coordenadora/agricultoras`, `/coordenadora/plantios`, `/coordenadora/agricultoras/:id/redefinir-senha` | Só `COORDENADORA` (outro perfil recebe `403`). |
| `/dashboard/comunidade`, `/auth/trocar-senha` | Qualquer perfil logado. |

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
