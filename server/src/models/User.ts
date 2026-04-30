export interface IUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  goal?: string;
  level: number;
  xp: number;
  createdAt?: string;
}

// Ensure no Mongoose leftovers exist in the type system
export {};
