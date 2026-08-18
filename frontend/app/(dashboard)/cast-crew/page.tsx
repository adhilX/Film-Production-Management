'use client';

import CastCrewModule from '@/components/modules/CastCrewModule';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';
import { PERMISSIONS } from '@/constants/permissions';

export default function CrewPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.PRODUCTIONS_VIEW} fallback={<UnauthorizedFallback />}>
      <CastCrewModule />
    </PermissionGuard>
  );
}

