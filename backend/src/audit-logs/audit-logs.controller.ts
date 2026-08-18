import { Controller, Get, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';
import { CastCrew, CastCrewDocument } from '../productions/schemas/cast-crew.schema';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('audit-logs')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    @InjectModel(CastCrew.name) private readonly castCrewModel: Model<CastCrewDocument>,
  ) {}

  @Get()
  @Permissions('audit_logs.view')
  @ApiOperation({
    summary:
      'Fetch compliance audit logs (requires audit_logs.view permission)',
  })
  @ApiResponse({ status: 200, description: 'Array of audit log entries.' })
  async findAll(@Query() query: GetAuditLogsQueryDto, @Req() req: any) {
    const user = req.user;
    const isSuperAdmin = user.permissions && user.permissions.includes('roles.manage');

    if (isSuperAdmin) {
      return this.auditLogsService.findAllPaginated({
        page: query.page,
        limit: query.limit,
        search: query.search,
        module: query.module,
        action: query.action,
        productionId: query.productionId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
    }

    // Production Admin / Scoped role
    const assignments = await this.castCrewModel.find({ userId: user._id }).exec();
    const assignedProductionIds = assignments.map(a => a.productionId);

    if (query.productionId) {
      let requestedProdId: Types.ObjectId;
      try {
        requestedProdId = new Types.ObjectId(query.productionId);
      } catch (e) {
        throw new ForbiddenException('Invalid Production ID format');
      }
      
      const isAllowed = assignedProductionIds.some(id => id.equals(requestedProdId));
      if (!isAllowed) {
        throw new ForbiddenException('Access denied: You are not assigned to this production');
      }

      return this.auditLogsService.findAllPaginated({
        page: query.page,
        limit: query.limit,
        search: query.search,
        module: query.module,
        action: query.action,
        productionId: query.productionId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        allowedProductionIds: assignedProductionIds,
      });
    }

    // No productionId requested, return logs for all assigned productions plus global logs
    return this.auditLogsService.findAllPaginated({
      page: query.page,
      limit: query.limit,
      search: query.search,
      module: query.module,
      action: query.action,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      allowedProductionIds: assignedProductionIds,
    });
  }
}

