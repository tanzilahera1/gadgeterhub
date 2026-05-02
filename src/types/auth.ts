// src/types/auth.ts
export interface ILoginInput {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ISignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}
