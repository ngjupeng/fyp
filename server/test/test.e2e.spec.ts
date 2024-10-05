import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TokenRepository } from '../src/modules/auth/token.repository';
import { UserRepository } from '../src/modules/user/user.repository';
import { describe } from 'node:test';
import { APP } from '../src/common/constants';
import { Role } from '../src/common/enums/role';
import {
  MOCK_USER_EMAIL,
  MOCK_DUPLICATE_NAME,
  MOCK_NAME,
  MOCK_ADMIN_VIET_ONLY_EMAIL,
  MOCK_STRONG_PASSWORD,
  MOCK_WEAK_PASSWORD,
  MOCK_ADMIN_EMAIL,
  MOCK_ADMIN_PASSWORD,
  MOCK_RESTORED_PASSWORD,
} from './constants';
import { UserStatus } from '../src/common/enums/user';

const TIME_OUT = 100_000_000;
jest.setTimeout(TIME_OUT);

describe('E2E Tests E2E', () => {
  let app: INestApplication;
  let tokenRepo: TokenRepository;
  let userRepo: UserRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tokenRepo = moduleFixture.get<TokenRepository>(TokenRepository);
    userRepo = moduleFixture.get<UserRepository>(UserRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('App Routes', () => {
    it('should redirect to API documentation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/${APP.toLowerCase()}`)
        .send();

      expect(response.statusCode).toBe(301);
      expect(response.header.location).toBe('/api-v1');
    });

    it('should return OK for health check', async () => {
      const response = await request(app.getHttpServer()).get('/health').send();

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Authentication', () => {
    let accessTokenUser: string;
    let refreshTokenUser: string;
    let userIdUser: number;

    beforeAll(async () => {
      // create one admin view only user
      await userRepo.create({
        email: MOCK_ADMIN_VIET_ONLY_EMAIL,
        name: MOCK_NAME,
        password: MOCK_STRONG_PASSWORD,
        confirm: MOCK_STRONG_PASSWORD,
        role: Role.ADMINONLYVIEW,
        status: UserStatus.ACTIVE,
      });
    });

    it('should sign up a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: MOCK_USER_EMAIL,
          name: MOCK_NAME,
          password: MOCK_STRONG_PASSWORD,
          confirm: MOCK_STRONG_PASSWORD,
        });

      expect(response.statusCode).toBe(201);

      const user = await userRepo.findOne({ email: MOCK_USER_EMAIL });
      expect(user).toBeDefined();
      userIdUser = user?.id;
    });

    it('should not allow signup with weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'weak@example.com',
          name: 'Weak User',
          password: MOCK_WEAK_PASSWORD,
          confirm: MOCK_WEAK_PASSWORD,
        });

      expect(response.statusCode).toBe(400);
    });

    it('should not allow resending verification email too soon', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: MOCK_USER_EMAIL,
          name: MOCK_DUPLICATE_NAME,
          password: MOCK_STRONG_PASSWORD,
          confirm: MOCK_STRONG_PASSWORD,
        });
      expect(response.statusCode).toBe(400);
    });

    it('should allow duplicate email signup when not verified', async () => {
      // wait for 31 seconds, otherwise resend time too short error
      await new Promise((resolve) => setTimeout(resolve, 31000));

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: MOCK_USER_EMAIL,
          name: MOCK_DUPLICATE_NAME,
          password: MOCK_STRONG_PASSWORD,
          confirm: MOCK_STRONG_PASSWORD,
        });

      expect(response.statusCode).toBe(201);

      const user = await userRepo.findOne({ email: MOCK_USER_EMAIL });
      expect(user).toBeDefined();
      expect(user?.name).toBe(MOCK_DUPLICATE_NAME);
      expect(user?.name).not.toBe(MOCK_NAME);
    });

    it('should verify email', async () => {
      const tokenEntity = await tokenRepo.findOne({ userId: userIdUser });
      const token = tokenEntity?.uuid;

      expect(token).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/auth/email-verification')
        .send({ token });

      expect(response.statusCode).toBe(200);
    });

    it('should not verify email with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/email-verification')
        .send({ token: 'invalid_token' });

      expect(response.statusCode).toBe(400);
    });

    it('should not sign in with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: MOCK_USER_EMAIL,
          password: 'wrong_password',
        });

      expect(response.statusCode).toBe(404);
    });

    it('should sign in and return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: MOCK_USER_EMAIL,
          password: MOCK_STRONG_PASSWORD,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      accessTokenUser = response.body.accessToken;
      refreshTokenUser = response.body.refreshToken;
    });

    it('should refresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ refreshToken: refreshTokenUser });

      expect(response.statusCode).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // Update tokens for future use
      accessTokenUser = response.body.accessToken;
      refreshTokenUser = response.body.refreshToken;
    });

    it('should not refresh token with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessTokenUser}`)
        .send({ refreshToken: 'invalid_refresh_token' });

      expect(response.statusCode).toBe(401);
    });

    it('should get user info', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/info')
        .set('Authorization', `Bearer ${accessTokenUser}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.email).toBe(MOCK_USER_EMAIL);
      expect(response.body.name).toBe(MOCK_DUPLICATE_NAME);
    });

    it('should logout', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessTokenUser}`);

      expect(response.statusCode).toBe(204);
    });

    it('should not allow access after logged out', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/info')
        .set('Authorization', `Bearer ${accessTokenUser}`);

      expect(response.statusCode).toBe(401);
    });

    describe('User Management', () => {
      let adminAccessToken: string;
      const adminUserId: number = 1;

      beforeAll(async () => {
        // Sign in as admin
        const response = await request(app.getHttpServer())
          .post('/auth/signin')
          .send({
            email: MOCK_ADMIN_EMAIL,
            password: MOCK_ADMIN_PASSWORD,
          });
        adminAccessToken = response.body.accessToken;
      });

      it('should get user list as admin', async () => {
        const response = await request(app.getHttpServer())
          .get('/user/admin/list')
          .query({ page: 0, limit: 10 })
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should update user role', async () => {
        const user = await userRepo.findOne({ email: MOCK_USER_EMAIL });

        const response = await request(app.getHttpServer())
          .patch('/user/admin/update-role')
          .query({ id: user.id, role: Role.ADMIN, isRemove: false })
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(response.statusCode).toBe(200);

        const updatedUser = await userRepo.findOne({ id: user.id });
        expect(updatedUser.role).toBe(Role.ADMIN);
      });

      it('should not allow caller to update self role', async () => {
        const response = await request(app.getHttpServer())
          .patch('/user/admin/update-role')
          .query({ id: adminUserId, role: Role.ADMIN })
          .set('Authorization', `Bearer ${adminAccessToken}`);

        expect(response.statusCode).toBe(400);
      });

      it('should not allow non-admin to update user role', async () => {
        const user = await userRepo.findOne({ email: MOCK_USER_EMAIL });

        const response = await request(app.getHttpServer())
          .patch('/user/admin/update-role')
          .query({ id: user.id, role: Role.ADMIN })
          .set('Authorization', `Bearer ${accessTokenUser}`);

        expect(response.statusCode).toBe(401);
      });
    });
  });

  describe('Password Management', () => {
    it('should initiate forgot password process', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: MOCK_USER_EMAIL });

      expect(response.statusCode).toBe(204);
    });

    it('should not initiate forgot password for non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.statusCode).toBe(404);
    });

    it('should not restore password with mismatched passwords', async () => {
      const tokenEntity = await tokenRepo.findOne({
        userId: 3,
      });
      const token = tokenEntity?.uuid;

      const response = await request(app.getHttpServer())
        .post('/auth/restore-password')
        .send({
          password: MOCK_RESTORED_PASSWORD,
          confirm: 'different_password',
          token: token,
        });

      expect(response.statusCode).toBe(400);
    });

    it('should restore password', async () => {
      const tokenEntity = await tokenRepo.findOne({ userId: 3 });
      const token = tokenEntity?.uuid;

      const response = await request(app.getHttpServer())
        .post('/auth/restore-password')
        .send({
          password: MOCK_RESTORED_PASSWORD,
          confirm: MOCK_RESTORED_PASSWORD,
          token: token,
        });

      expect(response.statusCode).toBe(204);
    });

    it('should not restore password with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/restore-password')
        .send({
          password: MOCK_RESTORED_PASSWORD,
          confirm: MOCK_RESTORED_PASSWORD,
          token: 'invalid_token',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('Two-Factor Authentication', () => {
    let userAccessToken: string;

    beforeAll(async () => {
      // Sign in as regular user
      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: MOCK_USER_EMAIL,
          password: MOCK_RESTORED_PASSWORD,
        });
      userAccessToken = response.body.accessToken;
    });

    it('should not verify invalid 2FA code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/authenticate-2fa')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ code: '000000' });

      expect(response.statusCode).toBe(401);
    });
  });
});
