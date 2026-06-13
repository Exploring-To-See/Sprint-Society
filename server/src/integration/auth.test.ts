import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, '../../data/test-auth.db');

// Set env before importing anything that reads DB_PATH
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test-secret-key-for-ci';

import { initializeDatabase } from '../database/db';
import { createApp } from '../app';

const app = createApp();

beforeAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  initializeDatabase();
});

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  if (fs.existsSync(TEST_DB_PATH + '-wal')) fs.unlinkSync(TEST_DB_PATH + '-wal');
  if (fs.existsSync(TEST_DB_PATH + '-shm')) fs.unlinkSync(TEST_DB_PATH + '-shm');
});

describe('Auth flow: register → login → me', () => {
  let token: string;

  it('POST /api/auth/register — creates user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Runner',
        email: 'test@sprintsociety.in',
        phone: '9876543210',
        password: 'SecurePass123',
        gender: 'male',
        age: 28,
        height_cm: 175,
        weight_kg: 72,
        fitness_level: 'active',
        running_experience: 'intermediate',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@sprintsociety.in');
    token = res.body.token;
  });

  it('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate',
        email: 'test@sprintsociety.in',
        phone: '9876543211',
        password: 'AnotherPass1',
      });

    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login — authenticates with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@sprintsociety.in', password: 'SecurePass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Test Runner');
  });

  it('POST /api/auth/login — rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@sprintsociety.in', password: 'WrongPass' });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me — returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Runner');
    expect(res.body.email).toBe('test@sprintsociety.in');
    expect(res.body.age).toBe(28);
  });

  it('GET /api/auth/me — rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-garbage-token');

    expect(res.status).toBe(401);
  });
});
