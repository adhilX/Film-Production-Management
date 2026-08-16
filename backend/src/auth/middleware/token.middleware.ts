import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '../../common/jwt/jwt.service';
import { User, UserDocument } from '../../users/schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(
    private readonly _jwtService: JwtService,
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this._jwtService.verifyAccessToken(token);
        const user = await this._userModel.findById(payload.userId).exec();
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (err) {
        // Soft token verification: invalid or expired token won't crash middleware, downstream guards or services will handle it
      }
    }
    next();
  }
}
