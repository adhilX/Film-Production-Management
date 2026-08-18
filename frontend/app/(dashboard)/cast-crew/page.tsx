'use client';

import CastCrewModule from '@/components/modules/CastCrewModule';
import { PermissionGuard } from '@/app/components/permission-guard';

export default function CrewPage() {
  return (
    <PermissionGuard permission="productions.view">
      <CastCrewModule />
    </PermissionGuard>
  );
}

