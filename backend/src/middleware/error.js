// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Validation errors
  if (err.message.includes('validation error')) {
    error.status = 400;
    error.type = 'validation_error';
  }

  // Database errors
  if (err.message.includes('UNIQUE constraint failed')) {
    error.status = 409;
    error.message = 'Resource already exists';
    error.type = 'duplicate_error';
  }

  // Grok API errors
  if (err.message.includes('Authentication failed')) {
    error.status = 500;
    error.message = 'AI service configuration error';
    error.type = 'ai_service_error';
  }

  // Rate limiting errors
  if (err.message.includes('Too many requests')) {
    error.status = 429;
    error.type = 'rate_limit_error';
  }

  res.status(error.status).json({
    error: {
      message: error.message,
      type: error.type || 'server_error',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

// 404 handler
function notFound(req, res, next) {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
}

// Validation middleware generator
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      const validationError = new Error(`Validation error: ${error.details[0].message}`);
      validationError.status = 400;
      return next(validationError);
    }
    req.body = value;
    next();
  };
}

module.exports = {
  errorHandler,
  notFound,
  requestLogger,
  validateBody
};
