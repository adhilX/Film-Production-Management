import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '../src/common/jwt/jwt.service';
import { User } from '../src/users/schemas/user.schema';
import { UserProfile } from '../src/users/schemas/user-profile.schema';
import { Role } from '../src/auth/schemas/role.schema';
import { Permission } from '../src/auth/schemas/permission.schema';
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';
import { Production } from '../src/productions/schemas/production.schema';
import { CastCrew } from '../src/productions/schemas/cast-crew.schema';

describe('User Management Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // Models
  let userModel: any;
  let userProfileModel: any;
  let roleModel: any;
  let permissionModel: any;
  let auditLogModel: any;
  let productionModel: any;
  let castCrewModel: any;

  // Seeded Roles
  let superAdminRole: any;
  let prodAdminRole: any;
  let managerRole: any;
  let crewRole: any;

  // Seeded Users
  let superAdminUser: any;
  let prodAdminUser: any;
  let managerUser1: any; // manager on Project 1
  let managerUser2: any; // manager on Project 2
  let targetUser1: any; // assigned to Project 1
  let targetUser2: any; // assigned to Project 2

  // Tokens
  let superAdminToken: string;
  let prodAdminToken: string;
  let managerToken1: string;
  let managerToken2: string;
  let targetToken1: string;
  let crewTokenNoPerms: string;

  // Seeded Productions
  let project1: any;
  let project2: any;

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
    userProfileModel = mongoConnection.model(UserProfile.name);
    roleModel = mongoConnection.model(Role.name);
    permissionModel = mongoConnection.model(Permission.name);
    auditLogModel = mongoConnection.model(AuditLog.name);
    productionModel = mongoConnection.model(Production.name);
    castCrewModel = mongoConnection.model(CastCrew.name);

    // Clear db collections
    await userModel.deleteMany({});
    await userProfileModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await auditLogModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});

    // Seed Permissions
    const permView = await new permissionModel({ name: 'users.view', group: 'Admin' }).save();
    const permUpdate = await new permissionModel({ name: 'users.update', group: 'Admin' }).save();
    const permRoleManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permCreate = await new permissionModel({ name: 'users.create', group: 'Admin' }).save();
    const permApprove = await new permissionModel({ name: 'users.approve', group: 'Admin' }).save();

    // Seed Roles
    superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [permView._id, permUpdate._id, permRoleManage._id, permCreate._id, permApprove._id],
    }).save();

    prodAdminRole = await new roleModel({
      name: 'Production Admin',
      permissions: [permView._id, permUpdate._id], // no roles.manage
    }).save();

    managerRole = await new roleModel({
      name: 'Production Manager',
      permissions: [permView._id],
    }).save();

    crewRole = await new roleModel({
      name: 'Crew',
      permissions: [],
    }).save();

    // Seed Users
    superAdminUser = await new userModel({
      email: 'superadmin@tendagon.com',
      passwordHash: 'hash',
      name: 'Super Admin',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: superAdminRole._id,
    }).save();

    prodAdminUser = await new userModel({
      email: 'prodadmin@tendagon.com',
      passwordHash: 'hash',
      name: 'Production Admin',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: prodAdminRole._id,
    }).save();

    managerUser1 = await new userModel({
      email: 'manager1@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager One',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    managerUser2 = await new userModel({
      email: 'manager2@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager Two',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    targetUser1 = await new userModel({
      email: 'target1@tendagon.com',
      passwordHash: 'hash',
      name: 'Target One',
      contractorType: 'Cast',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewRole._id,
    }).save();

    targetUser2 = await new userModel({
      email: 'target2@tendagon.com',
      passwordHash: 'hash',
      name: 'Target Two',
      contractorType: 'Crew',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewRole._id,
    }).save();

    // Seed Profiles with PII
    await new userProfileModel({
      userId: targetUser1._id,
      department: 'Art Department',
      position: 'Designer',
      experience: ['Exp A'],
      phoneNumber: '111-222',
      bankDetails: { bankName: 'Bank A', accountNumber: '123' },
      taxFormUrl: 'http://tax.a',
      governmentIdType: 'SSN',
      identityDocs: ['doc.jpg'],
      signatureData: 'sign-data',
    }).save();

    await new userProfileModel({
      userId: targetUser2._id,
      department: 'Camera Department',
      position: 'Focus Puller',
      experience: ['Exp B'],
      phoneNumber: '333-444',
      bankDetails: { bankName: 'Bank B', accountNumber: '456' },
      taxFormUrl: 'http://tax.b',
      governmentIdType: 'Passport',
      identityDocs: ['doc2.jpg'],
      signatureData: 'sign-data-2',
    }).save();

    // Seed Productions
    project1 = await new productionModel({ title: 'Project One', description: 'Desc A' }).save();
    project2 = await new productionModel({ title: 'Project Two', description: 'Desc B' }).save();

    // Seed Assignments
    // Manager 1 on Project 1, Target 1 on Project 1
    await new castCrewModel({ userId: managerUser1._id, productionId: project1._id, roleInProduction: 'Production Manager' }).save();
    await new castCrewModel({ userId: targetUser1._id, productionId: project1._id, roleInProduction: 'Lead Actor' }).save();

    // Manager 2 on Project 2, Target 2 on Project 2
    await new castCrewModel({ userId: managerUser2._id, productionId: project2._id, roleInProduction: 'Production Manager' }).save();
    await new castCrewModel({ userId: targetUser2._id, productionId: project2._id, roleInProduction: 'Camera Op' }).save();

    // Generate Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    prodAdminToken = await jwtService.generateAccessToken({ userId: prodAdminUser._id.toString(), email: prodAdminUser.email });
    managerToken1 = await jwtService.generateAccessToken({ userId: managerUser1._id.toString(), email: managerUser1.email });
    managerToken2 = await jwtService.generateAccessToken({ userId: managerUser2._id.toString(), email: managerUser2.email });
    targetToken1 = await jwtService.generateAccessToken({ userId: targetUser1._id.toString(), email: targetUser1.email });
    crewTokenNoPerms = await jwtService.generateAccessToken({ userId: targetUser2._id.toString(), email: targetUser2.email });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication & Route Authorization', () => {
    it('should block unauthenticated requests with 401', async () => {
      await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should block users lacking users.view permission with 403', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${crewTokenNoPerms}`)
        .expect(403);
    });

    it('should grant access to users with users.view permission', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${managerToken1}`)
        .expect(200);

      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('total');
    });
  });

  describe('PII Exposure Protection', () => {
    it('should redact sensitive PII when third-party retrieves details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${managerToken1}`)
        .expect(200);

      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.bankDetails).toBeUndefined();
      expect(res.body.profile.taxFormUrl).toBeUndefined();
      expect(res.body.profile.governmentIdType).toBeUndefined();
      expect(res.body.profile.identityDocs).toBeUndefined();
      expect(res.body.profile.signatureData).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should expose all profile details on self-lookup', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${targetToken1}`)
        .expect(200);

      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.bankDetails).toBeDefined();
      expect(res.body.profile.taxFormUrl).toBeDefined();
    });
  });

  describe('Project/Production Scoping & IDOR prevention', () => {
    it('should limit assignments visible to a Production Manager to only projects they manage', async () => {
      // Manager 1 retrieves details for Target 1 (shares Project 1)
      const res1 = await request(app.getHttpServer())
        .get(`/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${managerToken1}`)
        .expect(200);

      expect(res1.body.assignments).toBeDefined();
      // Should see assignment on Project 1
      expect(res1.body.assignments.length).toBe(1);
      expect(res1.body.assignments[0].productionId._id.toString()).toBe(project1._id.toString());

      // Manager 2 retrieves details for Target 1 (doesn't share any project with Manager 2)
      const res2 = await request(app.getHttpServer())
        .get(`/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${managerToken2}`)
        .expect(200);

      expect(res2.body.assignments).toBeDefined();
      // Should see 0 assignments due to separation of production scoping
      expect(res2.body.assignments.length).toBe(0);
    });

    it('should let Super Admin see all assignments for a user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(res.body.assignments).toBeDefined();
      expect(res.body.assignments.length).toBe(1);
    });
  });

  describe('Privilege Escalation & Security Controls', () => {
    it('should prevent non-Super Admin (Production Admin) from promoting anyone to Super Admin', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({ systemRoleId: superAdminRole._id.toString() })
        .expect(403);
    });

    it('should allow Super Admin to assign the Super Admin role', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ systemRoleId: superAdminRole._id.toString() })
        .expect(200);

      // Revert role back for other tests
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ systemRoleId: crewRole._id.toString() })
        .expect(200);
    });

    it('should prevent users without roles.manage permission (like Production Admin) from modifying roles', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({ systemRoleId: managerRole._id.toString() })
        .expect(403);
    });

    it('should prevent a user from changing their own system role', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${superAdminUser._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ systemRoleId: crewRole._id.toString() })
        .expect(400);
    });

    it('should prevent a user from changing their own active status', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${superAdminUser._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false })
        .expect(400);
    });

    it('should prevent deactivating or role-changing the last active Super Admin', async () => {
      // Try deactivating the only Super Admin (superAdminUser)
      await request(app.getHttpServer())
        .patch(`/admin/users/${superAdminUser._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false })
        .expect(400);

      // Create a second active Super Admin to test deactivation of one of them
      const tempSuper = await new userModel({
        email: 'temp-super@tendagon.com',
        passwordHash: 'hash',
        name: 'Temp Super',
        isActive: true,
        onboardingStatus: 'approved',
        systemRoleId: superAdminRole._id,
      }).save();

      // Deactivating tempSuper should now be allowed since superAdminUser is still active
      await request(app.getHttpServer())
        .patch(`/admin/users/${tempSuper._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false })
        .expect(200);

      await userModel.deleteOne({ _id: tempSuper._id });
    });
  });

  describe('ObjectId Validation & Safety Checks', () => {
    it('should return 400 Bad Request on malformed ObjectId for details lookup', async () => {
      await request(app.getHttpServer())
        .get('/users/invalid-id-123')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request on malformed ObjectId for update operation', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/invalid-id-123')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Valid Name' })
        .expect(400);
    });

    it('should return 404 on lookups of nonexistent valid ObjectIds', async () => {
      const nonexistentId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/users/${nonexistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);
    });
  });

  describe('Search, Filters, Sorting & Pagination', () => {
    it('should support search and filter query parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ search: 'Target One', contractorType: 'Cast' })
        .expect(200);

      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].name).toBe('Target One');
    });

    it('should filter users by department', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ department: 'Camera Department' })
        .expect(200);

      expect(res.body.users.length).toBe(1);
      expect(res.body.users[0].name).toBe('Target Two');
    });

    it('should sort users correctly', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      const names = res.body.users.map((u: any) => u.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });
  });

  describe('Auditing Mutation Logging', () => {
    it('should generate appropriate audit log events on status or role modifications', async () => {
      // Perform role change
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser2._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ systemRoleId: managerRole._id.toString() })
        .expect(200);

      // Perform activation toggle
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser2._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false })
        .expect(200);

      // Fetch audit logs for Target 2
      const res = await request(app.getHttpServer())
        .get(`/users/${targetUser2._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const auditLogs = res.body.auditLogs;
      expect(auditLogs).toBeDefined();

      const actions = auditLogs.map((log: any) => log.action);
      expect(actions).toContain('USER_ROLE_CHANGED');
      expect(actions).toContain('USER_DEACTIVATED');
    });
  });

  describe('Hardening & Input Validation (Admin Operations)', () => {
    it('should throw 409 Conflict when creating a manual user with an already registered email', async () => {
      // superAdminUser email is: superadmin@tendagon.com
      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Manual User Duplicate',
          email: 'superadmin@tendagon.com',
          contractorType: 'Cast',
        })
        .expect(409);
    });

    it('should throw 400 Bad Request on malformed inputs for creating a manual user', async () => {
      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: '', // Empty name (should trigger validation error)
          email: 'invalid-email', // Malformed email
        })
        .expect(400);
    });

    it('should throw 400 Bad Request on malformed inputs for updating a manual user', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'not-an-email',
          isActive: 'not-a-boolean', // Should trigger 400
        })
        .expect(400);
    });

    it('should throw 400 Bad Request when an invalid format systemRoleId is supplied during user updates', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          systemRoleId: 'invalid-object-id-format',
        })
        .expect(400);
    });

    it('should throw 400 Bad Request when a non-existent but valid systemRoleId is supplied during user updates', async () => {
      const nonExistentRoleId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/admin/users/${targetUser1._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          systemRoleId: nonExistentRoleId,
        })
        .expect(400);
    });

    it('should throw 400 Bad Request on malformed query inputs for get-applications-query', async () => {
      await request(app.getHttpServer())
        .get('/admin/applications')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .query({
          page: -1, // Invalid page min
          sortOrder: 'invalid', // Invalid enum
        })
        .expect(400);
    });

    it('should throw 400 Bad Request on malformed inputs for evaluate-application', async () => {
      const nonExistentAppId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/admin/applications/${nonExistentAppId}/evaluate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'invalid-status-value', // Invalid status enum
        })
        .expect(400);
    });
  });
});

