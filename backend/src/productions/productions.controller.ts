import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductionsService } from './productions.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { AssignCastCrewDto } from './dto/assign-cast-crew.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CheckProduction } from '../auth/decorators/check-production.decorator';

@ApiTags('Productions Core')
@ApiBearerAuth('JWT-auth')
@Controller('productions')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductionsController {
  constructor(private readonly productionsService: ProductionsService) {}

  @Post()
  @Permissions('productions.create')
  @ApiOperation({ summary: 'Create a new film production project' })
  @ApiResponse({ status: 201, description: 'Production created successfully.' })
  create(@Body() createDto: CreateProductionDto, @Req() req: any) {
    return this.productionsService.create(
      createDto,
      req.user._id,
      req.user.permissions?.includes('roles.manage') || false,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List film productions accessible by the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Array of accessible productions.' })
  findAll(@Req() req: any) {
    return this.productionsService.findAll(req.user._id, req.user.permissions?.includes('roles.manage') || false);
  }

  @Get(':id')
  @CheckProduction()
  @ApiOperation({ summary: 'Fetch production details by ID (resource-scoped)' })
  @ApiResponse({ status: 200, description: 'Production document.' })
  findOne(@Param('id') id: string) {
    return this.productionsService.findOne(id);
  }

  @Post(':productionId/cast-crew')
  @CheckProduction()
  @Permissions('productions.create')
  @ApiOperation({
    summary: 'Assign a user / contractor to a production cast-crew role',
  })
  @ApiResponse({ status: 201, description: 'Cast/Crew assignment saved.' })
  assignCastCrew(
    @Param('productionId') productionId: string,
    @Body() assignDto: AssignCastCrewDto,
  ) {
    return this.productionsService.assignCastCrew(productionId, assignDto);
  }

  @Get(':productionId/cast-crew')
  @CheckProduction()
  @ApiOperation({
    summary: 'List assigned cast & crew members for a production',
  })
  @ApiResponse({ status: 200, description: 'Array of cast/crew mappings.' })
  getCastCrew(@Param('productionId') productionId: string) {
    return this.productionsService.getCastCrew(productionId);
  }

  @Post(':productionId/characters')
  @CheckProduction()
  @Permissions('productions.create')
  @ApiOperation({ summary: 'Create a script character entry for a production' })
  @ApiResponse({ status: 201, description: 'Script character created.' })
  createCharacter(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateCharacterDto,
  ) {
    return this.productionsService.createCharacter(productionId, createDto);
  }

  @Get(':productionId/characters')
  @CheckProduction()
  @ApiOperation({ summary: 'List script characters for a production' })
  @ApiResponse({ status: 200, description: 'Array of script characters.' })
  getCharacters(@Param('productionId') productionId: string) {
    return this.productionsService.getCharacters(productionId);
  }
}
