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
import { Costume } from '../src/costumes/schemas/costume.schema';
import { CostumeAssignment } from '../src/costumes/schemas/costume-assignment.schema';
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';

describe('Costumes & Assets Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // Models
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let productionModel: any;
  let castCrewModel: any;
  let characterModel: any;
  let costumeModel: any;
  let assignmentModel: any;
  let auditLogModel: any;

  // Seeded Users
  let superAdminUser: any;
  let manager1: any;
  let manager2: any;
  let crewUser: any;
  let castUser1: any;
  let castUser2: any;

  // Seeded Productions
  let prod1: any;
  let prod2: any;

  // Seeded Characters
  let char1: any;
  let char2: any;

  // JWT Tokens
  let superAdminToken: string;
  let manager1Token: string;
  let manager2Token: string;
  let crewToken: string;

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
    costumeModel = mongoConnection.model(Costume.name);
    assignmentModel = mongoConnection.model(CostumeAssignment.name);
    auditLogModel = mongoConnection.model(AuditLog.name);

    // Clear db collections before seeding
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await characterModel.deleteMany({});
    await costumeModel.deleteMany({});
    await assignmentModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    const permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permCostumeView = await new permissionModel({ name: 'costumes.view', group: 'Costumes' }).save();
    const permCostumeCreate = await new permissionModel({ name: 'costumes.create', group: 'Costumes' }).save();
    const permCostumeUpdate = await new permissionModel({ name: 'costumes.update', group: 'Costumes' }).save();
    const permCostumeDelete = await new permissionModel({ name: 'costumes.delete', group: 'Costumes' }).save();

    // Create Roles
    const superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [
        permRolesManage._id,
        permCostumeView._id,
        permCostumeCreate._id,
        permCostumeUpdate._id,
        permCostumeDelete._id,
      ],
    }).save();

    const managerRole = await new roleModel({
      name: 'Production Manager',
      permissions: [
        permCostumeView._id,
        permCostumeCreate._id,
        permCostumeUpdate._id,
      ],
    }).save();

    const crewRole = await new roleModel({
      name: 'Crew',
      permissions: [permCostumeView._id],
    }).save();

    const castRole = await new roleModel({
      name: 'Cast',
      permissions: [permCostumeView._id],
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

    crewUser = await new userModel({
      email: 'crew@tendagon.com',
      passwordHash: 'hash',
      name: 'Crew User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: crewRole._id,
    }).save();

    castUser1 = await new userModel({
      email: 'cast1@tendagon.com',
      passwordHash: 'hash',
      name: 'Cast One',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: castRole._id,
    }).save();

    castUser2 = await new userModel({
      email: 'cast2@tendagon.com',
      passwordHash: 'hash',
      name: 'Cast Two',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: castRole._id,
    }).save();

    // Generate JWT Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    manager1Token = await jwtService.generateAccessToken({ userId: manager1._id.toString(), email: manager1.email });
    manager2Token = await jwtService.generateAccessToken({ userId: manager2._id.toString(), email: manager2.email });
    crewToken = await jwtService.generateAccessToken({ userId: crewUser._id.toString(), email: crewUser.email });

    // Create Productions
    prod1 = await new productionModel({
      title: 'Production One',
      status: 'Active',
      budget: 100000,
      productionManager: manager1._id,
    }).save();

    prod2 = await new productionModel({
      title: 'Production Two',
      status: 'Active',
      budget: 500000,
      productionManager: manager2._id,
    }).save();

    // Assign Roles in Production 1
    await new castCrewModel({ userId: manager1._id, productionId: prod1._id, roleInProduction: 'Production Manager' }).save();
    await new castCrewModel({ userId: crewUser._id, productionId: prod1._id, roleInProduction: 'Crew' }).save();
    await new castCrewModel({ userId: castUser1._id, productionId: prod1._id, roleInProduction: 'Cast' }).save();

    // Assign Roles in Production 2
    await new castCrewModel({ userId: manager2._id, productionId: prod2._id, roleInProduction: 'Production Manager' }).save();
    await new castCrewModel({ userId: castUser2._id, productionId: prod2._id, roleInProduction: 'Cast' }).save();

    // Create Characters
    char1 = await new characterModel({ name: 'Romeo', productionId: prod1._id }).save();
    char2 = await new characterModel({ name: 'Juliet', productionId: prod2._id }).save();
  });

  afterAll(async () => {
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await characterModel.deleteMany({});
    await costumeModel.deleteMany({});
    await assignmentModel.deleteMany({});
    await auditLogModel.deleteMany({});
    await app.close();
  });

  describe('Authentication & Route Guards Check', () => {
    it('Unauthenticated requests are blocked', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/costumes`)
        .expect(401);
    });

    it('Crew user can read costumes but cannot create, update or delete', async () => {
      // READ (Allowed)
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/costumes`)
        .set('Authorization', `Bearer ${crewToken}`)
        .expect(200);

      // CREATE (Blocked)
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ name: 'Spacesuit', category: 'Sci-Fi', quantity: 2 })
        .expect(403);

      // ASSIGN (Blocked)
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes/${new Types.ObjectId()}/assign`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ characterId: char1._id.toString(), quantity: 1, conditionAtAssignment: 'Good' })
        .expect(403);
    });
  });

  describe('Project Scoping Checks', () => {
    it('Manager 1 can manage Production 1 costumes, but cannot view/modify Production 2 costumes', async () => {
      // Manager 1 accessing Production 1 (Allowed)
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/costumes`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      // Manager 1 accessing Production 2 (Blocked)
      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}/costumes`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(403);
    });
  });

  describe('Costume CRUD Operations', () => {
    let costumeId: string;

    it('Manager 1 can create a costume in Production 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          name: 'Victorian Suit',
          category: 'Vintage',
          description: 'Dark grey suit',
          size: 'M',
          quantity: 3,
        })
        .expect(201);

      expect(res.body.name).toBe('Victorian Suit');
      expect(res.body.availableQuantity).toBe(3);
      costumeId = res.body._id;

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'COSTUME_CREATED' }).exec();
      expect(log).toBeDefined();
      expect(log.userId.toString()).toBe(manager1._id.toString());
      expect(log.resourceId.toString()).toBe(costumeId);
    });

    it('Duplicate names within the same production are blocked', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ name: 'Victorian Suit', category: 'Vintage', quantity: 2 })
        .expect(409);
    });

    it('Same costume name in a different production is allowed', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod2._id}/costumes`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({ name: 'Victorian Suit', category: 'Vintage', quantity: 2 })
        .expect(201);
    });

    it('Manager 1 can update costume details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/costumes/${costumeId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ description: 'Updated Description', quantity: 5 })
        .expect(200);

      expect(res.body.description).toBe('Updated Description');
      expect(res.body.quantity).toBe(5);
      expect(res.body.availableQuantity).toBe(5); // should adapt availableQuantity
    });

    it('Manager 1 cannot delete costume (Manager has no delete permission)', async () => {
      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/costumes/${costumeId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(403);
    });

    it('Super Admin can delete a costume when it has no assignments', async () => {
      const tempCostume = await new costumeModel({
        name: 'Temp Hat',
        category: 'Hat',
        quantity: 1,
        availableQuantity: 1,
        productionId: prod1._id,
        createdBy: superAdminUser._id,
      }).save();

      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/costumes/${tempCostume._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const log = await auditLogModel.findOne({ action: 'COSTUME_DELETED' }).exec();
      expect(log).toBeDefined();
    });
  });

  describe('Costume Assignment Workflow', () => {
    let costumeId: string;
    let assignmentId: string;

    beforeAll(async () => {
      // Find or create active costume
      const costume = await costumeModel.findOne({ name: 'Victorian Suit', productionId: prod1._id }).exec();
      costumeId = costume._id.toString();
    });

    it('Assignment requires XOR of characterId or userId', async () => {
      // Both characterId and userId provided (Invalid)
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes/${costumeId}/assign`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          characterId: char1._id.toString(),
          userId: castUser1._id.toString(),
          quantity: 1,
          conditionAtAssignment: 'Good',
        })
        .expect(400);

      // Neither characterId nor userId provided (Invalid)
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes/${costumeId}/assign`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          quantity: 1,
          conditionAtAssignment: 'Good',
        })
        .expect(400);
    });

    it('Assigning to a cross-project character is blocked', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes/${costumeId}/assign`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          characterId: char2._id.toString(), // Juliet is in Production 2
          quantity: 1,
          conditionAtAssignment: 'Good',
        })
        .expect(404); // returns 404 (Character not found in this production)
    });

    it('Successful assignment decreases available quantity', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes/${costumeId}/assign`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          characterId: char1._id.toString(),
          quantity: 2,
          conditionAtAssignment: 'New',
        })
        .expect(201);

      expect(res.body.status).toBe('Assigned');
      expect(res.body.quantity).toBe(2);
      assignmentId = res.body._id;

      // Verify costume stock decrease
      const costume = await costumeModel.findById(costumeId).exec();
      expect(costume.availableQuantity).toBe(3); // 5 - 2 = 3

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'COSTUME_ASSIGNED' }).exec();
      expect(log).toBeDefined();
    });

    it('Assignment exceeding available quantity is blocked', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/costumes/${costumeId}/assign`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          characterId: char1._id.toString(),
          quantity: 4, // exceeds available stock of 3
          conditionAtAssignment: 'Good',
        })
        .expect(400);
    });

    it('Active costume with active assignments cannot be deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/costumes/${costumeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(409);
    });

    it('Reducing quantity below assigned amount is blocked', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/costumes/${costumeId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ quantity: 1 }) // assigned quantity is 2
        .expect(400);
    });
  });

  describe('Costume Return Workflow', () => {
    let costumeId: string;
    let assignmentId: string;

    beforeAll(async () => {
      const costume = await costumeModel.findOne({ name: 'Victorian Suit', productionId: prod1._id }).exec();
      costumeId = costume._id.toString();

      const assignment = await assignmentModel.findOne({ costumeId: costume._id, status: 'Assigned' }).exec();
      assignmentId = assignment._id.toString();
    });

    it('Returning usable items increases available quantity', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/costumes/assignments/${assignmentId}/return`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          quantity: 1, // partial return: returned 1 out of 2
          conditionAtReturn: 'Good',
          notes: 'Returned in good condition',
        })
        .expect(200);

      // Verify assignment split / updates
      const updatedCostume = await costumeModel.findById(costumeId).exec();
      expect(updatedCostume.availableQuantity).toBe(4); // 3 + 1 = 4
      expect(updatedCostume.condition).toBe('Good');

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'COSTUME_RETURNED' }).exec();
      expect(log).toBeDefined();
    });

    it('Returning damaged items does NOT increase available quantity', async () => {
      // Find remaining assigned quantity (should be 1 remaining in the original assignment)
      const remainingAssignment = await assignmentModel.findOne({ costumeId: new Types.ObjectId(costumeId), status: 'Assigned' }).exec();
      const remainingId = remainingAssignment._id.toString();

      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/costumes/assignments/${remainingId}/return`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          quantity: 1,
          conditionAtReturn: 'Damaged',
          notes: 'Torn during performance',
        })
        .expect(200);

      // Verify costume availableQuantity is NOT incremented
      const updatedCostume = await costumeModel.findById(costumeId).exec();
      expect(updatedCostume.availableQuantity).toBe(4); // stays at 4 (the damaged one is not returned to available pool)
      expect(updatedCostume.condition).toBe('Damaged');
      expect(updatedCostume.status).toBe('Damaged');
    });

    it('Costumes with historical Returned assignments cannot be deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/costumes/${costumeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(409); // Cannot delete costume because it has assignment history
    });
  });

  describe('ID Safety & ObjectId Validation', () => {
    it('Malformed IDs return clean 400 Bad Request or 404', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/costumes/malformed-id`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(400);

      await request(app.getHttpServer())
        .get(`/productions/malformed-id/costumes`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(403); // AuthGuard throws 403 Forbidden for malformed productionId
    });
  });
});
