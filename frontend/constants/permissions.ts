export const PERMISSIONS = {
  // Projects
  PRODUCTIONS_VIEW: 'productions.view',
  PRODUCTIONS_CREATE: 'productions.create',
  PRODUCTIONS_UPDATE: 'productions.update',
  PRODUCTIONS_DELETE: 'productions.delete',

  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_APPROVE: 'users.approve',

  // Roles & Permissions
  ROLES_MANAGE: 'roles.manage',
  ROLES_VIEW: 'roles.view',
  PERMISSIONS_VIEW: 'permissions.view',

  // Locations
  LOCATIONS_VIEW: 'locations.view',
  LOCATIONS_CREATE: 'locations.create',
  LOCATIONS_UPDATE: 'locations.update',
  LOCATIONS_DELETE: 'locations.delete',
  LOCATIONS_BOOK: 'locations.book',
  LOCATIONS_APPROVE: 'locations.approve',

  // Costumes & Assets
  COSTUMES_VIEW: 'costumes.view',
  COSTUMES_CREATE: 'costumes.create',
  COSTUMES_UPDATE: 'costumes.update',
  COSTUMES_DELETE: 'costumes.delete',

  // Funds
  FUNDS_VIEW: 'funds.view',
  FUNDS_CREATE: 'funds.create',
  FUNDS_UPDATE: 'funds.update',
  FUNDS_APPROVE: 'funds.approve',

  // Logs
  AUDIT_LOGS_VIEW: 'audit_logs.view',
  LOGS_VIEW: 'logs.view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
