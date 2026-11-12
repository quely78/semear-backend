require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const plantioRoutes = require('./routes/plantioRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');
const comunidadeRoutes = require('./routes/comunidadeRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const prisma = require('./config/prisma');
const { listaDeOrigens } = require('./config/url');

const app = express();
const port = process.env.PORT || 3000;

// No Render, a API fica atrás de um proxy: sem isto, todo mundo pareceria ter o mesmo IP
// e o limite de tentativas de login bloquearia todas as usuárias juntas.
// (O Render define a variável RENDER; no computador, o IP é o real.)
if (process.env.RENDER) app.set('trust proxy', 1);

// Cabeçalhos de segurança (helmet): impede o navegador de "adivinhar" tipos de arquivo,
// bloqueia a API dentro de iframes de outros sites, esconde que o servidor é Express etc.
app.use(helmet());

// CORS: em produção, só o endereço do front (CORS_ORIGIN, pode ter vários separados por vírgula).
// Sem CORS_ORIGIN (desenvolvimento), aceita qualquer origem.
const origensPermitidas = listaDeOrigens(process.env.CORS_ORIGIN);
app.use(cors(origensPermitidas.length ? { origin: origensPermitidas } : {}));

// Corpo das requisições: só JSON e no máximo 20 KB (nenhuma rota do SemeAR precisa de mais)
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.json({ message: 'API do SemeAR rodando com sucesso!' });
});

// Verificação de saúde (usada pelo Render): a API está no ar E consegue falar com o banco
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ok', banco: 'ok' });
  } catch (error) {
    console.error('Health check: banco indisponível', error.message);
    return res.status(503).json({ status: 'erro', banco: 'indisponível' });
  }
});

app.use('/auth', authRoutes);
app.use('/perfil', perfilRoutes);
app.use('/plantios', plantioRoutes);
app.use('/calendario', calendarioRoutes);
app.use('/', comunidadeRoutes);

// Rota que não existe
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  // Corpo da requisição com JSON mal formatado: erro de quem chamou, não do servidor
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'O corpo da requisição não é um JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ message: 'O corpo da requisição é grande demais.' });
  }
  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

module.exports = app;