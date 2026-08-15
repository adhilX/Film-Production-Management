import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductionsService } from './productions.service';
import { ProductionsController } from './productions.controller';
import { Production, ProductionSchema } from './schemas/production.schema';
import { CastCrew, CastCrewSchema } from './schemas/cast-crew.schema';
import { Character, CharacterSchema } from './schemas/character.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Production.name, schema: ProductionSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
      { name: Character.name, schema: CharacterSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ProductionsController],
  providers: [ProductionsService],
  exports: [ProductionsService],
})
export class ProductionsModule {}
