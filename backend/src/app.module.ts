import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductionsModule } from './productions/productions.module';
import { LocationsModule } from './locations/locations.module';
import { FundsModule } from './funds/funds.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { JwtModule } from './common/jwt/jwt.module';

import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/film_production',
    ),
    JwtModule,
    AuthModule,
    UsersModule,
    AdminModule,
    ProductionsModule,
    LocationsModule,
    FundsModule,
    AuditLogsModule,
  ],
})
export class AppModule {}
