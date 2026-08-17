import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { GENERAL_MESSAGES } from '../../common/constants/messages.constant';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.systemRole !== 'Admin') {
      throw new ForbiddenException(GENERAL_MESSAGES.FORBIDDEN);
    }

    return true;
  }
}
