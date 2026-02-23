# Credit Pulse

A Digital Loan Origination &amp; Credit Assessment Platform.

## Technologies

- **Backend**:
  - **[NestJS](https://nestjs.com/)**: JS/TS Framework.
  - Postgres
  - MongoDB

- **Frontend**:
  - **[NextJS](https://nextjs.org/)**: React Framework.
  - React Router
  - Tailwind CSS

## Initial Setup

### Using NPM

First, make sure that **[NodeJS](https://nodejs.org/en)** and **[NPM](https://www.npmjs.com/)** are installed and
working fine in your local environment.

_**It's recommended to use NodeJS version 20.9.0 (or higher) due the frameworks' minimum
requirements.**_

You can check if they're installed (and which version) by running the following commands in your terminal:

```bash
node --version
# if NodeJS is installed, it should print the current version. Example: "v25.4.0"

npm --version
# same logic applies here, if NPM is installed, the output should be the current version. Example: "11.7.0"
```

Now, execute the following commands (run one line at a time), to get the project running in development
mode:

```bash
# Clone the repository using only one of the following clone commands:
# for HTTPS:
git clone https://github.com/mnsv-solutions/Team4Capstone.git
# for SSH:
git clone git@github.com:mnsv-solutions/Team4Capstone.git

# After cloning... move your terminal working directory to the root dir:
cd Team4Capstone

# Now, inside the root directory, let's install the workspace dependencies:
npm install

# Lastly, you can to start both projects at the same time:
npm run start:dev
```

Notice that we have two distinct projects here within `credit-pulse` directory: `frontend` and `backend`.

The root level is set as a _npm workspace_, so that's why we run ` npm install` only once.

Moreover, the `start:dev` script will initialize both project using
[concurrently](https://www.npmjs.com/package/concurrently).

By default, the `frontend` and `backend` run on ports `3000` and `3001`, respectively.

Access these URLs in your browser and you should be able to see the applications running:

- http://localhost:3000 for NextJS - frontend.
- http://localhost:3001 for NestJS - backend.

---

### Using Docker

Make sure you have **[Docker](https://www.docker.com/)** installed and running in your local environment.

You can check if it's installed by running the following command in your terminal:

```bash
docker --version
# if Docker is installed, it should print the current version. Example: "Docker version 29.2.1, build a5c7197"
```

With docker running, you can build the image from one of the provided Dockerfiles:

```bash
# For development environment:
docker build -f Dockerfile.dev -t credit-pulse-dev .

# For production environment:
docker build -f Dockerfile.prod -t credit-pulse-prod .
```

_Observation: You can tag the image with any name you want, the names used above are just examples._
_If you change the image name, remember to use the same one when running the container in the next step._

After building the image, you can run a container from it:

```bash
# For development environment:
docker run -p 3000:3000 -p 3001:3001 credit-pulse-dev

# For production environment:
docker run -p 3000:3000 -p 3001:3001 credit-pulse-prod
```

By default, the `frontend` and `backend` run on ports `3000` and `3001`, respectively. The `-p` flag maps the container ports to your local machine ports.

Access these URLs in your browser and you should be able to see the applications running:

- http://localhost:3000 for NextJS - frontend.
- http://localhost:3001 for NestJS - backend.

## Development Guidelines

- Follow the coding style and conventions used in the existing codebase.
- Write clear and concise commit messages when pushing changes to the repository.
- Ensure that all new code is properly tested and does not break existing functionality.
- Communicate effectively with team members regarding any issues, questions, or updates related to the project

### Backend

- Use NestJS best practices for structuring modules, controllers, and services.
  - It's recommended to use the Nest CLI tool to generate the necessary files and maintain a consistent structure. Example: `nest generate module users`.
  - Files follows a lowercase naming convention with no hyphens or underscores. Example: `mycomponent.ts` instead of `my-component.ts` or `my_component.ts`.
  - Variables, functions, and methods should be named using camelCase. Example: `myVariable`, `myFunction()`, `myMethod()`.
  - Classes and interfaces should be named using PascalCase. Example: `MyClass`, `MyInterface`.
- Implement proper error handling and logging mechanisms.
- Write unit tests for critical components and services.
  - Run backend tests using: `npm run test:backend`
- Use environment variables for configuration and sensitive information. Use the `config-example.yaml` file inside `backend/config` as a reference.
- Always run the linter and formatter before committing code to maintain code quality and consistency.
  - Linting: `npm run lint:backend`
  - Formatting: `npm run format:backend`

## Team

This project is part of the Capstone course (PROG8751-26W-Sec1-Capstone) for the Web Development Program at
**[Conestoga College](https://www.conestogac.on.ca/)**.

Team members:

- **[Victor Ferreira Araujo](https://github.com/vict-devv)**
- **[Sukhpreet Singh](https://github.com/sukhpreet1616)**
- **[Nirali Dineshkumar Patel](https://github.com/niralipatel2107)**
- **[Miswa Shaileshbhai Patel](https://github.com/MiswaPatel)**
