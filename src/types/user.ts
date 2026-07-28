export type Role = 'Admin' | 'Manager';

export type Identity = {
  id: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
};
