'use client';

import CostumesModule from '@/components/modules/CostumesModule';
import { PermissionGuard } from '@/app/components/permission-guard';
import { UnauthorizedFallback } from '@/components/common/UnauthorizedFallback';
import { PERMISSIONS } from '@/constants/permissions';

export default function CostumesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.COSTUMES_VIEW} fallback={<UnauthorizedFallback />}>
      <CostumesModule />
    </PermissionGuard>
  );
}
