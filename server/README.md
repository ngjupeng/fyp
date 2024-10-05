# Base server implementation

this server implementation serves as a starting point for any server that uses the following tech stack:

- [NestJS](https://nestjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

it includes the basic functionality of:

- User management
- Registration and authentication
- Registration with referral code invitation
- Role based access control
- Email sending
- Database management and migrations

# Requirements

Before you begin, you need to install the following tools:

- [Node (v18.18.1)](https://nodejs.org/en/download/package-manager)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

# Getting Started

1. Clone the repository:
   ```sh
    git clone https://github.com/Quantum3-Labs/server-base.git
    cd server-base
   ```
2. Make sure to install all dependencies by running `npm install`
3. Make sure to set environment variable `NODE_ENV` whenever you open a new terminal by running `export NODE_ENV=development`, three options for `NODE_ENV`(development, production, test), this will decide which .env file to use, .env.development, .env.production or .env.test
4. Copy the `.env.example`, according to the mode, you need to run `cp .env.example .env.development`, `cp .env.example .env.production` or `cp .env.example .env.test`
5. Before spinning up a local database, make sure you don't have a running container with the same port that will be used by server base, these ports are `6500`, `5050` and `3001`, if you have either one of the ports in used, you can check [this section](#how-to-use-custom-port-for-server-base)
6. Make sure you have docker installed and running, then run `npm run docker:db:up`, it will spin up a local database
7. Finally, run `npm run start:dev` to start the dev server
8. Visit `http://localhost:3001/api-v1` to view a list of available endpoints

# Setting up the app name

Head to `src/common/constants/index.ts` and change the `APP` constant to your server name

# Setting up environment variables

see [example](./.env.example). This .env.example will work on a localhost with the minimum changes that need to applied to the .env file is the mailgun related api keys in order to run the server locally and passing the tests

## Important environment variables

- `REQUIRE_2FA`: Set to `true` to enforce two-factor authentication for all users, or `false` to make it optional, when it was `true`, only the endpoints with `@Public()` decorator, endpoints `/auth/gen-qr-code` and `/auth/authenticate-2fa` will be callable without 2fa check
- `ALLOWS_SANDBOX`: Set to `true` to enable testing endpoints, or `false` to hide them from swagger and disabled in production.
- `REQUIRE_SIGNUP_WITH_REFERRAL`: Set to `true` to require a referral code for new user signups, or `false` to allow signups without referrals.
- `REFERRAL_CODE_MAXIMUM_USAGE`: Specifies the maximum number of times a referral code can be used.
- `DEFAULT_ROLE`: Sets the default role for new users. If not set or set to a value other than "user", it will default to null.
- `FRONTEND_URL`: The URL of your frontend application, used for email verification links.
- `SERVER_URL`: The URL of your backend server.
- `ALLOWED_DOMAINS`: A list of allowed domains for CORS (Cross-Origin Resource Sharing).
- `MAILGUN_API_KEY`: The API key for your Mailgun account.
- `MAILGUN_DOMAIN`: The domain name for your Mailgun account.
- `ADMIN_EMAIL`: The email of the first user (admin) in the app.
- `ADMIN_PASSWORD`: The password of the first user (admin) in the app.

```bash
# production
cp .env.example .env.production

# development
cp .env.example .env.development

# test
cp .env.example .env.test
```

# Running the app

```bash
# development, make sure you have a local database running
npm run start:dev

# production mode
npm run start:prod
```

# [Development] Starting a local database

```bash
npm run docker:db:up
```

# [Development] Stopping a local database

```bash
npm run docker:db:down
```

# [Development] Migrations (Creating tables in database)

```bash
# create migration
npm run migration:create

# geneate migration from entities
npm run migration:generate

# run migrations
npm run migration:run
```

# [Testing] Running tests

```bash
# unit tests
npm run test

# test coverage
npm run test:cov

# e2e tests
# before running the test, make sure to run `npm run docker:db:down` to clear the db, because the test will use the same db as the local db
NODE_ENV=test npm run test:e2e
```

# [Production] Linter

```bash
npm run format
```

# Available Decorators

## `useGuards()`

- `JwtAuthGuard` will check if the user is authenticated, if environment variable `REQUIRE_2FA` is true, it will also check if the user has enabled two factor authentication
- `ReferralCodeGuard` will check env variable `REQUIRE_SIGNUP_WITH_REFERRAL`, if it is true, it will check if the user signup request body has a referral code in the request, if env variable `REQUIRE_SIGNUP_WITH_REFERRAL` is false, but referral code is present, it will throw an error
- `RoleGuard` will check if the user has the required role to access the endpoint

### Example Usage

@UseGuards(JwtAuthGuard)

## `@Public()`

- `@Public()` decorator to allow public access to certain endpoints without any authentication

## `@Roles()`

- `@Roles()` decorator to restrict access to users with specific roles

### Example Usage

@Roles([Role.ADMIN])

# Before pushing to Github

- Make sure the tests are pass by running `npm run test`
- Make sure e2e test pass by running `NODE_ENV=test npm run test:e2e`
- Make sure the linting doesn't throw any error by running `npm run lint`

❗ These are important in order to pass the github workflow

# Example of adding new tables in database

1. Create a new module by running `nest g module [module_name]`
2. Create a new entity file, for example, `[module_name].entity.ts`
3. Add wanted columns as needed, can use other module's entity file as reference
4. Add the entity class to `src/database/database.module.ts` `entities` array
5. Run `npm run migration:create`
6. Run `npm run migration:generate src/database/[migration_file_name]`
7. Move the generated migration file into location `src/database/migrations/`
8. Open the generated migration file, remove the prefix numbers of class name and also the `.` between `Migrations.ts`
9. If you want to reserve the existing tables and data, manually add the newly created migration file as record to table `migrations_typeorm` in your database and run `npm run migration:run`
10. Or you can run `npm run docker:db:down` then run `npm run docker:db:up`

# Default database status

When you spin up a local database, it automatically create five tables which are auths, migrations_typeorm, tokens, referral_codes and users

- `auths` table stored authorization token
- `migrations_typeorm` table stored the ready to run migration files are under `./src/database/migrations/*` when you run the command `npm run migration:run`
- `tokens` table stored the token that are used for email verification and forgot password
- `users` table stored all the user data
- `referral_codes` table stored all the referral codes that are created during user email verification and being used for signup when `REQUIRE_SIGNUP_WITH_REFERRAL` is true

## Things to notice of how sign up work in server base

1. After sign up, you need to verify yourself by email verification to update `users.status` from `PENDING` to `ACTIVE`, or you can use sandbox signup to skip this step
2. By default, the newly created user will have a default role, either `user` or `null` depending on env variable `DEFAULT_ROLE`, to assign a role, you need to login as admin by using credentials from `.env` file and call `/user/admin/update-role` to assign a role to new user
3. Meanwhile, the 2fa was disabled by default
4. By default, all endpoints are callable even if the user has no role, except some specific endpoints that only allow admin role, if you want the endpoints only callable by specific role, use the decorator `@Roles([Role.XXX])`

## Process to enable 2FA

- 2fa was disabled by default, you can still activate 2FA even the env variable `REQUIRE_2FA` is set to false
- After login, you can call the `/auth/gen-qr-code` to generate a QR code, then, you can use any authenticator such as google authenticator to scan the QR code, after scanning it, you will see the code on your phone, make sure the email you are using is same with the email login on your authenticator
- After you have the code, call the endpoint `/auth/authenticate-2fa`, this endpoint only need code as request body, the code is the code on your phone authenticator app, but when you call this endpoint, you might see `Invalid 2FA code` error, this is because you need to wait around 30-60 seconds after you get the code from authenticator app in order for the code to be valid (you can keep calling this endpoint until it was successful)
- After the 2fa was enabled, every time you login, the JWT access token will have the 2FA enabled flag with true
- If you want to disable the 2fa, you can call the endpoint `/auth/turn-off-2fa`

# How to use custom port for server base?

If you have either one of the ports in used, `6500`, `5050` or `3001`, depending on the port number, you need to perform different action

## Port 6500 in used

Port 6500 is used for database, if you already have port `6500` in used, you can customize the port by following the below instructions:

1. Locate file `./.env.example` if you not yet create a `.env.development`, `.env.test` or `.env.production`, change `POSTGRES_PORT` to the port you want, else, you can directly change `POSTGRES_PORT` in the env file you are using according

## Port 5050 in used

Port 5050 is used for `pgAdmin`, this is a management tool for PostgreSQL where you can visualize the database tables without running sql commands, if you already have port `5050` in used, you can customize the port by following the below instructions:

1. Locate file `./docker-compose.yaml`, change `- '5050:80'` under `pgAdmin` section to `- 'your-port:80'`

## Port 3001 in used

Port 3001 is used for server, if you already have port `3001` in used, you can customize the port by following the below instructions:

1. Locate file `./.env.example` if you not yet create a `.env.development`, `.env.test` or `.env.production`, change `PORT` to the port you want, else, you can directly change `PORT` in the env file you are using according
