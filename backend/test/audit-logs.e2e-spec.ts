import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';

describe('Audit Logs Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // DB Models for Seeding
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let productionModel: any;
  let castCrewModel: any;
  let auditLogModel: any;

  // Seeded Entities
  let superAdminUser: any;
  let prodAdmin1: any;
  let prodAdmin2: any;
  let crewUser: any;

  let prod1: any;
  let prod2: any;

  let superAdminToken: string;
  let prodAdmin1Token: string;
  let prodAdmin2Token: string;
  let crewToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    mongoConnection = app.get(getConnectionToken());
    jwtService = app.get(JwtService);

    // Get Models
    userModel = mongoConnection.model(User.name);
    roleModel = mongoConnection.model(Role.name);
    permissionModel = mongoConnection.model(Permission.name);
    productionModel = mongoConnection.model(Production.name);
    castCrewModel = mongoConnection.model(CastCrew.name);
    auditLogModel = mongoConnection.model(AuditLog.name);

    // Clear db collections before seeding
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    const permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permUsersApprove = await new permissionModel({ name: 'users.approve', group: 'Users' }).save();
    const permAuditLogsView = await new permissionModel({ name: 'audit_logs.view', group: 'Logs' }).save();

    // Create Roles
    const superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [permRolesManage._id, permAuditLogsView._id],
    }).save();

    const prodAdminRole = await new roleModel({
      name: 'Production Admin',
      permissions: [permUsersApprove._id, permAuditLogsView._id],
    }).save();

    const crewRole = await new roleModel({
      name: 'Crew',
      permissions: [],
    }).save();

    // Create Users
    superAdminUser = await new userModel({
      email: 'superadmin@tendagon.com',
      passwordHash: 'hash',
      name: 'Super Admin User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: superAdminRole._id,
    }).save();

    prodAdmin1 = await new userModel({
      email: 'prodadmin1@tendagon.com',
      passwordHash: 'hash',
      name: 'Prod Admin One',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: prodAdminRole._id,
    }).save();

    prodAdmin2 = await new userModel({
      email: 'prodadmin2@tendagon.com',
      passwordHash: 'hash',
      name: 'Prod Admin Two',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: prodAdminRole._id,
    }).save();

    crewUser = await new userModel({
      email: 'crew@tendagon.com',
      passwordHash: 'hash',
      name: 'Crew User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewRole._id,
    }).save();

    // Generate JWT Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    prodAdmin1Token = await jwtService.generateAccessToken({ userId: prodAdmin1._id.toString(), email: prodAdmin1.email });
    prodAdmin2Token = await jwtService.generateAccessToken({ userId: prodAdmin2._id.toString(), email: prodAdmin2.email });
    crewToken = await jwtService.generateAccessToken({ userId: crewUser._id.toString(), email: crewUser.email });

    // Create Productions
    prod1 = await new productionModel({
      title: 'Production Scoped One',
      status: 'Active',
      budget: 100000,
    }).save();

    prod2 = await new productionModel({
      title: 'Production Scoped Two',
      status: 'Active',
      budget: 200000,
    }).save();

    // Setup project assignments via CastCrew
    // ProdAdmin1 is assigned to Production 1
    await new castCrewModel({
      productionId: prod1._id,
      userId: prodAdmin1._id,
      roleInProduction: 'Production Admin',
      status: 'Active',
    }).save();

    // ProdAdmin2 is assigned to Production 2
    await new castCrewModel({
      productionId: prod2._id,
      userId: prodAdmin2._id,
      roleInProduction: 'Production Admin',
      status: 'Active',
    }).save();

    // Seed Audit Logs
    // 1. Global log (no productionId)
    await new auditLogModel({
      userId: superAdminUser._id,
      action: 'USER_CREATED',
      resourceId: prodAdmin1._id.toString(),
      resourceType: 'User',
      previousState: '',
      newState: 'Active',
      module: 'USERS',
      timestamp: new Date(Date.now() - 3600000 * 3), // 3 hours ago
      ipAddress: '192.168.1.1',
      metadata: { email: prodAdmin1.email },
    }).save();

    // 2. Production 1 log
    await new auditLogModel({
      userId: prodAdmin1._id,
      action: 'LOCATION_CREATED',
      resourceId: new Types.ObjectId().toString(),
      resourceType: 'Location',
      previousState: '',
      newState: 'Created',
      module: 'LOCATIONS',
      productionId: prod1._id,
      timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      ipAddress: '192.168.1.2',
      metadata: { name: 'Sunset Studio' },
    }).save();

    // 3. Production 2 log
    await new auditLogModel({
      userId: prodAdmin2._id,
      action: 'COSTUME_CREATED',
      resourceId: new Types.ObjectId().toString(),
      resourceType: 'Costume',
      previousState: '',
      newState: 'Created',
      module: 'COSTUMES',
      productionId: prod2._id,
      timestamp: new Date(Date.now() - 3600000 * 1), // 1 hour ago
      ipAddress: '192.168.1.3',
      metadata: { name: 'Leather Jacket' },
    }).save();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  describe('GET /audit-logs - Scoping, RBAC and IDOR Protection', () => {
    it('should reject requests without authorization token', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit-logs')
        .expect(401);
    });

    it('should reject requests from regular users lacking audit_logs.view permission', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(403);
    });

    it('should allow Super Admin to fetch all logs including global, prod1, and prod2 logs', async () => {
      // Clear any auto-generated permission denial logs
      await auditLogModel.deleteMany({ action: 'PERMISSION_DENIED' });

      const res = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.logs).toBeDefined();
      expect(res.body.logs.length).toBe(3);
      expect(res.body.total).toBe(3);
      expect(res.body.metrics.total).toBe(3);
    });

    it('should allow Production Admin 1 to fetch only their assigned production logs and global logs', async () => {
      // Clear any auto-generated permission denial logs
      await auditLogModel.deleteMany({ action: 'PERMISSION_DENIED' });

      const res = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${prodAdmin1Token}`)
        .expect(200);

      // Should return 2 logs: the global log and the Production 1 log (excludes Production 2)
      expect(res.body.logs).toBeDefined();
      expect(res.body.logs.length).toBe(2);
      expect(res.body.total).toBe(2);
      
      const containsProd2 = res.body.logs.some((log: any) => log.productionId === prod2._id.toString());
      expect(containsProd2).toBe(false);
    });

    it('should allow Production Admin 1 to filter by Production 1 specifically', async () => {
      const res = await request(app.getHttpServer())
        .get(`/audit-logs?productionId=${prod1._id.toString()}`)
        .set('Authorization', `Bearer ${prodAdmin1Token}`)
        .expect(200);

      expect(res.body.logs.length).toBe(1);
      expect(res.body.logs[0].productionId).toBe(prod1._id.toString());
    });

    it('should block Production Admin 1 from filtering by Production 2 (IDOR Protection)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/audit-logs?productionId=${prod2._id.toString()}`)
        .set('Authorization', `Bearer ${prodAdmin1Token}`)
        .expect(403);

      expect(res.body.message).toContain('Access denied');
    });

    it('should allow Super Admin to filter by any production', async () => {
      const res = await request(app.getHttpServer())
        .get(`/audit-logs?productionId=${prod2._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.logs.length).toBe(1);
      expect(res.body.logs[0].productionId).toBe(prod2._id.toString());
    });
  });

  describe('GET /audit-logs - Pagination, Sorting, Search and Validation', () => {
    it('should respect limit parameter and return pages metadata', async () => {
      // Clear any auto-generated permission denial logs
      await auditLogModel.deleteMany({ action: 'PERMISSION_DENIED' });

      const res = await request(app.getHttpServer())
        .get('/audit-logs?limit=1')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.logs.length).toBe(1);
      expect(res.body.pages).toBe(3);
      expect(res.body.total).toBe(3);
    });

    it('should reject invalid page and limit values with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/audit-logs?page=-1')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/audit-logs?limit=150')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });

    it('should reject invalid MongoId for productionId with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/audit-logs?productionId=invalid-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });

    it('should search logs by action name', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit-logs?search=LOCATION')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.logs.length).toBe(1);
      expect(res.body.logs[0].action).toBe('LOCATION_CREATED');
    });

    it('should search logs by actor user email/name', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit-logs?search=prodadmin1@tendagon.com')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.logs.length).toBe(1);
      expect(res.body.logs[0].userId.email).toBe('prodadmin1@tendagon.com');
    });

    it('should filter logs by module', async () => {
      const res = await request(app.getHttpServer())
        .get('/audit-logs?module=USERS')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.logs.length).toBe(1);
      expect(res.body.logs[0].module).toBe('USERS');
    });

    it('should sort logs by action ascending and descending', async () => {
      const resDesc = await request(app.getHttpServer())
        .get('/audit-logs?sortBy=action&sortOrder=desc')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const resAsc = await request(app.getHttpServer())
        .get('/audit-logs?sortBy=action&sortOrder=asc')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const descActions = resDesc.body.logs.map((log: any) => log.action);
      const ascActions = resAsc.body.logs.map((log: any) => log.action);

      expect(descActions[0]).toBe('USER_CREATED'); // U, L, C sorted desc
      expect(ascActions[0]).toBe('COSTUME_CREATED'); // C, L, U sorted asc
    });
  });
});
