export type JwtPayload = {
  sub?: string;
  userid?: string;
  role?: string;
  jti?: string;
  [claim: string]: unknown;
};

export function decodeJwtPayload(token: string): JwtPayload | null;
