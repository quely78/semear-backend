# 🌱 SemeAR — Front-end

> O registro do plantio, feito por **ELAS** — feito por quem planta.

Front-end do SemeAR, o sistema de registro de plantio das agricultoras ligadas à Amazon Carbon, em Rio Preto da Eva (AM).
Feito em **React + Vite**, pensado primeiro para o **celular** e para **internet lenta** (cerca de 62 KB comprimido).

Equipe **vertex**: Alice Quely, João Ribeiro, Karolayne Diniz, Maria Helena e Maria Luana.

---

## 📱 Telas (wireframe v1)

| Nº | Tela | Endereço | Requisito |
|---|---|---|---|
| 01 | Cadastro | `/cadastro` | RF01 |
| 02 | Login | `/login` | RF02 |
| 03 | Meus plantios (com filtros) | `/plantios` | RF06 |
| 04 | Cadastrar / editar / excluir plantio | `/plantios/novo` e `/plantios/:id/editar` | RF03, RF04, RF05 |
| 05 | Calendário agrícola | `/calendario` | RF07 |
| 05b | Calendário do plantio (etapas, chuva prevista, registrar colheita) | `/plantios/:id/calendario` | RF07 |
| 06 | Dashboard da comunidade | `/comunidade` | RF08, RF09 |
| 07 | Validação de dados | dentro da tela 04 | RN02, RN03 |
| 08 | Responsável pela comunidade | `/coordenadora` | perfil de quem cuida da comunidade |
| 08b | Agricultoras da comunidade | `/coordenadora/agricultoras` | lista para a responsável |
| 09 | Estoque da comunidade (plantio = entrada, colheita = saída) | `/coordenadora/estoque` | só a responsável |

---

## 🚀 Como rodar

Pré-requisitos: **Node.js 18 ou mais novo** e o **semear-backend** rodando em `http://localhost:3000`.

```bash
# 1. Instalar as dependências
npm install

# 2. Criar o arquivo de configuração a partir do modelo
cp .env.example .env        # no Windows: copy .env.example .env

# 3. Rodar em modo desenvolvimento (abre em http://localhost:5173)
npm run dev

# Gerar a versão final (pasta dist/)
npm run build
```

---

## 🗂️ Estrutura de pastas

```
semear-frontend/
├── .env.example              # modelo das variáveis (endereço da API)
├── .gitignore
├── index.html                # página única; carrega fontes e o React
├── package.json
├── vite.config.js
├── README.md
├── public/                   # arquivos servidos como estão
│   ├── icone.png             # ícone do app (também é o favicon)
│   ├── logo-horizontal.png   # logo para cabeçalhos
│   └── logo-vertical.png     # logo para telas de abertura
└── src/
    ├── main.jsx              # ponto de entrada do React
    ├── App.jsx               # mapa de rotas (URL → tela)
    ├── config/
    │   ├── dados.js          # comunidades, espécies, tipos de cultivo, períodos do filtro
    │   └── ciclos.js         # etapas do ciclo de cada espécie + épocas de chuva da região
    ├── context/
    │   └── AuthContext.jsx   # login/logout disponível em todas as telas
    ├── services/             # conversa com a API
    │   ├── api.js            # função central de requisição + token
    │   ├── authService.js
    │   ├── plantioService.js
    │   ├── comunidadeService.js # comunidades, agricultoras e plantios da comunidade
    │   ├── climaService.js   # previsão de chuva (Open-Meteo) com cache
    │   └── dashboardService.js
    ├── utils/
    │   ├── validacoes.js     # RN02, RN03, contato, senha...
    │   ├── formatadores.js   # datas, m², nomes
    │   ├── datas.js          # contas com datas do calendário (sem problema de fuso)
    │   ├── estoque.js        # situação de cada plantio e totais do estoque
    │   └── exportarGrafico.js # gera o PNG do gráfico de espécies
    ├── components/           # peças reutilizáveis
    │   ├── Aviso.jsx         # faixa de erro/sucesso/info
    │   ├── CalendarioMes.jsx # grade de um mês do calendário do plantio
    │   ├── Cabecalho.jsx     # "Olá, Nome · Sair" nas abas; "‹ voltar" nas telas internas
    │   ├── Campo.jsx         # rótulo + campo + erro
    │   ├── Carregando.jsx
    │   ├── GraficoBarras.jsx # gráfico de espécies (sem biblioteca)
    │   ├── Icone.jsx         # ícones em SVG
    │   ├── Layout.jsx        # moldura das telas internas
    │   ├── Logo.jsx
    │   ├── MenuInferior.jsx  # Plantios · Calendário · Comunidade
    │   ├── PlantioCard.jsx
    │   ├── RegistroColheita.jsx # situação + registrar/desfazer colheita
    │   └── RotaProtegida.jsx # bloqueia telas sem login
    ├── pages/                # uma tela por arquivo
    │   ├── Cadastro.jsx      # Tela 01
    │   ├── Login.jsx         # Tela 02
    │   ├── MeusPlantios.jsx  # Tela 03
    │   ├── FormPlantio.jsx   # Telas 04 e 07
    │   ├── Calendario.jsx    # Tela 05
    │   ├── CalendarioPlantio.jsx # Tela 05b — calendário de um plantio
    │   ├── Dashboard.jsx     # Tela 06
    │   ├── Coordenadora.jsx  # Tela 08
    │   ├── Agricultoras.jsx  # Tela 08b
    │   ├── Estoque.jsx       # Tela 09 (só a responsável)
    │   └── NaoEncontrada.jsx # página 404
    └── styles/
        └── global.css        # cores e fontes da identidade visual
```

