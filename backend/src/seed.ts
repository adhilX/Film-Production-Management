import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { defaultPermissions, rolesConfig } from './auth/constants/seed-data.constant';

// Load environment variables
dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/film_production';

async function runSeed() {
  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // Define Schemas/Models
  const PermissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    group: String,
  }, { timestamps: true });

  const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  }, { timestamps: true });

  const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    contractorType: String,
    status: String,
    systemRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    isActive: Boolean,
    onboardingStatus: String,
    currentStep: Number,
  }, { timestamps: true });

  const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
  const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // 0. Seed Permissions
  console.log('Seeding permissions...');
  for (const perm of defaultPermissions) {
    let existing = await Permission.findOne({ name: perm.name });
    if (!existing) {
      existing = new Permission(perm);
      await existing.save();
    }
  }

  // Clean up obsolete permissions
  await Permission.deleteMany({
    name: { $nin: defaultPermissions.map(p => p.name) }
  });

  // 1. Seed Roles
  console.log('Seeding roles...');
  const getPermissionIds = async (names: string[]) => {
    const perms = await Permission.find({ name: { $in: names } });
    return perms.map((p) => p._id);
  };

  let superAdminRole: any = null;

  for (const r of rolesConfig) {
    const permissionIds = await getPermissionIds(r.permissions);
    let existingRole = await Role.findOne({ name: r.name });
    if (!existingRole) {
      existingRole = new Role({
        name: r.name,
        permissions: permissionIds,
      });
    } else {
      existingRole.permissions = permissionIds;
    }
    await existingRole.save();

    if (r.name === 'Super Admin') {
      superAdminRole = existingRole;
    }
  }

  // Clean up obsolete roles
  await Role.deleteMany({
    name: { $nin: rolesConfig.map(r => r.name) }
  });

  // 2. Seed Default Admin
  console.log('Seeding default admin...');
  const adminEmail = 'admin@production.com';
  let existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
    const admin = new User({
      email: adminEmail,
      passwordHash,
      name: 'Super Admin',
      contractorType: 'Production Company',
      status: 'Approved',
      systemRoleId: superAdminRole._id,
      isActive: true,
      onboardingStatus: 'approved',
      currentStep: 6,
    });
    await admin.save();
    console.log('Seeded default admin user: admin@production.com / AdminPassword123!');
  } else {
    existingAdmin.systemRoleId = superAdminRole._id;
    await existingAdmin.save();
    console.log('Admin user updated to Super Admin role.');
  }

  await mongoose.disconnect();
  console.log('Disconnected. Seeding complete!');
}

runSeed().catch((err) => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
