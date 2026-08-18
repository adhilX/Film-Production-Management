import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CostumesService } from './costumes.service';
import { CreateCostumeDto } from './dto/create-costume.dto';
import { UpdateCostumeDto } from './dto/update-costume.dto';
import { AssignCostumeDto } from './dto/assign-costume.dto';
import { ReturnCostumeDto } from './dto/return-costume.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CheckProduction } from '../auth/decorators/check-production.decorator';

@ApiTags('Costumes & Assets')
@ApiBearerAuth('JWT-auth')
@Controller('productions/:productionId/costumes')
@UseGuards(AuthGuard, PermissionsGuard)
@CheckProduction()
export class CostumesController {
  constructor(private readonly costumesService: CostumesService) {}

  // 1. GET ALL ASSIGNMENTS (registered before parameter routes like /:id to prevent collisions)
  @Get('assignments')
  @Permissions('costumes.view')
  @ApiOperation({ summary: 'Get all costume assignments for a production' })
  @ApiResponse({ status: 200, description: 'List of assignments.' })
  getAssignments(@Param('productionId') productionId: string) {
    return this.costumesService.getAssignments(productionId);
  }

  // 2. RETURN ASSIGNMENT
  @Patch('assignments/:assignmentId/return')
  @Permissions('costumes.update')
  @ApiOperation({ summary: 'Return a costume assignment' })
  @ApiResponse({ status: 200, description: 'Costume assignment returned successfully.' })
  returnCostume(
    @Param('productionId') productionId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() returnDto: ReturnCostumeDto,
    @Req() req: any,
  ) {
    return this.costumesService.return(productionId, assignmentId, returnDto, req.user._id);
  }

  // 3. CREATE COSTUME
  @Post()
  @Permissions('costumes.create')
  @ApiOperation({ summary: 'Create a new costume / asset' })
  @ApiResponse({ status: 201, description: 'Costume created successfully.' })
  create(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateCostumeDto,
    @Req() req: any,
  ) {
    return this.costumesService.create(productionId, createDto, req.user._id);
  }

  // 4. GET ALL COSTUMES (with search & filters)
  @Get()
  @Permissions('costumes.view')
  @ApiOperation({ summary: 'List all costumes for a production' })
  @ApiResponse({ status: 200, description: 'Array of costume documents.' })
  findAll(
    @Param('productionId') productionId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('search') search?: string,
  ) {
    return this.costumesService.findAll(productionId, status, category, condition, search);
  }

  // 5. GET SINGLE COSTUME
  @Get(':id')
  @Permissions('costumes.view')
  @ApiOperation({ summary: 'Get a costume details by ID' })
  @ApiResponse({ status: 200, description: 'Costume details.' })
  findOne(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
  ) {
    return this.costumesService.findOne(productionId, id);
  }

  // 6. UPDATE COSTUME
  @Patch(':id')
  @Permissions('costumes.update')
  @ApiOperation({ summary: 'Update a costume details' })
  @ApiResponse({ status: 200, description: 'Costume updated.' })
  update(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateCostumeDto,
    @Req() req: any,
  ) {
    return this.costumesService.update(productionId, id, updateDto, req.user._id);
  }

  // 7. DELETE COSTUME
  @Delete(':id')
  @Permissions('costumes.delete')
  @ApiOperation({ summary: 'Delete a costume from inventory' })
  @ApiResponse({ status: 200, description: 'Costume deleted.' })
  delete(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.costumesService.delete(productionId, id, req.user._id);
  }

  // 8. ASSIGN COSTUME TO CHARACTER OR CAST
  @Post(':id/assign')
  @Permissions('costumes.update')
  @ApiOperation({ summary: 'Assign a costume to a character or cast member' })
  @ApiResponse({ status: 201, description: 'Costume assigned successfully.' })
  assignCostume(
    @Param('productionId') productionId: string,
    @Param('id') id: string,
    @Body() assignDto: AssignCostumeDto,
    @Req() req: any,
  ) {
    return this.costumesService.assign(productionId, id, assignDto, req.user._id);
  }
}
