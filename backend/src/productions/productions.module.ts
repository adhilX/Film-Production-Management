import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductionsService } from './productions.service';
import { ProductionsController } from './productions.controller';
import { Production, ProductionSchema } from './schemas/production.schema';
import { CastCrew, CastCrewSchema } from './schemas/cast-crew.schema';
import { Character, CharacterSchema } from './schemas/character.schema';
import { UsersModule } from '../users/users.module';
import { CastCrewService } from './services/cast-crew.service';
import { CharactersService } from './services/characters.service';
import { CastCrewEligibilityService } from './services/cast-crew-eligibility.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Production.name, schema: ProductionSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
      { name: Character.name, schema: CharacterSchema },
    ]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ProductionsController],
  providers: [ProductionsService, CastCrewService, CharactersService, CastCrewEligibilityService],
  exports: [MongooseModule, ProductionsService, CastCrewService, CharactersService, CastCrewEligibilityService],
})
export class ProductionsModule {}
