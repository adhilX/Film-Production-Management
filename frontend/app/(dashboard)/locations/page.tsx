'use client';

import LocationsModule from '@/components/modules/LocationsModule';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';
import { PERMISSIONS } from '@/constants/permissions';

export default function LocationsPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.LOCATIONS_VIEW} fallback={<UnauthorizedFallback />}>
      <LocationsModule />
    </PermissionGuard>
  );
}
