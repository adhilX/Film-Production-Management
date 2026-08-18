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
import { CloudinaryService } from '../src/common/cloudinary/cloudinary.service';

describe('User Onboarding & Profile Management (e2e)', () => {
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
  let crewRole: any;
  let onboardingUser: any;
  let approvedUser: any;

  // Tokens
  let onboardingToken: string;
  let approvedToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudinaryService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue({
          secure_url: 'https://res.cloudinary.com/cine-factory/documents/mocked-file.pdf',
        }),
      })
      .compile();

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

    // Seed Roles
    crewRole = await new roleModel({
      name: 'Crew',
      permissions: [],
    }).save();

    // Seed Users
    onboardingUser = await new userModel({
      email: 'onboarding@tendagon.com',
      passwordHash: 'hash',
      name: 'Onboarding User',
      isActive: false,
      onboardingStatus: 'in-progress',
      currentStep: 1,
      systemRoleId: null,
    }).save();

    approvedUser = await new userModel({
      email: 'approved@tendagon.com',
      passwordHash: 'hash',
      name: 'Approved User',
      isActive: true,
      onboardingStatus: 'approved',
      currentStep: 6,
      systemRoleId: crewRole._id,
    }).save();

    // Create profile for onboarding user
    await new userProfileModel({
      userId: onboardingUser._id,
      signedNda: false,
      signedTerms: false,
    }).save();

    // Create profile for approved user
    await new userProfileModel({
      userId: approvedUser._id,
      department: 'Camera',
      position: 'Camera Assistant',
      experience: ['Movie Alpha'],
      phoneNumber: '+15550299',
      bankDetails: {
        bankName: 'National Bank',
        accountNumber: '9988776655',
        routingNumber: '1122334455',
      },
      taxFormUrl: 'https://res.cloudinary.com/tax.pdf',
      governmentIdType: 'Driver License',
      identityDocs: ['https://res.cloudinary.com/id1.png', 'https://res.cloudinary.com/id2.png'],
      signedNda: true,
      signedTerms: true,
      signatureData: 'data:image/png;base64,signatureApproved',
    }).save();

    // Generate tokens
    onboardingToken = await jwtService.generateAccessToken({
      userId: onboardingUser._id.toString(),
      email: onboardingUser.email,
    });

    approvedToken = await jwtService.generateAccessToken({
      userId: approvedUser._id.toString(),
      email: approvedUser.email,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication and Route Safeguards', () => {
    it('should reject unauthenticated calls to onboarding with 401', async () => {
      await request(app.getHttpServer())
        .patch('/users/onboarding')
        .send({ currentStep: 2 })
        .expect(401);
    });

    it('should reject unauthenticated calls to upload with 401', async () => {
      await request(app.getHttpServer())
        .post('/users/upload')
        .attach('file', Buffer.from('dummy'), 'test.pdf')
        .expect(401);
    });
  });

  describe('Step-Skipping Protection', () => {
    it('should reject jumping from step 1 directly to step 4 with 400', async () => {
      await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 4,
          profileData: {
            contractorType: 'Freelancer',
          },
        })
        .expect(400);
    });

    it('should reject jumping from step 1 directly to step 6 with 400', async () => {
      await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 6,
          profileData: {
            contractorType: 'Freelancer',
          },
        })
        .expect(400);
    });
  });

  describe('Onboarding State Protection', () => {
    it('should prevent approved users from editing onboarding details', async () => {
      await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${approvedToken}`)
        .send({
          currentStep: 2,
          profileData: {
            contractorType: 'Freelancer',
          },
        })
        .expect(400);
    });

    it('should strip/ignore system state modifications attempted by client', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 2,
          profileData: {
            contractorType: 'Freelancer',
            onboardingStatus: 'approved',
            isActive: true,
            systemRoleId: crewRole._id.toString(),
          },
        })
        .expect(200);

      const dbUser = await userModel.findById(onboardingUser._id).exec();
      expect(dbUser.onboardingStatus).toBe('in-progress');
      expect(dbUser.isActive).toBe(false);
      expect(dbUser.systemRoleId).toBeNull();
    });
  });

  describe('Onboarding Step-by-Step Flow', () => {
    it('should successfully complete Step 1 -> Step 2 transition', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 2,
          profileData: {
            contractorType: 'Freelancer',
          },
        })
        .expect(200);

      expect(res.body.currentStep).toBe(2);
      expect(res.body.contractorType).toBe('Freelancer');
    });

    it('should successfully complete Step 2 -> Step 3 transition', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 3,
          profileData: {
            name: 'John Doe',
            photoUrl: 'https://res.cloudinary.com/photo.png',
            phoneNumber: '+1555998877',
            department: 'Art & Costume',
            position: 'Costume Designer',
            experience: 'I have worked on various movie sets for 10 years.',
          },
        })
        .expect(200);

      expect(res.body.currentStep).toBe(3);
      expect(res.body.name).toBe('John Doe');
    });

    it('should successfully complete Step 3 -> Step 4 transition', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 4,
          profileData: {
            bankDetails: {
              bankName: 'Test Bank',
              accountNumber: '1122334455',
              routingNumber: '998877665',
            },
            taxFormUrl: 'https://res.cloudinary.com/tax-doc.pdf',
          },
        })
        .expect(200);

      expect(res.body.currentStep).toBe(4);
    });

    it('should successfully complete Step 4 -> Step 5 transition', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 5,
          profileData: {
            governmentIdType: 'Passport',
            identityDocs: ['https://res.cloudinary.com/doc1.png', 'https://res.cloudinary.com/doc2.png'],
          },
        })
        .expect(200);

      expect(res.body.currentStep).toBe(5);
    });

    it('should successfully complete Step 5 -> Step 6 (Final Submission) transition', async () => {
      // Clear out status change audit logs before submission to verify logging
      await auditLogModel.deleteMany({});

      const res = await request(app.getHttpServer())
        .patch('/users/onboarding')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .send({
          currentStep: 6,
          profileData: {
            agreeNda: true,
            agreeTerms: true,
            signatureData: 'data:image/png;base64,signatureDataBlob',
          },
        })
        .expect(200);

      expect(res.body.currentStep).toBe(6);
      expect(res.body.onboardingStatus).toBe('pending-review');
      expect(res.body.status).toBe('Pending');

      // Verify audit log creation
      const logs = await auditLogModel.find({ action: 'USER_ONBOARDING_STATUS_CHANGE' }).exec();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId.toString()).toBe(onboardingUser._id.toString());
      expect(logs[0].newState).toBe('pending-review');
    });
  });

  describe('File Upload Security & Limits', () => {
    it('should accept valid PDF upload', async () => {
      await auditLogModel.deleteMany({});

      const res = await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .attach('file', Buffer.from('pdf mock data'), 'test.pdf')
        .field('documentType', 'TaxForm')
        .expect(201);

      expect(res.body.fileUrl).toBeDefined();

      // Verify audit log
      const logs = await auditLogModel.find({ action: 'USER_DOCUMENT_UPLOADED' }).exec();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId.toString()).toBe(onboardingUser._id.toString());
      expect(logs[0].metadata.documentType).toBe('TaxForm');
    });

    it('should accept valid PNG upload', async () => {
      await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .attach('file', Buffer.from('png mock data'), 'test.png')
        .field('documentType', 'GovernmentId')
        .expect(201);
    });

    it('should accept valid JPEG upload', async () => {
      await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .attach('file', Buffer.from('jpeg mock data'), 'test.jpg')
        .field('documentType', 'GovernmentId')
        .expect(201);
    });

    it('should reject uploads exceeding 5MB with 400', async () => {
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1); // 5MB + 1 byte
      await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .attach('file', largeBuffer, 'test.pdf')
        .field('documentType', 'TaxForm')
        .expect(400);
    });

    it('should reject unsupported file types (mimetype text/plain) with 400', async () => {
      await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .attach('file', Buffer.from('text content'), 'test.txt')
        .field('documentType', 'TaxForm')
        .expect(400);
    });

    it('should reject upload requests without file with 400', async () => {
      await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${onboardingToken}`)
        .field('documentType', 'TaxForm')
        .expect(400);
    });
  });
});
