process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { createApp } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/db.js');
const { Todo } = await import('../src/models/todo.js');

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
  app = createApp();
});

after(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  await Todo.deleteMany({});
});

test('GET /healthz reports the service is up', async () => {
  const response = await request(app).get('/healthz').expect(200);

  assert.deepEqual(response.body, { status: 'ok' });
});

test('responses include security headers', async () => {
  const response = await request(app).get('/').expect(200);

  assert.equal(response.headers['x-powered-by'], undefined);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.match(
    response.headers['content-security-policy'],
    /default-src 'self'/,
  );
});

test('GET /api/todos starts empty', async () => {
  const response = await request(app).get('/api/todos').expect(200);

  assert.deepEqual(response.body, { todos: [] });
});

test('POST /api/todos creates a trimmed todo', async () => {
  const response = await request(app)
    .post('/api/todos')
    .send({ item: '  buy milk  ' })
    .expect(201);

  assert.equal(response.body.todo.item, 'buy milk');
  assert.equal(response.body.todo.completed, false);
  assert.match(response.body.todo.id, /^[a-f\d]{24}$/);
  assert.equal(response.body.todo._id, undefined);
  assert.equal(response.body.todo.__v, undefined);
});

test('POST /api/todos rejects missing and blank items', async () => {
  await request(app).post('/api/todos').send({}).expect(400);
  await request(app).post('/api/todos').send({ item: '   ' }).expect(400);
  await request(app).post('/api/todos').send({ item: 42 }).expect(400);
});

test('POST /api/todos rejects items that are too long', async () => {
  const response = await request(app)
    .post('/api/todos')
    .send({ item: 'x'.repeat(201) })
    .expect(422);

  assert.equal(response.body.error, 'Validation failed.');
  assert.match(response.body.details[0], /200 characters/);
});

test('POST /api/todos rejects malformed JSON', async () => {
  await request(app)
    .post('/api/todos')
    .set('Content-Type', 'application/json')
    .send('{not json')
    .expect(400);
});

test('PATCH /api/todos/:id toggles completion', async () => {
  const created = await request(app)
    .post('/api/todos')
    .send({ item: 'walk the dog' })
    .expect(201);

  const response = await request(app)
    .patch(`/api/todos/${created.body.todo.id}`)
    .send({ completed: true })
    .expect(200);

  assert.equal(response.body.todo.completed, true);

  const stored = await Todo.findById(created.body.todo.id);
  assert.equal(stored.completed, true);
});

test('PATCH /api/todos/:id validates the id and payload', async () => {
  await request(app)
    .patch('/api/todos/not-an-id')
    .send({ completed: true })
    .expect(400);

  await request(app).patch('/api/todos/not-an-id').send({}).expect(400);

  await request(app)
    .patch(`/api/todos/${new mongoose.Types.ObjectId()}`)
    .send({ completed: true })
    .expect(404);
});

test('PATCH /api/todos/:id edits the item text', async () => {
  const created = await request(app)
    .post('/api/todos')
    .send({ item: 'old text' })
    .expect(201);

  const response = await request(app)
    .patch(`/api/todos/${created.body.todo.id}`)
    .send({ item: '  new text  ' })
    .expect(200);

  assert.equal(response.body.todo.item, 'new text');
  assert.equal(response.body.todo.completed, false);

  await request(app)
    .patch(`/api/todos/${created.body.todo.id}`)
    .send({ item: 'x'.repeat(201) })
    .expect(422);
});

test('API rejects NoSQL operator payloads', async () => {
  await request(app)
    .post('/api/todos')
    .send({ item: { $ne: null } })
    .expect(400);

  const created = await Todo.create({ item: 'safe value' });

  await request(app)
    .patch(`/api/todos/${created.id}`)
    .send({ completed: { $ne: false } })
    .expect(400);

  await request(app)
    .patch(`/api/todos/${created.id}`)
    .send({ item: { $gt: '' } })
    .expect(400);

  // sanitizeFilter wraps operator-style filters in $eq, so Mongoose refuses
  // to cast them instead of treating them as query operators.
  await assert.rejects(
    () => Todo.find({ item: { $ne: 'other value' } }).exec(),
    /Cast to string failed/,
  );
});

test('DELETE /api/todos/completed clears only completed todos', async () => {
  await Todo.create([
    { item: 'done one', completed: true },
    { item: 'still active', completed: false },
    { item: 'done two', completed: true },
  ]);

  const response = await request(app)
    .delete('/api/todos/completed')
    .expect(200);

  assert.equal(response.body.deleted, 2);

  const remaining = await Todo.find();
  assert.deepEqual(
    remaining.map((todo) => todo.item),
    ['still active'],
  );
});

test('DELETE /api/todos/:id removes the todo', async () => {
  const created = await request(app)
    .post('/api/todos')
    .send({ item: 'temporary' })
    .expect(201);

  await request(app).delete(`/api/todos/${created.body.todo.id}`).expect(204);

  const response = await request(app).get('/api/todos').expect(200);
  assert.deepEqual(response.body, { todos: [] });
});

test('DELETE /api/todos/:id returns 404 for unknown ids', async () => {
  await request(app)
    .delete(`/api/todos/${new mongoose.Types.ObjectId()}`)
    .expect(404);
});

test('GET / renders the list and escapes todo text', async () => {
  await Todo.create({ item: '<script>alert(1)</script>', completed: true });

  const response = await request(app)
    .get('/')
    .expect('Content-Type', /html/)
    .expect(200);

  assert.match(response.text, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(response.text, /<script>alert\(1\)<\/script>/);
  assert.match(response.text, /class="todo is-done"/);
});

test('unknown routes return JSON for the API and HTML for browsers', async () => {
  const apiResponse = await request(app)
    .get('/api/does-not-exist')
    .expect('Content-Type', /json/)
    .expect(404);

  assert.equal(apiResponse.body.error, 'Not found.');

  await request(app)
    .get('/does-not-exist')
    .set('Accept', 'text/html')
    .expect('Content-Type', /html/)
    .expect(404);
});
