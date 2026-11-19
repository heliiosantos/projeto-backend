
function notFound(req, res, next) {
  res.status(404).json({
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    message:
      statusCode === 500
        ? 'Erro interno do servidor.'
        : err.message || 'Ocorreu um erro na requisição.',
  });
}

module.exports = {
  notFound,
  errorHandler,
};
