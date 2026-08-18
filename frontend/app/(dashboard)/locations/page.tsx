'use client';

import LocationsModule from '@/components/modules/LocationsModule';
import { PermissionGuard } from '@/app/components/permission-guard';

export default function LocationsPage() {
  return (
    <PermissionGuard permission="locations.view">
      <LocationsModule />
    </PermissionGuard>
  );
}
