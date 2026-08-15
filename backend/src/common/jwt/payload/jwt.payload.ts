import { JwtPayload } from '../interfaces/jwt-payload.interface';

export class JwtPayloadDto implements JwtPayload {
  sub: string;
  email: string;
  role: string;
}
