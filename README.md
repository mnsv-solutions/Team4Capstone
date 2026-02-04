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

We are using `npm` as the default package manager, so execute the following commands on your terminal (run one line at a time):

```bash
# Clone the repository using only one of the following clone commands:
# for HTTPS:
git clone https://github.com/mnsv-solutions/Team4Capstone.git
# for SSH:
git clone git@github.com:mnsv-solutions/Team4Capstone.git

# After cloning... move your terminal working directory to the root dir:
cd Team4Capstone

# Now, inside the root directory, let's install the workspoce dependencies:
npm install

# Lastly, you can to start both projects at the same time:
npm run start:dev
```

Notice that we have two distinct projects here within `credit-pulse` directory: `frontend` and `backend`.

The root level is set as a _npm workspace_, so that's why we run ` npm install` only once.

Moreover, the `start:dev` script will initialize both project using
[concurrently](https://www.npmjs.com/package/concurrently).

By default, the `frontend` and `backend` run on ports `3000` and `3001`, respectively.

Access these URLs in your browser and you should be able to see they running:
- http://localhost:3000 for NextJS - frontend.
- http://localhost:3001 for NestJS - backend.

---