# Credit Pulse
A Digital Loan Origination &amp; Credit Assessment Platform.


## Technologies

- **Backend**:
    - **[NestJS](https://nestjs.com/)**: JS/TS Framework.
    - Postgres
    - MongoDB

- **Frontend**:
    - **[NextJS](https://nextjs.org/)**: React Framework.
    - Tailwind CSS

## Initial Setup

We are using `npm` as the default package manager, so after cloning the repository execute the following:

- Go to the `credit-pulse/backend` folder and execute the `npm install` command.
- Go to the `credit-pulse/frontend` folder and execute the same `npm install` command.

After this, you should have the `package-lock.json` files and the `node_modules` directory in both apps.

Move back to the project root directory and run both, frontend and backend, in a single command

```bash
npm run start:dev
```

This will run each app concurrently, and you can check the initial pages on ports 3000 (frontend) and 3001 (backend) in your
localhost environment.

```plainText
http://localhost:3000 #frontend - NextJS
http://localhost:3001 #backend - NestJS
```