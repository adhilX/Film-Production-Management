import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundsService } from './funds.service';
import { FundsController } from './funds.controller';
import { FundRequest, FundRequestSchema } from './schemas/fund-request.schema';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { Production, ProductionSchema } from '../productions/schemas/production.schema';
import { CastCrew, CastCrewSchema } from '../productions/schemas/cast-crew.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FundRequest.name, schema: FundRequestSchema },
      { name: Budget.name, schema: BudgetSchema },
      { name: Production.name, schema: ProductionSchema },
      { name: CastCrew.name, schema: CastCrewSchema },
    ]),
  ],
  controllers: [FundsController],
  providers: [FundsService],
  exports: [FundsService],
})
export class FundsModule {}

