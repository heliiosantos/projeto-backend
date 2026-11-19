
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        message: 'Token de autenticação não informado.',
      });
    }

    const parts = authorization.split(' ');

    if (
      parts.length !== 2 ||
      parts[0] !== 'Bearer' ||
      !parts[1]
    ) {
      return res.status(401).json({
        message: 'Formato do token inválido. Utilize Bearer.',
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: decoded.id,
      isAdmin: decoded.isAdmin,
    };

    return next();

  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido ou expirado.',
    });
  }
}

module.exports = authMiddleware;
