import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '../src/common/jwt/jwt.service';
import { User } from '../src/users/schemas/user.schema';
import { Role } from '../src/auth/schemas/role.schema';
import { Permission } from '../src/auth/schemas/permission.schema';
import { Production } from '../src/productions/schemas/production.schema';
import { CastCrew } from '../src/productions/schemas/cast-crew.schema';
import { Character } from '../src/productions/schemas/character.schema';
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';

describe('Productions & Projects Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // DB Models for Seeding
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let productionModel: any;
  let castCrewModel: any;
  let characterModel: any;
  let auditLogModel: any;

  // Seeded Entities
  let superAdminUser: any;
  let prodAdminUser: any;
  let manager1: any;
  let manager2: any;
  let crewUser: any;
  let castUser: any;
  let crewNoViewUser: any;
  let pendingUser: any;

  let prod1: any;
  let prod2: any;

  let superAdminToken: string;
  let prodAdminToken: string;
  let manager1Token: string;
  let manager2Token: string;
  let crewToken: string;
  let castToken: string;
  let crewNoViewToken: string;
  let pendingToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mongoConnection = app.get(getConnectionToken());
    jwtService = app.get(JwtService);

    // Get Models
    userModel = mongoConnection.model(User.name);
    roleModel = mongoConnection.model(Role.name);
    permissionModel = mongoConnection.model(Permission.name);
    productionModel = mongoConnection.model(Production.name);
    castCrewModel = mongoConnection.model(CastCrew.name);
    characterModel = mongoConnection.model(Character.name);
    auditLogModel = mongoConnection.model(AuditLog.name);

    // Clear db collections before seeding
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await characterModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    const permProdView = await new permissionModel({ name: 'productions.view', group: 'Productions' }).save();
    const permProdCreate = await new permissionModel({ name: 'productions.create', group: 'Productions' }).save();
    const permProdUpdate = await new permissionModel({ name: 'productions.update', group: 'Productions' }).save();
    const permProdDelete = await new permissionModel({ name: 'productions.delete', group: 'Productions' }).save();
    const permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permUsersApprove = await new permissionModel({ name: 'users.approve', group: 'Admin' }).save();

    // Create Roles
    const superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [
        permProdView._id,
        permProdCreate._id,
        permProdUpdate._id,
        permProdDelete._id,
        permRolesManage._id,
        permUsersApprove._id,
      ],
    }).save();

    const managerRole = await new roleModel({
      name: 'Production Manager',
      permissions: [
        permProdView._id,
        permProdCreate._id,
        permProdUpdate._id,
      ],
    }).save();

    const crewRole = await new roleModel({
      name: 'Crew',
      permissions: [
        permProdView._id,
      ],
    }).save();

    const prodAdminRole = await new roleModel({
      name: 'Production Admin',
      permissions: [
        permProdView._id,
        permProdCreate._id,
        permProdUpdate._id,
        permUsersApprove._id,
      ],
    }).save();

    const castRole = await new roleModel({
      name: 'Cast',
      permissions: [
        permProdView._id,
      ],
    }).save();

    const crewNoViewRole = await new roleModel({
      name: 'Crew No View',
      permissions: [],
    }).save();

    // Create Users
    superAdminUser = await new userModel({
      email: 'admin-prod@tendagon.com',
      passwordHash: 'hash',
      name: 'Super Admin',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: superAdminRole._id,
    }).save();

    manager1 = await new userModel({
      email: 'pmanager1@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager One',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    manager2 = await new userModel({
      email: 'pmanager2@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager Two',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    crewUser = await new userModel({
      email: 'pcrew@tendagon.com',
      passwordHash: 'hash',
      name: 'Crew User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewRole._id,
    }).save();

    pendingUser = await new userModel({
      email: 'ppending@tendagon.com',
      passwordHash: 'hash',
      name: 'Pending User',
      isActive: true,
      onboardingStatus: 'pending-review',
      systemRoleId: crewRole._id,
    }).save();

    prodAdminUser = await new userModel({
      email: 'padmin@tendagon.com',
      passwordHash: 'hash',
      name: 'Prod Admin',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: prodAdminRole._id,
    }).save();

    castUser = await new userModel({
      email: 'pcast@tendagon.com',
      passwordHash: 'hash',
      name: 'Cast User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: castRole._id,
    }).save();

    crewNoViewUser = await new userModel({
      email: 'pcrewnoview@tendagon.com',
      passwordHash: 'hash',
      name: 'Crew No View User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewNoViewRole._id,
    }).save();

    // Generate JWT Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    prodAdminToken = await jwtService.generateAccessToken({ userId: prodAdminUser._id.toString(), email: prodAdminUser.email });
    manager1Token = await jwtService.generateAccessToken({ userId: manager1._id.toString(), email: manager1.email });
    manager2Token = await jwtService.generateAccessToken({ userId: manager2._id.toString(), email: manager2.email });
    crewToken = await jwtService.generateAccessToken({ userId: crewUser._id.toString(), email: crewUser.email });
    castToken = await jwtService.generateAccessToken({ userId: castUser._id.toString(), email: castUser.email });
    crewNoViewToken = await jwtService.generateAccessToken({ userId: crewNoViewUser._id.toString(), email: crewNoViewUser.email });
    pendingToken = await jwtService.generateAccessToken({ userId: pendingUser._id.toString(), email: pendingUser.email });

    // Create Productions
    prod1 = await new productionModel({
      title: 'Project A',
      status: 'Active',
      genre: 'Drama',
      budget: 100000,
      productionManager: manager1._id,
    }).save();

    prod2 = await new productionModel({
      title: 'Project B',
      status: 'Active',
      genre: 'Sci-Fi',
      budget: 200000,
      productionManager: manager2._id,
    }).save();

    // Assign manager1 to prod1
    await new castCrewModel({
      userId: manager1._id,
      productionId: prod1._id,
      roleInProduction: 'Production Manager',
    }).save();

    // Assign manager2 to prod2
    await new castCrewModel({
      userId: manager2._id,
      productionId: prod2._id,
      roleInProduction: 'Production Manager',
    }).save();

    // Assign crewUser to prod1
    await new castCrewModel({
      userId: crewUser._id,
      productionId: prod1._id,
      roleInProduction: 'Crew',
    }).save();

    // Assign castUser to prod1
    await new castCrewModel({
      userId: castUser._id,
      productionId: prod1._id,
      roleInProduction: 'Cast',
    }).save();

    // Assign crewNoViewUser to prod1
    await new castCrewModel({
      userId: crewNoViewUser._id,
      productionId: prod1._id,
      roleInProduction: 'Crew',
    }).save();
  });

  afterAll(async () => {
    // Clear DB
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await characterModel.deleteMany({});
    await auditLogModel.deleteMany({});

    await app.close();
  });

  describe('GET /productions Pagination & Metadata', () => {
    it('returns paginated structure when page and limit are query options', async () => {
      const res = await request(app.getHttpServer())
        .get('/productions?page=1&limit=1')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.productions).toBeDefined();
      expect(res.body.total).toBeDefined();
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(1);
      expect(res.body.pages).toBeDefined();
    });

    it('returns raw array when page and limit are missing', async () => {
      const res = await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Project Creation, Updates & Audit Logging', () => {
    it('creates a project and generates a PROJECT_CREATED audit log', async () => {
      const res = await request(app.getHttpServer())
        .post('/productions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Project Audit Test',
          description: 'A test project for audit logging',
          genre: 'Action',
          language: 'English',
          format: 'Feature Film',
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-09-30T00:00:00.000Z',
          budget: 50000,
          productionManager: manager1._id.toString(),
          status: 'Draft',
        })
        .expect(201);

      const prodId = res.body._id;

      // Verify audit log exists
      const log = await auditLogModel.findOne({
        action: 'PROJECT_CREATED',
      }).exec();

      expect(log).toBeDefined();
      expect(log.userId.toString()).toBe(superAdminUser._id.toString());
      expect(log.resourceId.toString()).toBe(prodId);
      expect(log.resourceType).toBe('Production');
    });

    it('updates a project and generates a PROJECT_UPDATED audit log', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'On Hold',
        })
        .expect(200);

      expect(res.body.status).toBe('On Hold');

      // Verify audit log exists
      const log = await auditLogModel.findOne({
        action: 'PROJECT_UPDATED',
      }).exec();

      expect(log).toBeDefined();
      expect(log.userId.toString()).toBe(superAdminUser._id.toString());
      expect(log.resourceId.toString()).toBe(prod1._id.toString());
    });
  });

  describe('Character Duplication Validation', () => {
    it('should allow creating a character name', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/characters`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          name: 'Sherlock Holmes',
          description: 'Famous detective',
        })
        .expect(201);
    });

    it('should block creating a character with duplicate name in the same production', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/characters`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          name: 'Sherlock Holmes',
          description: 'Another detective description',
        })
        .expect(400);

      expect(res.body.message).toContain('already exists in this project');
    });

    it('should allow creating a character with same name in a different production', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod2._id}/characters`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({
          name: 'Sherlock Holmes',
          description: 'Detective in project B',
        })
        .expect(201);
    });
  });

  describe('Character 404 Scoping & IDOR Prevention', () => {
    let prod1CharId: string;
    let prod2CharId: string;

    beforeAll(async () => {
      const char1 = await new characterModel({
        name: 'John Watson',
        description: 'Doctor Watson',
        productionId: prod1._id,
      }).save();
      prod1CharId = char1._id.toString();

      const char2 = await new characterModel({
        name: 'Moriarty',
        description: 'Villain',
        productionId: prod2._id,
      }).save();
      prod2CharId = char2._id.toString();
    });

    it('denies GET character details if mismatching productionId', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/characters/${prod2CharId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(404);
    });

    it('denies PATCH character if mismatching productionId', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/characters/${prod2CharId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ description: 'Updated Villain' })
        .expect(404);
    });

    it('denies DELETE character if mismatching productionId', async () => {
      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/characters/${prod2CharId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(404);
    });
  });

  describe('Cast/Crew Assignment 404 Scoping & IDOR Prevention', () => {
    let prod1AssignId: string;
    let prod2AssignId: string;

    beforeAll(async () => {
      const cc1 = await castCrewModel.findOne({
        userId: crewUser._id,
        productionId: prod1._id,
      }).exec();
      prod1AssignId = cc1._id.toString();

      const cc2 = await castCrewModel.findOne({
        userId: manager2._id,
        productionId: prod2._id,
      }).exec();
      prod2AssignId = cc2._id.toString();
    });

    it('denies PATCH cast-crew assignment if mismatching productionId', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/cast-crew/${prod2AssignId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ roleInProduction: 'Producer' })
        .expect(404);
    });

    it('denies DELETE cast-crew assignment if mismatching productionId', async () => {
      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/cast-crew/${prod2AssignId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(404);
    });
  });

  describe('RBAC & Scoping for General Routes (Crew, Cast, PM, Admin, Super Admin)', () => {
    it('Crew with productions.view can access assigned production and list assigned ones', async () => {
      // 1. Can list assigned productions
      const listRes = await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBe(1);
      expect(listRes.body[0]._id).toBe(prod1._id.toString());

      // 2. Can access assigned production details
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(200);
    });

    it('Crew without productions.view receives 403', async () => {
      await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${crewNoViewToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${crewNoViewToken}`)
        .expect(403);
    });

    it('Crew cannot access a production they are not assigned to', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}`)
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(403);
    });

    it('Crew cannot update production unless they have productions.update', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ status: 'Cancelled' })
        .expect(403);
    });

    it('Production Manager can access assigned production and gets scoped list', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBe(2);
      const returnedIds = listRes.body.map((p: any) => p._id);
      expect(returnedIds).toContain(prod1._id.toString());
      expect(returnedIds).not.toContain(prod2._id.toString());

      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(403);
    });

    it('Cast can access assigned production and gets scoped list', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${castToken}`)
        .expect(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBe(1);
      expect(listRes.body[0]._id).toBe(prod1._id.toString());

      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${castToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}`)
        .set('Authorization', `Bearer ${castToken}`)
        .expect(403);
    });

    it('Production Admin behavior remains unchanged (can list/view all productions)', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .expect(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThanOrEqual(2);

      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .expect(200);
    });

    it('Super Admin can access all productions', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/productions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      expect(listRes.body.length).toBeGreaterThanOrEqual(2);

      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('Invalid production IDs still return the expected validation error (403 for non-Admin, 400 for Admin)', async () => {
      // Non-Admin gets 403 from AuthGuard checks
      await request(app.getHttpServer())
        .get('/productions/invalid-id-format')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(403);

      // Admin gets 400 from ParseObjectIdPipe
      await request(app.getHttpServer())
        .get('/productions/invalid-id-format')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });
  });
});
