import { JwtPayload } from '../interfaces/jwt-payload.interface';

export class JwtPayloadDto implements JwtPayload {
  userId: string;
  email: string;
  systemRoleId?: string;
}
