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

describe('Onboarding Approvals Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // Models
  let userModel: any;
  let userProfileModel: any;
  let roleModel: any;
  let permissionModel: any;
  let auditLogModel: any;

  // Seeded Roles/Users
  let adminRole: any;
  let managerRole: any;
  let crewRole: any;

  let adminUser: any;
  let managerUser: any;
  let applicant1: any;
  let applicant2: any;

  // Tokens
  let adminToken: string;
  let managerToken: string;
  let applicant1Token: string;

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

    // Clear db collections
    await userModel.deleteMany({});
    await userProfileModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Seed Permissions
    const permApprove = await new permissionModel({ name: 'users.approve', group: 'Admin' }).save();
    const permView = await new permissionModel({ name: 'users.view', group: 'Admin' }).save();

    // Seed Roles
    adminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [permApprove._id, permView._id],
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
    adminUser = await new userModel({
      email: 'admin@tendagon.com',
      passwordHash: 'hash',
      name: 'Admin User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: adminRole._id,
    }).save();

    managerUser = await new userModel({
      email: 'manager@tendagon.com',
      passwordHash: 'hash',
      name: 'Manager User',
      isActive: true,
      onboardingStatus: 'approved',
      systemRoleId: managerRole._id,
    }).save();

    // Seed Applicants (In Onboarding)
    applicant1 = await new userModel({
      email: 'applicant1@tendagon.com',
      passwordHash: 'hash',
      name: 'Alice Applicant',
      contractorType: 'Freelancer',
      isActive: false,
      onboardingStatus: 'pending-review',
      systemRoleId: null,
    }).save();

    applicant2 = await new userModel({
      email: 'applicant2@tendagon.com',
      passwordHash: 'hash',
      name: 'Bob Candidate',
      contractorType: 'Crew',
      isActive: false,
      onboardingStatus: 'in-progress',
      systemRoleId: null,
    }).save();

    // Seed Profiles for Applicants
    await new userProfileModel({
      userId: applicant1._id,
      department: 'Art & Costume',
      position: 'Costume Designer',
      experience: ['Movie A', 'Show B'],
      phoneNumber: '+15550199',
      bankDetails: {
        bankName: 'First Global Bank',
        accountNumber: '987654321',
        routingNumber: '123456789',
      },
      taxFormUrl: 'https://storage.tendagon.com/tax/alice.pdf',
      governmentIdType: 'Passport',
      identityDocs: [
        'https://storage.tendagon.com/id/alice-front.jpg',
        'https://storage.tendagon.com/id/alice-back.jpg',
      ],
      signedNda: true,
      signedTerms: true,
      signatureData: 'data:image/png;base64,alice-signature',
    }).save();

    // Seed profiles for B (no financial info yet)
    await new userProfileModel({
      userId: applicant2._id,
      department: 'Camera',
      position: 'Camera Assistant',
      experience: [],
      phoneNumber: '+15550188',
      signedNda: false,
      signedTerms: false,
    }).save();

    // Generate Tokens
    adminToken = await jwtService.generateAccessToken({ userId: adminUser._id.toString(), email: adminUser.email });
    managerToken = await jwtService.generateAccessToken({ userId: managerUser._id.toString(), email: managerUser.email });
    applicant1Token = await jwtService.generateAccessToken({ userId: applicant1._id.toString(), email: applicant1.email });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth & Permission Safeguards', () => {
    it('should refuse access to approvals queue for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/applications')
        .expect(401);
    });

    it('should refuse access to approvals queue for users lacking users.approve (like Production Manager)', async () => {
      await request(app.getHttpServer())
        .get('/admin/applications')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('should grant access to approvals queue for users with users.approve (like Admin)', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('applications');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('metrics');
    });

    it('should allow user with users.view to view the user directory list', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });
  });

  describe('PII Exposure Protection', () => {
    it('should redact sensitive profile data when a third party retrieves another user profile', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${applicant1._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.name).toBe('Alice Applicant');
      
      const profile = res.body.profile;
      expect(profile).toBeDefined();
      expect(profile.department).toBe('Art & Costume');
      expect(profile.position).toBe('Costume Designer');
      
      expect(profile.bankDetails).toBeUndefined();
      expect(profile.taxFormUrl).toBeUndefined();
      expect(profile.governmentIdType).toBeUndefined();
      expect(profile.identityDocs).toBeUndefined();
      expect(profile.signatureData).toBeUndefined();
    });

    it('should NOT redact sensitive profile data when a user retrieves their own profile details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${applicant1._id}`)
        .set('Authorization', `Bearer ${applicant1Token}`)
        .expect(200);

      expect(res.body).toBeDefined();
      expect(res.body.name).toBe('Alice Applicant');
      
      const profile = res.body.profile;
      expect(profile).toBeDefined();
      expect(profile.bankDetails).toBeDefined();
      expect(profile.bankDetails.bankName).toBe('First Global Bank');
      expect(profile.taxFormUrl).toBe('https://storage.tendagon.com/tax/alice.pdf');
      expect(profile.governmentIdType).toBe('Passport');
      expect(profile.identityDocs).toHaveLength(2);
      expect(profile.signatureData).toBeDefined();
    });
  });

  describe('API Route Hardening & Validation', () => {
    it('should return 400 Bad Request when retrieving application with an invalid ObjectId parameter', async () => {
      await request(app.getHttpServer())
        .get('/admin/applications/invalid-object-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should return 400 Bad Request when evaluating application with an invalid ObjectId parameter', async () => {
      await request(app.getHttpServer())
        .patch('/admin/applications/invalid-object-id/evaluate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved', systemRoleId: crewRole._id.toString() })
        .expect(400);
    });

    it('should return 404 Not Found when retrieving an application that does not exist', async () => {
      const nonExistentId = new Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/admin/applications/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Evaluating Onboarding Applications', () => {
    it('should return 400 Bad Request when trying to approve an applicant without specifying a system role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/applications/${applicant1._id}/evaluate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(400);
    });

    it('should return 400 Bad Request when trying to request changes without specifying feedback', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/applications/${applicant1._id}/evaluate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'changes-requested' })
        .expect(400);
    });

    it('should reject application evaluation if the onboarding status is not pending-review', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/applications/${applicant2._id}/evaluate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved', systemRoleId: crewRole._id.toString() })
        .expect(400);
    });

    it('should successfully request changes and create an audit log', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/applications/${applicant1._id}/evaluate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'changes-requested', adminFeedback: 'ID document was blurry' })
        .expect(200);

      expect(res.body.onboardingStatus).toBe('changes-requested');
      expect(res.body.adminFeedback).toBe('ID document was blurry');

      const logs = await auditLogModel.find({ action: 'USER_ONBOARDING_CHANGES_REQUESTED' }).exec();
      expect(logs).toHaveLength(1);
      expect(logs[0].resourceId.toString()).toBe(applicant1._id.toString());
      expect(logs[0].userId.toString()).toBe(adminUser._id.toString());
    });

    it('should reject evaluation once the status is no longer pending-review (e.g. after changes requested)', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/applications/${applicant1._id}/evaluate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved', systemRoleId: crewRole._id.toString() })
        .expect(400);
    });

    it('should successfully approve application and create an audit log when moved back to pending and approved', async () => {
      await userModel.findByIdAndUpdate(applicant1._id, { onboardingStatus: 'pending-review' });

      const res = await request(app.getHttpServer())
        .patch(`/admin/applications/${applicant1._id}/evaluate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved', systemRoleId: crewRole._id.toString() })
        .expect(200);

      expect(res.body.onboardingStatus).toBe('approved');
      expect(res.body.isActive).toBe(true);
      expect(res.body.systemRoleId.toString()).toBe(crewRole._id.toString());

      const logs = await auditLogModel.find({ action: 'USER_ONBOARDING_APPROVED' }).exec();
      expect(logs).toHaveLength(1);
      expect(logs[0].resourceId.toString()).toBe(applicant1._id.toString());
      expect(logs[0].userId.toString()).toBe(adminUser._id.toString());
    });
  });
});
