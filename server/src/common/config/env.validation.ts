import * as Joi from 'joi';

export const envValidator = Joi.object({
  // General
  NODE_ENV: Joi.string().default('development'),
  HOST: Joi.string().default('localhost'),
  PORT: Joi.string().default(3001),
  SESSION_SECRET: Joi.string().default('session_key'),
  POSTGRES_HOST: Joi.string().default('0.0.0.0'),
  POSTGRES_USER: Joi.string().default('app_user'),
  POSTGRES_PASSWORD: Joi.string().default('app_user_pwd'),
  POSTGRES_DB: Joi.string().default('app'),
  POSTGRES_PORT: Joi.string().default('3306'),

  // @important, default value
  // Auth
  JWT_SECRET: Joi.string().default('jwt_secret'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('1000000000000000'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('1000000000000000'),
});
