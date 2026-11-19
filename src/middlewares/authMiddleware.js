const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(400).json({ message: 'Token de autenticação não informado.' });
  }

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return res.status(400).json({ message: 'Formato do token inválido. Utilize Bearer.' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Chave JWT não configurada no servidor.' });
  }

  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    req.user = { id: decoded.id, isAdmin: decoded.isAdmin };
    return next();
  } catch (error) {
    return res.status(400).json({ message: 'Token inválido ou expirado.' });
  }
}

module.exports = authMiddleware;
