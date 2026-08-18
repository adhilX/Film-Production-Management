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
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';

describe('Roles & Permissions (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // DB Models for Seeding
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let auditLogModel: any;

  // Seeded Entities
  let superAdminUser: any;
  let prodAdminUser: any;
  let crewUser: any;

  // Roles
  let superAdminRole: any;
  let prodAdminRole: any;
  let crewRole: any;
  let customRole: any;

  // Permissions
  let permRolesView: any;
  let permRolesManage: any;
  let permUsersView: any;
  let permUsersApprove: any; // Prod Admin doesn't have this

  // JWT Tokens
  let superAdminToken: string;
  let prodAdminToken: string;
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
    auditLogModel = mongoConnection.model(AuditLog.name);
  });

  beforeEach(async () => {
    // Clear DB
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    permRolesView = await new permissionModel({ name: 'roles.view', group: 'Admin' }).save();
    permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    permUsersView = await new permissionModel({ name: 'users.view', group: 'Users' }).save();
    permUsersApprove = await new permissionModel({ name: 'users.approve', group: 'Users' }).save();

    // Create Core System Roles
    superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [permRolesView._id, permRolesManage._id, permUsersView._id, permUsersApprove._id],
    }).save();

    prodAdminRole = await new roleModel({
      name: 'Production Admin',
      permissions: [permRolesView._id, permRolesManage._id, permUsersView._id],
    }).save();

    crewRole = await new roleModel({
      name: 'Crew',
      permissions: [permUsersView._id],
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

    prodAdminUser = await new userModel({
      email: 'prodadmin@tendagon.com',
      passwordHash: 'hash',
      name: 'Prod Admin User',
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

    // Generate Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    prodAdminToken = await jwtService.generateAccessToken({ userId: prodAdminUser._id.toString(), email: prodAdminUser.email });
    crewToken = await jwtService.generateAccessToken({ userId: crewUser._id.toString(), email: crewUser.email });

    // Custom Role to test updates
    customRole = await new roleModel({
      name: 'Custom Contractor',
      permissions: [permUsersView._id],
    }).save();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  describe('AUTHENTICATION & AUTHORIZATION', () => {
    it('should return 401 if request has no token (Case 1)', async () => {
      await request(app.getHttpServer())
        .get('/admin/roles')
        .expect(401);
    });

    it('should return 403 if user lacks roles.view permission (Case 2)', async () => {
      await request(app.getHttpServer())
        .get('/admin/roles')
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(403);
    });

    it('should return 200 if user has roles.view permission (Case 3)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/roles')
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('ROLE CREATION', () => {
    it('should create valid custom role (Case 4)', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'My Custom Role',
          permissions: [permRolesView._id.toString()],
        })
        .expect(201);

      expect(res.body.name).toBe('My Custom Role');
      expect(res.body.permissions.length).toBe(1);
    });

    it('should reject invalid role payload (Case 5)', async () => {
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: '',
          permissions: [permRolesView._id.toString()],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Valid Name',
          permissions: 'not-an-array',
        })
        .expect(400);
    });

    it('should reject invalid permission ObjectId (Case 6)', async () => {
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Valid Name',
          permissions: ['invalid-objectid'],
        })
        .expect(400);
    });

    it('should reject nonexistent permission ID (Case 7)', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Valid Name',
          permissions: [nonExistentId],
        })
        .expect(400);
    });

    it('should reject duplicate custom role name case-insensitively (Case 8)', async () => {
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'custom contractor', // customRole exists as "Custom Contractor"
          permissions: [],
        })
        .expect(409);
    });

    it('should reject duplicate core role name (Case 9)', async () => {
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'super admin', // Case-insensitive core role check
          permissions: [],
        })
        .expect(409);
    });

    it('should reject role creation for unauthorized users (Case 10)', async () => {
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          name: 'Unauthorized Role',
          permissions: [],
        })
        .expect(403);
    });
  });

  describe('ROLE UPDATE', () => {
    it('should update valid custom role permissions (Case 11)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/roles/${customRole._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [permRolesView._id.toString(), permUsersView._id.toString()],
        })
        .expect(200);

      expect(res.body.permissions.length).toBe(2);
    });

    it('should reject invalid role ObjectId format (Case 12)', async () => {
      await request(app.getHttpServer())
        .patch('/admin/roles/invalid-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [],
        })
        .expect(400);
    });

    it('should return 404 for nonexistent role ID (Case 13)', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/admin/roles/${nonExistentId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [],
        })
        .expect(404);
    });

    it('should reject invalid permission ObjectId in update (Case 14)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/roles/${customRole._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: ['invalid-id'],
        })
        .expect(400);
    });

    it('should reject nonexistent permission ID in update (Case 15)', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .patch(`/admin/roles/${customRole._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [nonExistentId],
        })
        .expect(400);
    });
  });

  describe('SUPER ADMIN PROTECTION', () => {
    it('should prevent Production Admin from modifying Super Admin (Case 16)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/roles/${superAdminRole._id.toString()}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({
          permissions: [permRolesView._id.toString()],
        })
        .expect(403);
    });

    it('should prevent any user (including Super Admin) from modifying Super Admin permissions (Case 17, 18, 19, 20)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/roles/${superAdminRole._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [permRolesView._id.toString()],
        })
        .expect(403);
    });

    it('should prevent Production Admin from modifying other protected system roles (Case 20)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/roles/${crewRole._id.toString()}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({
          permissions: [],
        })
        .expect(403);
    });

    it('should allow Super Admin to modify system roles (other than Super Admin)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/roles/${crewRole._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [permUsersView._id.toString(), permRolesView._id.toString()],
        })
        .expect(200);

      expect(res.body.permissions.length).toBe(2);
    });
  });

  describe('PRIVILEGE ESCALATION', () => {
    it('should prevent Production Admin from granting permissions they do not possess (Case 21)', async () => {
      // Prod Admin does not have permUsersApprove
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({
          name: 'Privilege Escaped Role',
          permissions: [permUsersApprove._id.toString()],
        })
        .expect(403);
    });

    it('should prevent Production Admin from updating a role to include permissions they do not possess (Case 23, 24)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/roles/${customRole._id.toString()}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({
          permissions: [permUsersApprove._id.toString()],
        })
        .expect(403);
    });

    it('should prevent Production Admin from adding permissions to their own active role (Case 22, 25)', async () => {
      // Prod Admin role has permRolesView, permRolesManage, permUsersView.
      // Trying to add permUsersApprove (which they don't possess) to their own role.
      // Note: prodAdminRole is also protected as a core role, but we test the self-escalation logic specifically.
      await request(app.getHttpServer())
        .patch(`/admin/roles/${prodAdminRole._id.toString()}`)
        .set('Authorization', `Bearer ${prodAdminToken}`)
        .send({
          permissions: [permRolesView._id.toString(), permRolesManage._id.toString(), permUsersView._id.toString(), permUsersApprove._id.toString()],
        })
        .expect(403);
    });
  });

  describe('PERMISSION VALIDATION', () => {
    it('should correctly filter and remove duplicate permission IDs in payload (Case 26)', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Duplicate Filtered Role',
          permissions: [permRolesView._id.toString(), permRolesView._id.toString()],
        })
        .expect(201);

      expect(res.body.permissions.length).toBe(1);
    });

    it('should reject invalid permission references (Case 27, 28)', async () => {
      const badId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Bad Reference Role',
          permissions: [permRolesView._id.toString(), badId],
        })
        .expect(400);
    });
  });

  describe('PERMISSION CREATION', () => {
    it('should create valid permission (Case 29)', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'costumes.burn',
          description: 'Allows burning costumes',
          group: 'Custom Perms',
        })
        .expect(201);

      expect(res.body.name).toBe('costumes.burn');
    });

    it('should reject duplicate permission case-insensitively (Case 30)', async () => {
      await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'ROLES.VIEW', // roles.view already exists
          description: 'desc',
        })
        .expect(409);
    });

    it('should reject invalid permission payload (Case 31)', async () => {
      await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should reject permission creation for unauthorized users (Case 32)', async () => {
      await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          name: 'some.new.perm',
        })
        .expect(403);
    });
  });

  describe('AUDIT LOGGING', () => {
    it('should generate ROLE_CREATED log (Case 33)', async () => {
      await request(app.getHttpServer())
        .post('/admin/roles')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Logged Role',
          permissions: [],
        })
        .expect(201);

      const logs = await auditLogModel.find({ action: 'ROLE_CREATED' }).exec();
      expect(logs.length).toBe(1);
      expect(logs[0].userId.toString()).toBe(superAdminUser._id.toString());
    });

    it('should generate ROLE_UPDATED log containing previous/new permissions (Case 34, 36)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/roles/${customRole._id.toString()}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: [permRolesView._id.toString(), permUsersView._id.toString()],
        })
        .expect(200);

      const logs = await auditLogModel.find({ action: 'ROLE_UPDATED' }).exec();
      expect(logs.length).toBe(1);
      expect(logs[0].metadata.roleId).toBe(customRole._id.toString());
      expect(logs[0].metadata.previousPermissions).toBeDefined();
      expect(logs[0].metadata.newPermissions).toBeDefined();
    });

    it('should generate PERMISSION_CREATED log (Case 35)', async () => {
      await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'costumes.dye',
        })
        .expect(201);

      const logs = await auditLogModel.find({ action: 'PERMISSION_CREATED' }).exec();
      expect(logs.length).toBe(1);
    });
  });
});
