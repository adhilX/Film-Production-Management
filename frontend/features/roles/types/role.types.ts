export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export interface CreateRolePayload {
  name: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  permissions: string[];
}

export interface CreatePermissionPayload {
  name: string;
  description?: string;
  group?: string;
}
