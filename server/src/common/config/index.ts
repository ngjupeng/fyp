import mailConfig from './mail.config';
import databaseConfig from './database.config';
import authConfig from './auth.config';
import othersConfig from './others.config';
import serverConfig from './server.config';

export * from './env';
export * from './env.validation';

export { mailConfig, databaseConfig, authConfig, othersConfig, serverConfig };
