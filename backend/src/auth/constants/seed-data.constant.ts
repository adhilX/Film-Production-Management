export const defaultPermissions = [
  // Projects
  { name: 'productions.view', description: 'View Projects', group: 'Projects' },
  { name: 'productions.create', description: 'Create Projects', group: 'Projects' },
  { name: 'productions.update', description: 'Update Projects', group: 'Projects' },
  { name: 'productions.delete', description: 'Delete Projects', group: 'Projects' },

  // Users
  { name: 'users.view', description: 'View Users', group: 'Users' },
  { name: 'users.create', description: 'Create Users', group: 'Users' },
  { name: 'users.update', description: 'Update Users', group: 'Users' },
  { name: 'users.delete', description: 'Delete Users', group: 'Users' },
  { name: 'users.approve', description: 'Approve Users Onboarding', group: 'Users' },

  // Roles & Permissions
  { name: 'roles.manage', description: 'Manage Roles & RBAC', group: 'Roles & Permissions' },
  { name: 'permissions.view', description: 'View Permissions', group: 'Roles & Permissions' },
  { name: 'roles.view', description: 'View Roles', group: 'Roles & Permissions' },

  // Locations
  { name: 'locations.view', description: 'View Locations', group: 'Locations' },
  { name: 'locations.create', description: 'Create Locations', group: 'Locations' },
  { name: 'locations.update', description: 'Update Locations', group: 'Locations' },
  { name: 'locations.delete', description: 'Delete Locations', group: 'Locations' },
  { name: 'locations.book', description: 'Book Locations', group: 'Locations' },
  { name: 'locations.approve', description: 'Approve Locations Bookings', group: 'Locations' },

  // Costumes & Assets
  { name: 'costumes.view', description: 'View Costumes', group: 'Costumes & Assets' },
  { name: 'costumes.create', description: 'Create Costumes', group: 'Costumes & Assets' },
  { name: 'costumes.update', description: 'Update Costumes', group: 'Costumes & Assets' },
  { name: 'costumes.delete', description: 'Delete Costumes', group: 'Costumes & Assets' },

  // Funds
  { name: 'funds.view', description: 'View Fund Requests', group: 'Funds' },
  { name: 'funds.create', description: 'Submit Fund Requests', group: 'Funds' },
  { name: 'funds.update', description: 'Update Fund Requests', group: 'Funds' },
  { name: 'funds.approve', description: 'Approve Fund Requests', group: 'Funds' },

  // Logs
  { name: 'audit_logs.view', description: 'View Audit Logs', group: 'Logs' },
  { name: 'logs.view', description: 'View System Logs', group: 'Logs' },
];

export const rolesConfig = [
  {
    name: 'Super Admin',
    description: 'Full access to the entire Tendagon system',
    permissions: [
      'productions.view', 'productions.create', 'productions.update', 'productions.delete',
      'users.view', 'users.create', 'users.update', 'users.delete', 'users.approve',
      'roles.manage', 'permissions.view', 'roles.view',
      'locations.view', 'locations.create', 'locations.update', 'locations.delete', 'locations.book', 'locations.approve',
      'costumes.view', 'costumes.create', 'costumes.update', 'costumes.delete',
      'funds.view', 'funds.create', 'funds.update', 'funds.approve',
      'audit_logs.view', 'logs.view'
    ]
  },
  {
    name: 'Production Admin',
    description: 'Manage projects, users, resources, and operational workflows',
    permissions: [
      'productions.view', 'productions.create', 'productions.update',
      'users.view', 'users.approve',
      'locations.view', 'locations.create', 'locations.update', 'locations.delete', 'locations.book', 'locations.approve',
      'costumes.view', 'costumes.create', 'costumes.update', 'costumes.delete',
      'funds.view', 'funds.create', 'funds.update', 'funds.approve',
      'audit_logs.view'
    ]
  },
  {
    name: 'Production Manager',
    description: 'Manage assigned projects and project resources',
    permissions: [
      'productions.view', 'productions.update',
      'locations.view', 'locations.create', 'locations.update', 'locations.book',
      'costumes.view', 'costumes.create', 'costumes.update',
      'funds.view', 'funds.create'
    ]
  },
  {
    name: 'Cast',
    description: 'Access assigned project resources as a cast member',
    permissions: [
      'productions.view', 'locations.view', 'costumes.view', 'funds.view'
    ]
  },
  {
    name: 'Crew',
    description: 'Access assigned project resources as a crew member',
    permissions: [
      'productions.view', 'locations.view', 'costumes.view', 'funds.view'
    ]
  }
];
