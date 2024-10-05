export interface JwtPayload {
  email: string;
  userId: number;
  isTwoFaAuthenticated?: boolean;
}
