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

describe('Cast & Crew Module (e2e)', () => {
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
  let manager1: any;
  let manager2: any;
  let cast1: any;
  let cast2: any;
  let crew1: any;
  let pendingUser: any;

  let prod1: any;
  let prod2: any;

  let superAdminToken: string;
  let manager1Token: string;
  let manager2Token: string;
  let cast1Token: string;
  let crew1Token: string;
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

    // Clear db
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await characterModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    const permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permUsersApprove = await new permissionModel({ name: 'users.approve', group: 'Admin' }).save();
    const permProdCreate = await new permissionModel({ name: 'productions.create', group: 'Productions' }).save();
    const permProdView = await new permissionModel({ name: 'productions.view', group: 'Productions' }).save();
    const permProdUpdate = await new permissionModel({ name: 'productions.update', group: 'Productions' }).save();

    // Create Roles
    const superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [
        permRolesManage._id,
        permUsersApprove._id,
        permProdCreate._id,
        permProdView._id,
        permProdUpdate._id
      ]
    }).save();

    const managerRole = await new roleModel({
      name: 'Production Manager',
      permissions: [
        permProdView._id,
        permProdUpdate._id
      ]
    }).save();

    const castRole = await new roleModel({
      name: 'Cast',
      permissions: [
        permProdView._id
      ]
    }).save();

    const crewRole = await new roleModel({
      name: 'Crew',
      permissions: [
        permProdView._id
      ]
    }).save();

    // Create Users
    superAdminUser = await new userModel({
      email: 'admin@tendagon.com',
      passwordHash: 'hash',
      name: 'Super Admin',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: superAdminRole._id,
    }).save();

    manager1 = await new userModel({
      email: 'manager1@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager One',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    manager2 = await new userModel({
      email: 'manager2@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager Two',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    cast1 = await new userModel({
      email: 'cast1@tendagon.com',
      passwordHash: 'hash',
      name: 'Cast One',
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: 'Cast',
      systemRoleId: castRole._id,
    }).save();

    cast2 = await new userModel({
      email: 'cast2@tendagon.com',
      passwordHash: 'hash',
      name: 'Cast Two',
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: 'Cast',
      systemRoleId: castRole._id,
    }).save();

    crew1 = await new userModel({
      email: 'crew1@tendagon.com',
      passwordHash: 'hash',
      name: 'Crew One',
      isActive: true,
      onboardingStatus: 'approved',
      contractorType: 'Crew',
      systemRoleId: crewRole._id,
    }).save();

    pendingUser = await new userModel({
      email: 'pending@tendagon.com',
      passwordHash: 'hash',
      name: 'Pending User',
      isActive: true,
      onboardingStatus: 'pending-review',
      systemRoleId: crewRole._id,
    }).save();

    // Generate JWT Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    manager1Token = await jwtService.generateAccessToken({ userId: manager1._id.toString(), email: manager1.email });
    manager2Token = await jwtService.generateAccessToken({ userId: manager2._id.toString(), email: manager2.email });
    cast1Token = await jwtService.generateAccessToken({ userId: cast1._id.toString(), email: cast1.email });
    crew1Token = await jwtService.generateAccessToken({ userId: crew1._id.toString(), email: crew1.email });
    pendingToken = await jwtService.generateAccessToken({ userId: pendingUser._id.toString(), email: pendingUser.email });

    // Create Productions
    prod1 = await new productionModel({
      title: 'Production One',
      status: 'Active',
      budget: 100000,
    }).save();

    prod2 = await new productionModel({
      title: 'Production Two',
      status: 'Active',
      budget: 500000,
    }).save();

    // Assign Manager 1 to Production 1
    await new castCrewModel({
      userId: manager1._id,
      productionId: prod1._id,
      roleInProduction: 'Production Manager',
    }).save();

    // Assign Manager 2 to Production 2
    await new castCrewModel({
      userId: manager2._id,
      productionId: prod2._id,
      roleInProduction: 'Production Manager',
    }).save();

    // Assign Cast 1 and Crew 1 to Production 1
    await new castCrewModel({
      userId: cast1._id,
      productionId: prod1._id,
      roleInProduction: 'Lead Actor',
    }).save();

    await new castCrewModel({
      userId: crew1._id,
      productionId: prod1._id,
      roleInProduction: 'Director of Photography',
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

  describe('Project-Level Access & 403 Scoping Checks', () => {
    it('Manager 1 can view production 1 cast-crew but not production 2', async () => {
      // Production 1
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/cast-crew`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      // Production 2 (should return 403)
      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}/cast-crew`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(403);
    });

    it('Super Admin can view any production cast-crew', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}/cast-crew`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('Pending user gets 403 due to Onboarding Gate', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/cast-crew`)
        .set('Authorization', `Bearer ${pendingToken}`)
        .expect(403);
    });
  });

  describe('Character CRUD & Validations', () => {
    let charId: string;

    it('Manager 1 can create character in Production 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/characters`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ name: 'Jake Sully', description: 'Na’vi Hero' })
        .expect(201);

      expect(res.body.name).toBe('Jake Sully');
      charId = res.body._id;

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'CHARACTER_CREATED' }).exec();
      expect(log).toBeDefined();
      expect(log.userId.toString()).toBe(manager1._id.toString());
      expect(log.resourceId.toString()).toBe(charId);
    });

    it('Manager 1 cannot create character in Production 2', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod2._id}/characters`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ name: 'Neytiri' })
        .expect(403);
    });

    it('Manager 1 can update character in Production 1', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/characters/${charId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ name: 'Jake Sully Updated' })
        .expect(200);

      expect(res.body.name).toBe('Jake Sully Updated');

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'CHARACTER_UPDATED' }).exec();
      expect(log).toBeDefined();
    });

    it('Manager 1 cannot update character with incorrect productionId', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod2._id}/characters/${charId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ name: 'Fake' })
        .expect(403);
    });
  });

  describe('Cast Assignment & Exclusivity Rules', () => {
    let characterA: any;
    let characterB: any;

    beforeAll(async () => {
      // Seed two characters
      characterA = await new characterModel({
        name: 'Iron Man',
        productionId: prod1._id,
        assignments: [],
      }).save();

      characterB = await new characterModel({
        name: 'Thor',
        productionId: prod1._id,
        assignments: [],
      }).save();
    });

    it('Assign Cast 1 to Iron Man works', async () => {
      // Find cast1 castCrew assignment
      const castCrewRecord = await castCrewModel.findOne({
        userId: cast1._id,
        productionId: prod1._id,
      }).exec();

      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/cast-crew/${castCrewRecord._id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ characterId: characterA._id.toString() })
        .expect(200);

      // Verify characterA assignments array contains cast1
      const updatedChar = await characterModel.findById(characterA._id).exec();
      expect(updatedChar.assignments).toContainEqual(cast1._id);

      // Verify castCrewRecord has characterId
      const updatedRecord = await castCrewModel.findById(castCrewRecord._id).exec();
      expect(updatedRecord.characterId.toString()).toBe(characterA._id.toString());
    });

    it('Assign Cast 2 to Iron Man is blocked by character exclusivity', async () => {
      // Create CastCrew record for Cast 2
      const castCrewRecord2 = await new castCrewModel({
        userId: cast2._id,
        productionId: prod1._id,
        roleInProduction: 'Supporting Actor',
      }).save();

      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/cast-crew/${castCrewRecord2._id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ characterId: characterA._id.toString() })
        .expect(400);

      expect(res.body.message).toContain('Character is already assigned');
    });

    it('POST duplicate cast assignment for the same user is blocked', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/cast-crew`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          userId: cast1._id.toString(),
          roleInProduction: 'Another Role',
          characterId: characterB._id.toString()
        })
        .expect(400);

      expect(res.body.message).toContain('User is already assigned to this project');
    });
  });

  describe('User Selection & Least-Privilege Endpoints', () => {
    it('GET eligible-cast returns only active, approved cast/freelancers with minimal details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/eligible-cast`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      const user = res.body[0];
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('avatar');
      // Verify no sensitive credentials / documents
      expect(user.passwordHash).toBeUndefined();
      expect(user.email).toBeUndefined();
    });

    it('GET eligible-crew returns only active, approved crew/freelancers with minimal details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/eligible-crew`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThan(0);
      const user = res.body[0];
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('avatar');
      expect(user.passwordHash).toBeUndefined();
    });
  });

  describe('Deletions & Safety checks', () => {
    it('Deleting a character clears references in CastCrew', async () => {
      // Seed a character and assign to crew1
      const tempChar = await new characterModel({
        name: 'Hulk',
        productionId: prod1._id,
        assignments: [],
      }).save();

      const crewRecord = await castCrewModel.findOne({
        userId: crew1._id,
        productionId: prod1._id,
      }).exec();

      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/cast-crew/${crewRecord._id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ characterId: tempChar._id.toString() })
        .expect(200);

      // Verify character deletion
      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/characters/${tempChar._id}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      // Verify reference is nullified in CastCrew
      const updatedCrew = await castCrewModel.findById(crewRecord._id).exec();
      expect(updatedCrew.characterId).toBeNull();
    });
  });
});
