import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundsService } from './funds.service';
import { FundsController } from './funds.controller';
import { FundRequest, FundRequestSchema } from './schemas/fund-request.schema';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { ProductionsModule } from '../productions/productions.module';
import { FundApprovalService } from './services/fund-approval.service';
import { BudgetService } from './services/budget.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FundRequest.name, schema: FundRequestSchema },
      { name: Budget.name, schema: BudgetSchema },
    ]),
    ProductionsModule,
  ],
  controllers: [FundsController],
  providers: [FundsService, FundApprovalService, BudgetService],
  exports: [MongooseModule, FundsService, FundApprovalService, BudgetService],
})
export class FundsModule {}

