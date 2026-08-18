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
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? (process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/film_production_test')
        : (process.env.MONGO_URI || 'mongodb://localhost:27017/film_production'),
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
