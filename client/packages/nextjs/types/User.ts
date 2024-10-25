export type User = {
  id: number;
  name: string;
  email: string;
  profilePicturePath: string;
  isVerified: boolean;
  role: string;
  address: string;
};

export type CurrentUser = {
  id: number;
  email: string;
  role: string;
  name: string;
  address: string;
};
