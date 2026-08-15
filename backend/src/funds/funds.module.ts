import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FundsService } from './funds.service';
import { FundsController } from './funds.controller';
import { FundRequest, FundRequestSchema } from './schemas/fund-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FundRequest.name, schema: FundRequestSchema },
    ]),
  ],
  controllers: [FundsController],
  providers: [FundsService],
  exports: [FundsService],
})
export class FundsModule {}
