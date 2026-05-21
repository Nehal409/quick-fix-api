import type { User } from '../types';

export function mockLogin(
  email: string,
  role: 'customer' | 'provider',
): { token: string; user: User } {
  const user: User = {
    id: 'mock-user-001',
    email,
    name: email.split('@')[0] ?? 'Test User',
    role,
  };
  return { token: 'mock-jwt-token-' + Date.now(), user };
}
