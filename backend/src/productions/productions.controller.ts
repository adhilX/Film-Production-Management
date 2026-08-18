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
} from '@nestjs/common';
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
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('Productions Core')
@ApiBearerAuth('JWT-auth')
@Controller('productions')
@UseGuards(AuthGuard, PermissionsGuard)
@CheckProduction()
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
  @Permissions('productions.view')
  @ApiOperation({ summary: 'Fetch production details by ID (resource-scoped)' })
  @ApiResponse({ status: 200, description: 'Production document.' })
  findOne(@Param('id', new ParseObjectIdPipe('Invalid production ID format')) id: string) {
    return this.productionsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Update production details by ID (resource-scoped)' })
  @ApiResponse({ status: 200, description: 'Updated production document.' })
  update(
    @Param('id', new ParseObjectIdPipe('Invalid production ID format')) id: string,
    @Body() updateDto: UpdateProductionDto,
    @Req() req: any,
  ) {
    return this.productionsService.update(id, updateDto, req.user._id);
  }

  @Post(':productionId/cast-crew')
  @Permissions('productions.update')
  @ApiOperation({
    summary: 'Assign a user / contractor to a production cast-crew role',
  })
  @ApiResponse({ status: 201, description: 'Cast/Crew assignment saved.' })
  assignCastCrew(
    @Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string,
    @Body() assignDto: AssignCastCrewDto,
    @Req() req: any,
  ) {
    return this.productionsService.assignCastCrew(productionId, assignDto, req.user._id);
  }

  @Get(':productionId/cast-crew')
  @ApiOperation({
    summary: 'List assigned cast & crew members for a production',
  })
  @ApiResponse({ status: 200, description: 'Array of cast/crew mappings.' })
  getCastCrew(@Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string) {
    return this.productionsService.getCastCrew(productionId);
  }

  @Patch(':productionId/cast-crew/:castCrewId')
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Update a cast/crew assignment' })
  @ApiResponse({ status: 200, description: 'Updated assignment document.' })
  updateCastCrew(
    @Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string,
    @Param('castCrewId', new ParseObjectIdPipe('Invalid assignment ID format')) castCrewId: string,
    @Body() updateDto: UpdateCastCrewDto,
    @Req() req: any,
  ) {
    return this.productionsService.updateCastCrew(productionId, castCrewId, updateDto, req.user._id);
  }

  @Delete(':productionId/cast-crew/:castCrewId')
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Remove a cast/crew assignment' })
  @ApiResponse({ status: 200, description: 'Assignment removed.' })
  removeCastCrew(
    @Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string,
    @Param('castCrewId', new ParseObjectIdPipe('Invalid assignment ID format')) castCrewId: string,
    @Req() req: any,
  ) {
    return this.productionsService.removeCastCrew(productionId, castCrewId, req.user._id);
  }

  @Post(':productionId/characters')
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Create a script character entry for a production' })
  @ApiResponse({ status: 201, description: 'Script character created.' })
  createCharacter(
    @Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string,
    @Body() createDto: CreateCharacterDto,
    @Req() req: any,
  ) {
    return this.productionsService.createCharacter(productionId, createDto, req.user._id);
  }

  @Get(':productionId/characters')
  @ApiOperation({ summary: 'List script characters for a production' })
  @ApiResponse({ status: 200, description: 'Array of script characters.' })
  getCharacters(@Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string) {
    return this.productionsService.getCharacters(productionId);
  }

  @Patch(':productionId/characters/:characterId')
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Update a script character entry' })
  @ApiResponse({ status: 200, description: 'Script character updated.' })
  updateCharacter(
    @Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string,
    @Param('characterId', new ParseObjectIdPipe('Invalid character ID format')) characterId: string,
    @Body() updateDto: UpdateCharacterDto,
    @Req() req: any,
  ) {
    return this.productionsService.updateCharacter(productionId, characterId, updateDto, req.user._id);
  }

  @Delete(':productionId/characters/:characterId')
  @Permissions('productions.update')
  @ApiOperation({ summary: 'Delete a script character entry' })
  @ApiResponse({ status: 200, description: 'Script character deleted.' })
  deleteCharacter(
    @Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string,
    @Param('characterId', new ParseObjectIdPipe('Invalid character ID format')) characterId: string,
    @Req() req: any,
  ) {
    return this.productionsService.deleteCharacter(productionId, characterId, req.user._id);
  }

  @Get(':productionId/eligible-cast')
  @Permissions('productions.view')
  @ApiOperation({ summary: 'Get active, approved users eligible for cast assignment' })
  @ApiResponse({ status: 200, description: 'Array of eligible cast users.' })
  getEligibleCast(@Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string) {
    return this.productionsService.getEligibleCast(productionId);
  }

  @Get(':productionId/eligible-crew')
  @Permissions('productions.view')
  @ApiOperation({ summary: 'Get active, approved users eligible for crew assignment' })
  @ApiResponse({ status: 200, description: 'Array of eligible crew users.' })
  getEligibleCrew(@Param('productionId', new ParseObjectIdPipe('Invalid production ID format')) productionId: string) {
    return this.productionsService.getEligibleCrew(productionId);
  }
}
