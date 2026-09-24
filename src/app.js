require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const plantioRoutes = require('./routes/plantioRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API do SemeAR rodando com sucesso!' });
});

app.use('/auth', authRoutes);
app.use('/plantios', plantioRoutes);
app.use('/calendario', calendarioRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

module.exports = app;