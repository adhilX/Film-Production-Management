import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ProductionsService } from './productions.service';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { AssignCastCrewDto } from './dto/assign-cast-crew.dto';
import { UpdateCastCrewDto } from './dto/update-cast-crew.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { GetProductionsQueryDto } from './dto/get-productions-query.dto';
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
    const isAdmin =
      req.user.permissions?.includes('roles.manage') ||
      req.user.permissions?.includes('users.approve') ||
      false;
    return this.productionsService.create(createDto, req.user._id, isAdmin);
  }

  @Get()
  @Permissions('productions.view')
  @ApiOperation({
    summary: 'List film productions accessible by the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Array of accessible productions.' })
  findAll(@Query() query: GetProductionsQueryDto, @Req() req: any) {
    const isAdmin =
      req.user.permissions?.includes('roles.manage') ||
      req.user.permissions?.includes('users.approve') ||
      false;
    return this.productionsService.findAll(req.user._id, isAdmin, query);
  }

  @Get('managers')
  @Permissions('productions.view')
  @ApiOperation({ summary: 'List eligible active Production Managers' })
  @ApiResponse({
    status: 200,
    description: 'Array of eligible active Production Managers.',
  })
  findEligibleManagers() {
    return this.productionsService.findEligibleManagers();
  }

  @Get(':id')
  @CheckProduction()
  @Permissions('productions.view')
  @ApiOperation({ summary: 'Fetch production details by ID (resource-scoped)' })
  @ApiResponse({ status: 200, description: 'Production document.' })
  findOne(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.findOne(id);
  }

  @Patch(':id')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Update production details by ID (resource-scoped)' })
  @ApiResponse({ status: 200, description: 'Updated production document.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductionDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.update(id, updateDto, req.user._id);
  }


  @Post(':productionId/cast-crew')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({
    summary: 'Assign a user / contractor to a production cast-crew role',
  })
  @ApiResponse({ status: 201, description: 'Cast/Crew assignment saved.' })
  assignCastCrew(
    @Param('productionId') productionId: string,
    @Body() assignDto: AssignCastCrewDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.assignCastCrew(productionId, assignDto, req.user._id);
  }

  @Get(':productionId/cast-crew')
  @CheckProduction()
  @ApiOperation({
    summary: 'List assigned cast & crew members for a production',
  })
  @ApiResponse({ status: 200, description: 'Array of cast/crew mappings.' })
  getCastCrew(@Param('productionId') productionId: string) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.getCastCrew(productionId);
  }

  @Patch(':productionId/cast-crew/:castCrewId')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Update a cast/crew assignment' })
  @ApiResponse({ status: 200, description: 'Updated assignment document.' })
  updateCastCrew(
    @Param('productionId') productionId: string,
    @Param('castCrewId') castCrewId: string,
    @Body() updateDto: UpdateCastCrewDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(castCrewId)) {
      throw new BadRequestException('Invalid assignment ID format');
    }
    return this.productionsService.updateCastCrew(productionId, castCrewId, updateDto, req.user._id);
  }

  @Delete(':productionId/cast-crew/:castCrewId')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Remove a cast/crew assignment' })
  @ApiResponse({ status: 200, description: 'Assignment removed.' })
  removeCastCrew(
    @Param('productionId') productionId: string,
    @Param('castCrewId') castCrewId: string,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(castCrewId)) {
      throw new BadRequestException('Invalid assignment ID format');
    }
    return this.productionsService.removeCastCrew(productionId, castCrewId, req.user._id);
  }

  @Post(':productionId/characters')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Create a script character entry for a production' })
  @ApiResponse({ status: 201, description: 'Script character created.' })
  createCharacter(
    @Param('productionId') productionId: string,
    @Body() createDto: CreateCharacterDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.createCharacter(productionId, createDto, req.user._id);
  }

  @Get(':productionId/characters')
  @CheckProduction()
  @ApiOperation({ summary: 'List script characters for a production' })
  @ApiResponse({ status: 200, description: 'Array of script characters.' })
  getCharacters(@Param('productionId') productionId: string) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.getCharacters(productionId);
  }

  @Patch(':productionId/characters/:characterId')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Update a script character entry' })
  @ApiResponse({ status: 200, description: 'Script character updated.' })
  updateCharacter(
    @Param('productionId') productionId: string,
    @Param('characterId') characterId: string,
    @Body() updateDto: UpdateCharacterDto,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(characterId)) {
      throw new BadRequestException('Invalid character ID format');
    }
    return this.productionsService.updateCharacter(productionId, characterId, updateDto, req.user._id);
  }

  @Delete(':productionId/characters/:characterId')
  @CheckProduction()
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Delete a script character entry' })
  @ApiResponse({ status: 200, description: 'Script character deleted.' })
  deleteCharacter(
    @Param('productionId') productionId: string,
    @Param('characterId') characterId: string,
    @Req() req: any,
  ) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    if (!Types.ObjectId.isValid(characterId)) {
      throw new BadRequestException('Invalid character ID format');
    }
    return this.productionsService.deleteCharacter(productionId, characterId, req.user._id);
  }

  @Get(':productionId/eligible-cast')
  @CheckProduction()
  @Permissions('productions.view')
  @ApiOperation({ summary: 'Get active, approved users eligible for cast assignment' })
  @ApiResponse({ status: 200, description: 'Array of eligible cast users.' })
  getEligibleCast(@Param('productionId') productionId: string) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.getEligibleCast(productionId);
  }

  @Get(':productionId/eligible-crew')
  @CheckProduction()
  @Permissions('productions.view')
  @ApiOperation({ summary: 'Get active, approved users eligible for crew assignment' })
  @ApiResponse({ status: 200, description: 'Array of eligible crew users.' })
  getEligibleCrew(@Param('productionId') productionId: string) {
    if (!Types.ObjectId.isValid(productionId)) {
      throw new BadRequestException('Invalid production ID format');
    }
    return this.productionsService.getEligibleCrew(productionId);
  }
}

