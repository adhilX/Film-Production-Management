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

describe('Dashboard Stats (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // Models for seeding
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let productionModel: any;

  // Seeded entities
  let superAdminUser: any;
  let crewUser: any;
  let superAdminRole: any;
  let crewRole: any;
  let permUsersApprove: any;
  let permUsersView: any;

  // Tokens
  let superAdminToken: string;
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

    userModel = mongoConnection.model(User.name);
    roleModel = mongoConnection.model(Role.name);
    permissionModel = mongoConnection.model(Permission.name);
    productionModel = mongoConnection.model(Production.name);
  });

  beforeEach(async () => {
    // Clean collections
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});

    // Seed permissions
    permUsersApprove = await new permissionModel({ name: 'users.approve', group: 'Users' }).save();
    permUsersView = await new permissionModel({ name: 'users.view', group: 'Users' }).save();

    // Seed roles
    superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [permUsersApprove._id, permUsersView._id],
    }).save();

    crewRole = await new roleModel({
      name: 'Crew',
      permissions: [permUsersView._id],
    }).save();

    // Seed users
    superAdminUser = await new userModel({
      email: 'admin@dashboard.com',
      passwordHash: 'hash',
      name: 'Dashboard Admin',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: superAdminRole._id,
    }).save();

    crewUser = await new userModel({
      email: 'crew@dashboard.com',
      passwordHash: 'hash',
      name: 'Dashboard Crew',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewRole._id,
    }).save();

    // Seed pending onboarding users
    const pending1 = await new userModel({
      email: 'pending1@dashboard.com',
      passwordHash: 'hash',
      name: 'Pending One',
      isActive: false,
      onboardingStatus: 'pending-review',
    }).save();

    await userModel.updateOne(
      { _id: pending1._id },
      { $set: { updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) } },
      { timestamps: false }
    );

    await new userModel({
      email: 'pending2@dashboard.com',
      passwordHash: 'hash',
      name: 'Pending Two',
      isActive: false,
      onboardingStatus: 'pending-review',
      updatedAt: new Date(), // Not urgent
    }).save();

    // Seed productions
    await new productionModel({
      title: 'Active Movie',
      genre: 'Action',
      language: 'English',
      format: 'Feature Film',
      status: 'Active',
    }).save();

    await new productionModel({
      title: 'Draft Script',
      genre: 'Drama',
      language: 'English',
      format: 'TV Show',
      status: 'Draft',
    }).save();

    await new productionModel({
      title: 'On Hold Film',
      genre: 'Sci-Fi',
      language: 'Spanish',
      format: 'Short Film',
      status: 'On Hold',
    }).save();

    // Tokens
    superAdminToken = await jwtService.generateAccessToken({
      userId: superAdminUser._id.toString(),
      email: superAdminUser.email,
    });

    crewToken = await jwtService.generateAccessToken({
      userId: crewUser._id.toString(),
      email: crewUser.email,
    });
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  describe('GET /admin/dashboard-stats', () => {
    it('should return 401 if token is missing', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard-stats')
        .expect(401);
    });

    it('should return 403 if user lacks users.approve permission', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard-stats')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(403);
    });

    it('should return 200 with correct statistics for authorized admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/dashboard-stats')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalProjects).toBe(3);
      expect(res.body.metrics.activeProjects).toBe(1);
      expect(res.body.metrics.totalUsers).toBe(4); // Admin, Crew, Pending1, Pending2
      expect(res.body.metrics.pendingApprovals).toBe(2);
      expect(res.body.metrics.urgentApprovals).toBe(1);

      // Verify trend structure
      expect(res.body.metrics.trends).toBeDefined();
      expect(typeof res.body.metrics.trends.projectsChange).toBe('string');
      expect(typeof res.body.metrics.trends.activeProjectsChange).toBe('string');
      expect(typeof res.body.metrics.trends.newUsersThisMonth).toBe('string');

      // Verify status distribution
      expect(res.body.statusDistribution).toBeDefined();
      expect(res.body.statusDistribution.active).toBe(1);
      expect(res.body.statusDistribution.draft).toBe(1);
      expect(res.body.statusDistribution.onHold).toBe(1);
      expect(res.body.statusDistribution.completed).toBe(0);

      // Verify sparklines contain 6 points
      expect(res.body.sparklines).toBeDefined();
      expect(res.body.sparklines.projects.length).toBe(6);
      expect(res.body.sparklines.active.length).toBe(6);
      expect(res.body.sparklines.users.length).toBe(6);
      expect(res.body.sparklines.approvals.length).toBe(6);
    });
  });

  describe('GET /users/me/dashboard-stats', () => {
    it('should return 401 if token is missing', async () => {
      await request(app.getHttpServer())
        .get('/users/me/dashboard-stats')
        .expect(401);
    });

    it('should return 200 with crew metrics for logged-in crew', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me/dashboard-stats')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.myProjectsCount).toBeDefined();
      expect(res.body.myRolesCount).toBeDefined();
      expect(res.body.upcomingCallsCount).toBeDefined();
      expect(res.body.totalWorkDays).toBeDefined();
      expect(res.body.completedTasks).toBeDefined();
      expect(res.body.myRoleAssignments).toBeInstanceOf(Array);
      expect(res.body.recentActivities).toBeInstanceOf(Array);
    });
  });
});
