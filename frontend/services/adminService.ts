import { roleService } from '@/features/roles/services/role.service';
import { approvalService } from '@/features/approvals/services/approval.service';
import { userService } from '@/features/users/services/user.service';
import { logService } from '@/features/logs/services/log.service';

export const adminService = {
  // Roles
  getRoles: roleService.getRoles.bind(roleService),
  createRole: roleService.createRole.bind(roleService),
  updateRole: roleService.updateRole.bind(roleService),

  // Permissions
  getPermissions: roleService.getPermissions.bind(roleService),
  createPermission: roleService.createPermission.bind(roleService),

  // Applications/Approvals
  getApplications: approvalService.getApplications.bind(approvalService),
  getApplication: approvalService.getApplication.bind(approvalService),
  evaluateApplication: approvalService.evaluateApplication.bind(approvalService),

  // User Management
  getUsers: userService.getUsers.bind(userService),
  getUser: userService.getUser.bind(userService),
  createUser: userService.createUser.bind(userService),
  updateUser: userService.updateUser.bind(userService),

  // Audit Logs
  getAuditLogs: logService.getAuditLogs.bind(logService),
};

export default adminService;