---

## 🎨 Identidade visual aplicada

| Cor | Hex | Uso no app |
|---|---|---|
| Verde-Mata | `#355E3B` | botões principais, títulos, cabeçalho da tabela |
| Verde-Broto | `#86AE3E` | plantios orgânicos, carregamento |
| Terra | `#6E4B2A` | plantios convencionais, avisos informativos |
| Rosa-Ipê | `#BE3E73` | erros, destaque "ELAS", aba ativa |
| Areia | `#F4ECDD` | fundo do app |
| Verde-Boiuna | `#68A771` | detalhes e hover |

Fontes: **Baloo 2** (títulos) e **Work Sans** (textos). Campos e botões com 52 px de altura para facilitar o toque.

Todas as cores ficam como variáveis no início de `src/styles/global.css`. Bordas de campos, contorno de foco e textos passam no contraste mínimo do WCAG.

---

## 📅 Calendário do plantio

Tocar em um plantio (em **Meus plantios** ou na aba **Calendário**) abre o calendário dele, mês a mês:

| Marca | Significado | De onde vem |
|---|---|---|
| Círculo verde | Dia do plantio | data cadastrada |
| Bolinha verde-broto | Crescimento (germinação, floração) | `src/config/ciclos.js` |
| Bolinha terra | Cuidados (capina, adubação) | `src/config/ciclos.js` |
| Bolinha rosa | Colheita | `src/config/ciclos.js` |
| Faixa azul | Chuva prevista (ex.: "13 a 17 de novembro") | previsão Open-Meteo |

- **Etapas:** contadas em dias depois do plantio, com o ciclo **médio** de cada espécie. São estimativas: **devem ser conferidas por quem entende de agronomia** antes de chegar às agricultoras. Para ajustar, basta mudar os números em `ciclos.js`.
- **Chuva:** previsão de até 16 dias para Rio Preto da Eva, pela API gratuita [Open-Meteo](https://open-meteo.com/) (sem chave; só a localização do município é enviada). Fica guardada no celular por 3 horas. Sem internet, usa a última previsão salva; se não houver, mostra só a época do ano (chuvosa dez–mai, seca jul–out).

---

## 📦 Estoque

O estoque é uma ferramenta **só da responsável pela comunidade** (`/coordenadora/estoque`). Os plantios funcionam como um estoque:

- **Entrada** = plantio (área em m² que vai para o campo).
- **Saída** = colheita. Quem registra é a agricultora, no calendário do plantio (data + quilos); dá para desfazer se foi por engano.

Cada plantio tem uma situação, calculada pelo ciclo da espécie (`src/utils/estoque.js`): **crescendo**, **pronto para colher**, **colheita atrasada** ou **colhido**.

A responsável vê a comunidade inteira, com filtro por agricultora. Tocar em uma agricultora na lista abre o estoque dela.

A tela mostra a área no campo por situação, o que está pronto para colher, os totais por espécie e o histórico de entradas e saídas.

## 🖼️ Exportar gráfico

Na tela **Comunidade**, o botão **Baixar gráfico (imagem)** gera um PNG com o gráfico de espécies, os totais e a data, pronto para mandar pelo WhatsApp. A agricultora pode alternar entre os números da **Comunidade** e os de **Meus plantios** antes de baixar. A imagem é gerada no próprio celular.

---

## 🔌 Integração com o back-end

Rotas do `semear-backend` usadas pelo front:

| Método | Rota | Usada em |
|---|---|---|
| POST | `/auth/cadastro` | Cadastro |
| POST | `/auth/login` | Login |
| GET | `/plantios?especie=&dataInicio=` | Meus plantios |
| POST | `/plantios` | Novo plantio |
| PUT | `/plantios/:id` | Editar plantio |
| DELETE | `/plantios/:id` | Excluir plantio |
| PUT | `/plantios/:id/colheita` | Registrar colheita (saída do estoque) |
| DELETE | `/plantios/:id/colheita` | Desfazer colheita |
| GET | `/comunidades` | Cadastro |
| GET | `/coordenadora/agricultoras` | Início e Agricultoras (responsável) |
| GET | `/coordenadora/plantios` | Início e Estoque (responsável) |
| GET | `/dashboard/comunidade` | Comunidade |

Serviço externo: `GET https://api.open-meteo.com/v1/forecast` (previsão de chuva do calendário do plantio).

### ⚠️ Pendências para combinar com o back-end (Karol e João)

O front já funciona com a API atual, mas estes pontos dependem do back-end:

1. **RN03 (data até 12 meses no futuro)** — validada no front; recomenda-se validar também na API.
2. **Banco de dados** — os documentos citam MySQL/XAMPP, mas o `schema.prisma` atual usa PostgreSQL. Vale alinhar com a equipe.

---

## ✅ Regras de validação

- **RN02** — área plantada só aceita valor positivo (aceita vírgula: `12,5`).
- **RN03** — data de plantio até 12 meses no futuro.
- Datas inexistentes (ex.: 31/02) são recusadas.
- Senha com no mínimo 6 caracteres; contato precisa ser telefone ou e-mail.
- Com erro: campos ficam destacados em rosa + "Corrija os campos destacados para continuar".
- Com sucesso: volta para a lista com "Plantio salvo com sucesso".
