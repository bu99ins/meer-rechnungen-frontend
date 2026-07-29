export const ROLES = ['Admin', 'Manager'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return (ROLES as readonly string[]).includes(value as string);
}

export type Identity = {
  id: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
};

export type UserSummary = {
  id: string;
  email: string;
};

export type LookedUpUser = {
  id: string;
  email: string;
  role: Role | null;
};
