import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CostumesService } from './costumes.service';
import { CostumesController } from './costumes.controller';
import { Costume, CostumeSchema } from './schemas/costume.schema';
import { CostumeAssignment, CostumeAssignmentSchema } from './schemas/costume-assignment.schema';
import { ProductionsModule } from '../productions/productions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CostumeInventoryService } from './services/costume-inventory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Costume.name, schema: CostumeSchema },
      { name: CostumeAssignment.name, schema: CostumeAssignmentSchema },
    ]),
    ProductionsModule,
    AuditLogsModule,
  ],
  controllers: [CostumesController],
  providers: [CostumesService, CostumeInventoryService],
  exports: [MongooseModule, CostumesService, CostumeInventoryService],
})
export class CostumesModule {}
