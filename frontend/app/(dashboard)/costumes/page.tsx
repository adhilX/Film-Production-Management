'use client';

import CostumesModule from '@/components/modules/CostumesModule';
import { PermissionGuard } from '@/app/components/permission-guard';

export default function CostumesPage() {
  return (
    <PermissionGuard permission="costumes.view">
      <CostumesModule />
    </PermissionGuard>
  );
}
