const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const autorizacao = req.headers.authorization;
  const token = autorizacao && autorizacao.startsWith('Bearer ')
    ? autorizacao.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Token de autenticação não informado.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token de autenticação inválido.' });
  }
}

module.exports = autenticar;
