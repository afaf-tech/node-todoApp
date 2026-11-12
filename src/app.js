import path from 'node:path';

import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { isProduction, isTest, rootDir } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { Todo } from './models/todo.js';
import { todosRouter } from './routes/todos.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(rootDir, 'views'));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Only force HTTPS in production; localhost development should stay HTTP.
          'upgrade-insecure-requests': isProduction ? [] : null,
        },
      },
    }),
  );
  app.use(compression());

  if (!isTest) {
    app.use(morgan(isProduction ? 'combined' : 'dev'));
  }

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));
  app.use(
    express.static(path.join(rootDir, 'public'), {
      maxAge: isProduction ? '1h' : 0,
    }),
  );

  const renderTodoPage = async (_req, res) => {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.render('todo', { todos });
  };

  app.get('/', renderTodoPage);
  app.get('/todo', renderTodoPage);

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/todos', todosRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
