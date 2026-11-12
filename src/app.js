require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const plantioRoutes = require('./routes/plantioRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');
const comunidadeRoutes = require('./routes/comunidadeRoutes');
const prisma = require('./config/prisma');
const { listaDeOrigens } = require('./config/url');

const app = express();
const port = process.env.PORT || 3000;

// CORS: em produção, só o endereço do front (CORS_ORIGIN, pode ter vários separados por vírgula).
// Sem CORS_ORIGIN (desenvolvimento), aceita qualquer origem.
const origensPermitidas = listaDeOrigens(process.env.CORS_ORIGIN);
app.use(cors(origensPermitidas.length ? { origin: origensPermitidas } : {}));
app.use(express.json());
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
app.use('/plantios', plantioRoutes);
app.use('/calendario', calendarioRoutes);
app.use('/', comunidadeRoutes);

app.use((error, req, res, next) => {
  // Corpo da requisição com JSON mal formatado: erro de quem chamou, não do servidor
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'O corpo da requisição não é um JSON válido.' });
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