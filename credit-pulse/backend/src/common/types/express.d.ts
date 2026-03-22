import type { JwtPayload } from './jwtpayload.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

export {};
