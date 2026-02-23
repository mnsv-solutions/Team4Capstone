export type JwtPayload = {
  sub: string;
  email: string;
  role_id: string;
  iat?: number;
  exp?: number;
};
