import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CostumesService } from './costumes.service';
import { CostumesController } from './costumes.controller';
import { Costume, CostumeSchema } from './schemas/costume.schema';
import { CostumeAssignment, CostumeAssignmentSchema } from './schemas/costume-assignment.schema';
import { Character, CharacterSchema } from '../productions/schemas/character.schema';
import { CastCrew, CastCrewSchema } from '../productions/schemas/cast-crew.schema';
import { Production, ProductionSchema } from '../productions/schemas/production.schema';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Costume.name, schema: CostumeSchema },
      { name: CostumeAssignment.name, schema: CostumeAssignmentSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
      { name: Production.name, schema: ProductionSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [CostumesController],
  providers: [CostumesService],
  exports: [CostumesService],
})
export class CostumesModule {}
