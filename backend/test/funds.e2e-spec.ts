import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '../src/common/jwt/jwt.service';
import { User } from '../src/users/schemas/user.schema';
import { Role } from '../src/auth/schemas/role.schema';
import { Permission } from '../src/auth/schemas/permission.schema';
import { Production } from '../src/productions/schemas/production.schema';
import { CastCrew } from '../src/productions/schemas/cast-crew.schema';
import { Budget } from '../src/funds/schemas/budget.schema';
import { FundRequest } from '../src/funds/schemas/fund-request.schema';
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';

describe('Funds & Budget Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // DB Models for Seeding
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let productionModel: any;
  let castCrewModel: any;
  let budgetModel: any;
  let fundRequestModel: any;
  let auditLogModel: any;

  // Seeded Entities
  let superAdminUser: any;
  let manager1: any;
  let manager2: any;
  let crewUser: any;

  let prod1: any;
  let prod2: any;

  let superAdminToken: string;
  let manager1Token: string;
  let manager2Token: string;
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
    budgetModel = mongoConnection.model(Budget.name);
    fundRequestModel = mongoConnection.model(FundRequest.name);
    auditLogModel = mongoConnection.model(AuditLog.name);

    // Clear db collections before seeding
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await budgetModel.deleteMany({});
    await fundRequestModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    const permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permFundsView = await new permissionModel({ name: 'funds.view', group: 'Funds' }).save();
    const permFundsCreate = await new permissionModel({ name: 'funds.create', group: 'Funds' }).save();
    const permFundsUpdate = await new permissionModel({ name: 'funds.update', group: 'Funds' }).save();
    const permFundsApprove = await new permissionModel({ name: 'funds.approve', group: 'Funds' }).save();

    // Create Roles
    const superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [
        permRolesManage._id,
        permFundsView._id,
        permFundsCreate._id,
        permFundsUpdate._id,
        permFundsApprove._id,
      ],
    }).save();

    const managerRole = await new roleModel({
      name: 'Production Manager',
      permissions: [
        permFundsView._id,
        permFundsCreate._id,
        permFundsUpdate._id,
        permFundsApprove._id,
      ],
    }).save();

    const crewRole = await new roleModel({
      name: 'Crew',
      permissions: [
        permFundsView._id,
        permFundsCreate._id,
      ],
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

    // Generate JWT Tokens
    superAdminToken = await jwtService.generateAccessToken({ userId: superAdminUser._id.toString(), email: superAdminUser.email });
    manager1Token = await jwtService.generateAccessToken({ userId: manager1._id.toString(), email: manager1.email });
    manager2Token = await jwtService.generateAccessToken({ userId: manager2._id.toString(), email: manager2.email });
    crewToken = await jwtService.generateAccessToken({ userId: crewUser._id.toString(), email: crewUser.email });

    // Create Productions
    prod1 = await new productionModel({
      title: 'Production One',
      status: 'Active',
      budget: 100000, // 100,000.00
      productionManager: manager1._id,
    }).save();

    prod2 = await new productionModel({
      title: 'Production Two',
      status: 'Active',
      budget: 200000, // 200,000.00
      productionManager: manager2._id,
    }).save();

    // Add manager1 and crewUser to production 1 cast & crew membership
    await new castCrewModel({
      productionId: prod1._id,
      userId: manager1._id,
      roleInProduction: 'Production Manager',
      status: 'Active',
    }).save();

    await new castCrewModel({
      productionId: prod1._id,
      userId: crewUser._id,
      roleInProduction: 'Crew',
      status: 'Active',
    }).save();

    // Add manager2 to production 2 cast & crew membership
    await new castCrewModel({
      productionId: prod2._id,
      userId: manager2._id,
      roleInProduction: 'Production Manager',
      status: 'Active',
    }).save();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await app.close();
  });

  describe('Budget endpoints', () => {
    it('should initialize a budget automatically on GET budget if not existing', async () => {
      const res = await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/funds/budget`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      expect(res.body).toHaveProperty('productionId', prod1._id.toString());
      expect(res.body).toHaveProperty('totalBudget', 10000000); // from Production model
      expect(res.body).toHaveProperty('allocatedAmount', 0);
      expect(res.body).toHaveProperty('remainingAmount', 10000000);
    });

    it('should update the total budget limit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/budget`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ totalBudget: 15000000, currency: 'INR' })
        .expect(200);

      expect(res.body.totalBudget).toBe(15000000);
      expect(res.body.remainingAmount).toBe(15000000);
    });

    it('should reject budget updates if total budget is less than allocated amount', async () => {
      // First seed a request that allocates money
      const budgetObj = await budgetModel.findOne({ productionId: prod1._id });
      budgetObj.allocatedAmount = 500000;
      await budgetObj.save();

      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/budget`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ totalBudget: 400000 })
        .expect(400);
    });
  });

  describe('Fund Request submission', () => {
    let requestId: string;

    it('should submit a valid fund request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          title: 'Camera Equipment Rental',
          description: 'Weekly rental of RED V-Raptor package.',
          category: 'Equipment',
          requestedAmount: 200000, // 2,000.00
        })
        .expect(201);

      expect(res.body).toHaveProperty('status', 'Pending');
      expect(res.body).toHaveProperty('requestedAmount', 200000);
      requestId = res.body._id;
    });

    it('should reject invalid amount inputs (negative, floating-point)', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          title: 'Logistics',
          description: 'Catering transport costs.',
          category: 'Logistics',
          requestedAmount: -100,
        })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          title: 'Logistics',
          description: 'Catering transport costs.',
          category: 'Logistics',
          requestedAmount: 1500.5,
        })
        .expect(400);
    });

    it('should edit a pending request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/requests/${requestId}`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          title: 'Camera & Lens Rental',
          requestedAmount: 250000,
        })
        .expect(200);

      expect(res.body.title).toBe('Camera & Lens Rental');
      expect(res.body.requestedAmount).toBe(250000);
    });
  });

  describe('Review flow & Atomic transaction approvals', () => {
    it('should reject and require a reason', async () => {
      // Create request
      const reqRes = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          title: 'Catering Day 1',
          description: 'Lunch for 50 people on set.',
          category: 'Catering',
          requestedAmount: 100000,
        });

      const reqId = reqRes.body._id;

      // Reject without reason
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/requests/${reqId}/reject`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({})
        .expect(400);

      // Reject with reason
      const rejectRes = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/requests/${reqId}/reject`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ rejectionReason: 'Catering cost is too high. Seek local provider.' })
        .expect(200);

      expect(rejectRes.body.status).toBe('Rejected');
      expect(rejectRes.body.rejectionReason).toBe('Catering cost is too high. Seek local provider.');
    });

    it('should approve a fund request and update the budget allocatedAmount atomically', async () => {
      const initialBudget = await budgetModel.findOne({ productionId: prod1._id });
      const initialAllocated = initialBudget.allocatedAmount;

      const reqRes = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          title: 'Costume Purchase',
          description: 'Period-accurate garments.',
          category: 'Costumes',
          requestedAmount: 300000,
        });

      const reqId = reqRes.body._id;

      const approveRes = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/requests/${reqId}/approve`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ approvedAmount: 300000 })
        .expect(200);

      expect(approveRes.body.status).toBe('Approved');
      expect(approveRes.body.approvedAmount).toBe(300000);

      const finalBudget = await budgetModel.findOne({ productionId: prod1._id });
      expect(finalBudget.allocatedAmount).toBe(initialAllocated + 300000);
      expect(finalBudget.remainingAmount).toBe(finalBudget.totalBudget - finalBudget.allocatedAmount);
    });

    it('should prevent self-approval safeguards', async () => {
      // Production Manager requests funds
      const reqRes = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          title: 'Manager travel expenses',
          description: 'Hotel bookings for scout.',
          category: 'Logistics',
          requestedAmount: 150000,
        });

      const reqId = reqRes.body._id;

      const errRes = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/funds/requests/${reqId}/approve`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ approvedAmount: 150000 })
        .expect(400); // Safe self-approval blocked!
      expect(errRes.body.message).toBe('Approvers cannot approve their own fund requests.');
    });
  });

  describe('IDOR & Scope Security', () => {
    it('should block manager2 from viewing or updating production 1 budget/requests', async () => {
      // View budget of prod1
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/funds/budget`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .expect(403);

      // Submit request to prod1
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/funds/requests`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({
          title: 'Intrusion request',
          description: 'Hacker bypass.',
          category: 'Other',
          requestedAmount: 1000,
        })
        .expect(403);
    });
  });
});
