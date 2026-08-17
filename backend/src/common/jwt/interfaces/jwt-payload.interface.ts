export interface JwtPayload {
  userId: string;
  email: string;
  systemRoleId?: string;
}
