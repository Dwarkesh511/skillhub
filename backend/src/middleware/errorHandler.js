export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  });
};
