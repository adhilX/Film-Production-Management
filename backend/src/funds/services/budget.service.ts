import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types, ClientSession } from 'mongoose';
import { Budget, BudgetDocument } from '../schemas/budget.schema';
import { Production, ProductionDocument } from '../../productions/schemas/production.schema';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { getTransactionSession } from '../../common/utils/transaction.util';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(Budget.name)
    private budgetModel: Model<BudgetDocument>,
    @InjectModel(Production.name)
    private productionModel: Model<ProductionDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Retrieves or initializes the project budget.
   */
  async getOrCreateBudget(
    productionId: string,
    userId: string,
    session?: ClientSession | null,
  ): Promise<BudgetDocument> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }

    const budgetQuery = this.budgetModel.findOne({
      productionId: new Types.ObjectId(productionId),
    });
    let budget = session
      ? await budgetQuery.session(session).exec()
      : await budgetQuery.exec();

    if (!budget) {
      const prodQuery = this.productionModel.findById(productionId);
      const prod = session
        ? await prodQuery.session(session).exec()
        : await prodQuery.exec();

      if (!prod) {
        throw new NotFoundException(
          `Production with ID ${productionId} not found.`,
        );
      }

      // Convert initial project budget from main units to paise/cents
      const initialBudget = Math.round(prod.budget * 100);

      budget = new this.budgetModel({
        productionId: new Types.ObjectId(productionId),
        totalBudget: initialBudget,
        allocatedAmount: 0,
        remainingAmount: initialBudget,
        currency: 'INR',
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      if (session) {
        await budget.save({ session });
      } else {
        await budget.save();
      }
    }
    return budget;
  }

  /**
   * Updates the project budget.
   */
  async updateBudget(
    productionId: string,
    updateDto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetDocument> {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new NotFoundException(`Production with ID ${productionId} not found.`);
    }

    const session = await getTransactionSession(this.connection);
    try {
      const budget = await this.getOrCreateBudget(productionId, userId, session);

      if (updateDto.totalBudget < budget.allocatedAmount) {
        throw new BadRequestException(
          'Total budget cannot be less than already allocated amount.',
        );
      }

      const previousBudget = budget.totalBudget;
      budget.totalBudget = updateDto.totalBudget;
      budget.remainingAmount = budget.totalBudget - budget.allocatedAmount;
      budget.updatedBy = new Types.ObjectId(userId);
      if (updateDto.currency) {
        budget.currency = updateDto.currency;
      }

      if (session) {
        await budget.save({ session });
      } else {
        await budget.save();
      }

      // Write Audit Log
      await this.auditLogsService.log(
        userId,
        'BUDGET_UPDATED',
        budget._id.toString(),
        'Budget',
        JSON.stringify({ totalBudget: previousBudget }),
        JSON.stringify({ totalBudget: budget.totalBudget }),
        session || undefined,
        'FUNDS',
        { productionId },
      );

      if (session) {
        await session.commitTransaction();
      }
      return budget;
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }
}
