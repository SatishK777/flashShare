import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Shares API', () => {
  let createdShareId: string;
  let createdToken: string;

  afterAll(async () => {
    if (createdShareId) {
      await prisma.share.deleteMany({ where: { id: createdShareId } });
    }
  });

  it('1. POST /api/shares — creates share with valid settings', async () => {
    const res = await request(app)
      .post('/api/shares')
      .send({
        settings: {
          expiresInMinutes: 60,
          maxDownloads: 5,
          showFilenames: true,
          autoDeletePolicy: 'after_expiry',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('expiresAt');

    createdShareId = res.body.data.id;
    createdToken = res.body.data.token;
  });

  it('2. POST /api/shares — returns 400 for invalid settings (missing body)', async () => {
    const res = await request(app)
      .post('/api/shares')
      .send({});

    expect(res.status).toBe(400);
  });

  it('3. GET /api/shares/:token — returns share with files array', async () => {
    // This test depends on test 1 creating a share
    if (!createdToken) return;

    const res = await request(app)
      .get(`/api/shares/${createdToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('files');
    expect(Array.isArray(res.body.data.files)).toBe(true);
  });

  it('4. GET /api/shares/invalid-token — returns 404', async () => {
    const res = await request(app)
      .get('/api/shares/invalid-token-12345');

    expect(res.status).toBe(404);
  });

  it('5. GET /api/dashboard — returns dashboard stats', async () => {
    const res = await request(app)
      .get('/api/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalShares');
    expect(res.body.data).toHaveProperty('activeShares');
    expect(res.body.data).toHaveProperty('totalDownloads');
    expect(res.body.data).toHaveProperty('totalBandwidth');
  });

  it('6. GET /api/config/ice-servers — returns ICE server config', async () => {
    const res = await request(app)
      .get('/api/config/ice-servers');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('iceServers');
    expect(Array.isArray(res.body.data.iceServers)).toBe(true);
  });
});
