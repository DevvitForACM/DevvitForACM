// models/user.ts
export interface User {
  username: string;
  icon: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}
