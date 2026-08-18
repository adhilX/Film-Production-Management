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
import { Location } from '../src/locations/schemas/location.schema';
import { LocationBooking } from '../src/locations/schemas/location-booking.schema';
import { AuditLog } from '../src/audit-logs/schemas/audit-log.schema';

describe('Locations & Bookings Module (e2e)', () => {
  let app: INestApplication<App>;
  let mongoConnection: Connection;
  let jwtService: JwtService;

  // DB Models for Seeding
  let userModel: any;
  let roleModel: any;
  let permissionModel: any;
  let productionModel: any;
  let castCrewModel: any;
  let locationModel: any;
  let bookingModel: any;
  let auditLogModel: any;

  // Seeded Entities
  let superAdminUser: any;
  let manager1: any;
  let manager2: any;
  let crewUser: any;
  let otherCrewUser: any;
  let pendingUser: any;

  let prod1: any;
  let prod2: any;

  let superAdminToken: string;
  let manager1Token: string;
  let manager2Token: string;
  let crewToken: string;
  let otherCrewToken: string;
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
    locationModel = mongoConnection.model(Location.name);
    bookingModel = mongoConnection.model(LocationBooking.name);
    auditLogModel = mongoConnection.model(AuditLog.name);

    // Clear db collections before seeding
    await userModel.deleteMany({});
    await roleModel.deleteMany({});
    await permissionModel.deleteMany({});
    await productionModel.deleteMany({});
    await castCrewModel.deleteMany({});
    await locationModel.deleteMany({});
    await bookingModel.deleteMany({});
    await auditLogModel.deleteMany({});

    // Create Permissions
    const permRolesManage = await new permissionModel({ name: 'roles.manage', group: 'Admin' }).save();
    const permLocView = await new permissionModel({ name: 'locations.view', group: 'Locations' }).save();
    const permLocCreate = await new permissionModel({ name: 'locations.create', group: 'Locations' }).save();
    const permLocUpdate = await new permissionModel({ name: 'locations.update', group: 'Locations' }).save();
    const permLocDelete = await new permissionModel({ name: 'locations.delete', group: 'Locations' }).save();
    const permLocBook = await new permissionModel({ name: 'locations.book', group: 'Locations' }).save();
    const permLocApprove = await new permissionModel({ name: 'locations.approve', group: 'Locations' }).save();

    // Create Roles
    const superAdminRole = await new roleModel({
      name: 'Super Admin',
      permissions: [
        permRolesManage._id,
        permLocView._id,
        permLocCreate._id,
        permLocUpdate._id,
        permLocDelete._id,
        permLocBook._id,
        permLocApprove._id,
      ],
    }).save();

    const managerRole = await new roleModel({
      name: 'Production Manager',
      permissions: [
        permLocView._id,
        permLocCreate._id,
        permLocUpdate._id,
        permLocDelete._id,
        permLocBook._id,
        permLocApprove._id,
      ],
    }).save();

    const crewRole = await new roleModel({
      name: 'Crew',
      permissions: [
        permLocView._id,
        permLocBook._id,
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

    otherCrewUser = await new userModel({
      email: 'other_crew@tendagon.com',
      passwordHash: 'hash',
      name: 'Other Crew User',
      isActive: true,
      onboardingStatus: 'approved',
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
    crewToken = await jwtService.generateAccessToken({ userId: crewUser._id.toString(), email: crewUser.email });
    otherCrewToken = await jwtService.generateAccessToken({ userId: otherCrewUser._id.toString(), email: otherCrewUser.email });
    pendingToken = await jwtService.generateAccessToken({ userId: pendingUser._id.toString(), email: pendingUser.email });

    // Create Productions
    prod1 = await new productionModel({
      title: 'Production One',
      status: 'Active',
      budget: 100000,
      productionManager: manager1._id, // Assign Manager 1
    }).save();

    prod2 = await new productionModel({
      title: 'Production Two',
      status: 'Active',
      budget: 500000,
      productionManager: manager2._id, // Assign Manager 2
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

    // Assign Crew to Production 1
    await new castCrewModel({
      userId: crewUser._id,
      productionId: prod1._id,
      roleInProduction: 'Crew',
    }).save();

    // Assign Other Crew to Production 2
    await new castCrewModel({
      userId: otherCrewUser._id,
      productionId: prod2._id,
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
    await locationModel.deleteMany({});
    await bookingModel.deleteMany({});
    await auditLogModel.deleteMany({});

    await app.close();
  });

  describe('Project-Level Access & 403 Scoping Checks', () => {
    it('Manager 1 can view production 1 locations but not production 2', async () => {
      // Production 1
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/locations`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      // Production 2 (should return 403)
      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}/locations`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(403);
    });

    it('Super Admin can view any production locations', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod2._id}/locations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
    });

    it('Pending user gets 403 due to Onboarding Gate', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/locations`)
        .set('Authorization', `Bearer ${pendingToken}`)
        .expect(403);
    });
  });

  describe('Physical Location CRUD & Duplicate checks', () => {
    let locId: string;

    it('Manager 1 can create physical location in Production 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/locations`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          name: 'Stage B Studio',
          address: 'Burbank Lot 3',
          description: 'Large Soundstage',
          locationType: 'Studio',
        })
        .expect(201);

      expect(res.body.name).toBe('Stage B Studio');
      locId = res.body._id;

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'LOCATION_CREATED' }).exec();
      expect(log).toBeDefined();
      expect(log.userId.toString()).toBe(manager1._id.toString());
      expect(log.resourceId.toString()).toBe(locId);
    });

    it('Creating duplicate name in same production is blocked', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/locations`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          name: 'Stage B Studio',
          address: 'Different address',
        })
        .expect(409);
    });

    it('Creating same location name in a different production is allowed', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod2._id}/locations`)
        .set('Authorization', `Bearer ${manager2Token}`)
        .send({
          name: 'Stage B Studio',
          address: 'Burbank Lot 3',
        })
        .expect(201);
    });

    it('Manager 1 can update physical location details', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/${locId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({
          description: 'Updated Description',
        })
        .expect(200);

      expect(res.body.description).toBe('Updated Description');

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'LOCATION_UPDATED' }).exec();
      expect(log).toBeDefined();
    });
  });

  describe('Booking creation & overlap prevention checks', () => {
    let locId: string;
    let booking1Id: string;
    let booking2Id: string;

    beforeAll(async () => {
      const loc = await new locationModel({
        name: 'Warehouse A',
        address: 'Burbank',
        productionId: prod1._id,
      }).save();
      locId = loc._id.toString();
    });

    it('Crew user can submit location booking request', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/locations/bookings`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          locationId: locId,
          startDate: '2026-09-10T08:00:00.000Z',
          endDate: '2026-09-15T18:00:00.000Z',
        })
        .expect(201);

      expect(res.body.status).toBe('Pending');
      booking1Id = res.body._id;

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'LOCATION_BOOKING_CREATED' }).exec();
      expect(log).toBeDefined();
    });

    it('Submit booking with invalid dates is blocked', async () => {
      await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/locations/bookings`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          locationId: locId,
          startDate: '2026-09-15T08:00:00.000Z',
          endDate: '2026-09-10T18:00:00.000Z',
        })
        .expect(400);
    });

    it('Submit overlapping pending booking is allowed (can submit, conflict checks on approval)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/productions/${prod1._id}/locations/bookings`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({
          locationId: locId,
          startDate: '2026-09-12T08:00:00.000Z', // overlaps 10-15
          endDate: '2026-09-18T18:00:00.000Z',
        })
        .expect(201);

      booking2Id = res.body._id;
    });

    it('Manager 1 can approve first booking request', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/bookings/${booking1Id}/status`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ status: 'Approved' })
        .expect(200);

      const booking = await bookingModel.findById(booking1Id).exec();
      expect(booking.status).toBe('Approved');

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'LOCATION_BOOKING_APPROVED' }).exec();
      expect(log).toBeDefined();
    });

    it('Approving second overlapping booking is blocked due to collision', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/bookings/${booking2Id}/status`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ status: 'Approved' })
        .expect(409);
    });
  });

  describe('Granular status transition and cancellation controls', () => {
    let locId: string;
    let pendingBookingId: string;
    let approvedBookingId: string;

    beforeAll(async () => {
      const loc = await new locationModel({
        name: 'Mansion B',
        address: 'Burbank',
        productionId: prod1._id,
      }).save();
      locId = loc._id.toString();

      const booking1 = await new bookingModel({
        locationId: loc._id,
        productionId: prod1._id,
        requestedBy: crewUser._id,
        startDate: new Date('2026-10-01T08:00:00.000Z'),
        endDate: new Date('2026-10-05T18:00:00.000Z'),
        status: 'Pending',
      }).save();
      pendingBookingId = booking1._id.toString();

      const booking2 = await new bookingModel({
        locationId: loc._id,
        productionId: prod1._id,
        requestedBy: crewUser._id,
        startDate: new Date('2026-10-10T08:00:00.000Z'),
        endDate: new Date('2026-10-15T18:00:00.000Z'),
        status: 'Approved',
      }).save();
      approvedBookingId = booking2._id.toString();
    });

    it('Crew user cannot approve/reject booking', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/bookings/${pendingBookingId}/status`)
        .set('Authorization', `Bearer ${crewToken}`)
        .send({ status: 'Approved' })
        .expect(403);
    });

    it('Other crew user (not requester) cannot cancel booking', async () => {
      // Use Manager 1 Token to create a booking for Manager 1
      const anotherBooking = await new bookingModel({
        locationId: new Types.ObjectId(locId),
        productionId: prod1._id,
        requestedBy: manager1._id,
        startDate: new Date('2026-10-20T08:00:00.000Z'),
        endDate: new Date('2026-10-25T18:00:00.000Z'),
        status: 'Pending',
      }).save();

      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/bookings/${anotherBooking._id}/status`)
        .set('Authorization', `Bearer ${crewToken}`) // crew is not requester/manager
        .send({ status: 'Cancelled' })
        .expect(403);
    });

    it('Requester can cancel their own booking', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/bookings/${pendingBookingId}/status`)
        .set('Authorization', `Bearer ${crewToken}`) // crew user is the requester of pendingBookingId
        .send({ status: 'Cancelled' })
        .expect(200);

      const booking = await bookingModel.findById(pendingBookingId).exec();
      expect(booking.status).toBe('Cancelled');

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'LOCATION_BOOKING_CANCELLED' }).exec();
      expect(log).toBeDefined();
    });

    it('Manager can cancel approved booking', async () => {
      await request(app.getHttpServer())
        .patch(`/productions/${prod1._id}/locations/bookings/${approvedBookingId}/status`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .send({ status: 'Cancelled' })
        .expect(200);

      const booking = await bookingModel.findById(approvedBookingId).exec();
      expect(booking.status).toBe('Cancelled');
    });
  });

  describe('Location Deletion Safety Checks', () => {
    let locId: string;

    beforeAll(async () => {
      const loc = await new locationModel({
        name: 'Forest C',
        address: 'Burbank',
        productionId: prod1._id,
      }).save();
      locId = loc._id.toString();
    });

    it('Cannot delete location with pending bookings', async () => {
      await new bookingModel({
        locationId: new Types.ObjectId(locId),
        productionId: prod1._id,
        requestedBy: crewUser._id,
        startDate: new Date('2026-11-01T08:00:00.000Z'),
        endDate: new Date('2026-11-05T18:00:00.000Z'),
        status: 'Pending',
      }).save();

      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/locations/${locId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(409);
    });

    it('Can delete location after cancelling all active/pending bookings', async () => {
      // Cancel booking
      const booking = await bookingModel.findOne({ locationId: new Types.ObjectId(locId) }).exec();
      booking.status = 'Cancelled';
      await booking.save();

      await request(app.getHttpServer())
        .delete(`/productions/${prod1._id}/locations/${locId}`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200);

      // Verify audit log
      const log = await auditLogModel.findOne({ action: 'LOCATION_DELETED' }).exec();
      expect(log).toBeDefined();
    });
  });

  describe('Route Safety & ObjectId Validation Regression Checks', () => {
    it('GET /productions/:productionId/locations/bookings resolves to bookings and not location detail', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/locations/bookings`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(200); // Expect list of bookings, not 400/404/500 from location ID parser
    });

    it('GET /productions/:productionId/locations/invalid-id-format returns 400/404 instead of 500 BSON Error', async () => {
      await request(app.getHttpServer())
        .get(`/productions/${prod1._id}/locations/invalid-id-format`)
        .set('Authorization', `Bearer ${manager1Token}`)
        .expect(404); // Returns 404 Not Found (a clean 400/404 response instead of 500 BSON Error)
    });
  });
});

