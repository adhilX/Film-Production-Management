import { Module, Global, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { UsersModule } from '../users/users.module';
import { ProductionsModule } from '../productions/productions.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    UsersModule,
    forwardRef(() => ProductionsModule),
  ],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
  exports: [MongooseModule, AuditLogsService],
})
export class AuditLogsModule {}


