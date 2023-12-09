export type Chat = {
  id: string;
  name: string;
  description: string;
  image: string;
  members?: User[];
}

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
}