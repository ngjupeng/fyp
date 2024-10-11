import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { useContainer } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme } from 'swagger-themes';

import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { APP } from './common/constants';
import { AppConfigService } from './common/config/services/config.service';
import { ProjectService } from './modules/project/project.service';
import { RoundService } from './modules/round/round.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false,
  });
  const configService = app.get(ConfigService);
  const appConfigService = new AppConfigService(configService);

  app.enableCors({
    origin:
      appConfigService.nodeEnv == 'production'
        ? (origin, callback) => {
            if (!origin) {
              return callback(null, true);
            }
            if (
              appConfigService.otherConfig.allowedDomains &&
              appConfigService.otherConfig.allowedDomains
                .split(',')
                .includes(origin)
            ) {
              return callback(null, true);
            } else {
              return callback(new Error('Not allowed by CORS'));
            }
          }
        : true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  const sessionSecret = appConfigService.serverConfig.sessionSecret;

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    }),
  );

  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  const config = new DocumentBuilder()
    .setTitle(`${APP} API`)
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('api')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // here filtered out the sandbox endpoints, by checking the operationId(function name)
  const isAllowSandbox =
    appConfigService.otherConfig.allowsSandbox.toString() == 'false'
      ? false
      : true;

  if (!isAllowSandbox) {
    document.paths = Object.fromEntries(
      Object.entries(document.paths).filter(([_, methods]) => {
        return !Object.values(methods).some((method) => {
          return (
            method.operationId &&
            method.operationId.toLowerCase().includes('sandbox')
          );
        });
      }),
    );
  }

  const theme = new SwaggerTheme('v3');
  const optionsV1 = {
    explorer: true,
    customCss: theme.getBuffer('dark'),
  };
  const optionsV2 = {
    explorer: true,
    customCss: theme.getBuffer('classic'),
  };

  SwaggerModule.setup('api-v1', app, document, optionsV1);
  SwaggerModule.setup('api-v2', app, document, optionsV2);

  const host = appConfigService.serverConfig.host;
  const port = appConfigService.serverConfig.port;

  app.use(helmet());

  await app.listen(port, host, async () => {
    console.info(`API server is running on http://${host}:${port}`);

    // Get the ProjectService instance
    const projectService = app.get(ProjectService);

    // Call the watchProjectFinishEvent method
    await projectService.watchProjectFinishEvent();

    const roundService = app.get(RoundService);
    // await roundService.proceedToNextRound();
  });
}
bootstrap();
