# Credit Pulse - Backend

A Digital Loan Origination & Credit Assessment Platform API.

This project is an API server built with [NestJS](https://nestjs.com/) and [Prisma](https://www.prisma.io/).

## Requirements

Ensure PostgreSQL and MongoDB are available or you can use the provided Docker dev setup at the root.

## Getting Started

First, install dependencies from the root of the project:

```bash
npm install
```

Start the development server from the root of the project:

```bash
npm run start:local:backend
# or run the entire application
npm run start:local
```

Access the API at [http://localhost:3001](http://localhost:3001).

## Database & Prisma Commands

From the root project, you can manage the Prisma ORM with the following npm scripts:

- `npm run prisma:generate` - Generates the Prisma Client.
- `npm run prisma:migrate` - Deploys pending migrations.
- `npm run prisma:seed` - Seeds the database with initial data.
- `npm run prisma:migrate:reset` - Resets the database and reapplies migrations.
- `npm run prisma:validate` - Validates the Prisma schema.
- `npm run prisma:format` - Formats the Prisma schema.

Each command has a `:prod` suffix to run it in the exact same way but setting `NODE_ENV=prod`, e.g., `npm run prisma:migrate:reset:prod`.

## Linting, Formatting & Testing

- `npm run format:backend` - Formats the code using Prettier.
- `npm run lint:backend` - Lints the codebase with ESLint.
- `npm run test:backend` - Runs the test suite via Jest.

## Continuous Integration

The backend is validated through GitHub Actions for:
- Code Linting
- Code Formatting validation
These checks run automatically on Pull Requests to ensure code quality.
