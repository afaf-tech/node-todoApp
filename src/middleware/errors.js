import { isTest } from '../config.js';

export function notFound(req, res) {
  if (
    req.accepts(['html', 'json']) === 'html' &&
    !req.path.startsWith('/api')
  ) {
    return res.status(404).render('not-found');
  }

  res.status(404).json({ error: 'Not found.' });
}

// Express 5 forwards rejected promises from async handlers here automatically.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'ValidationError') {
    return res.status(422).json({
      error: 'Validation failed.',
      details: Object.values(err.errors).map((error) => error.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid value.' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  if (!isTest) {
    console.error(err);
  }

  res.status(500).json({ error: 'Internal server error.' });
}
