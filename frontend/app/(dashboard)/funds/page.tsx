'use client';

import FundsModule from '@/components/modules/FundsModule';
import { PermissionGuard } from '@/app/components/permission-guard';

export default function FundsPage() {
  return (
    <PermissionGuard permission="funds.approve">
      <FundsModule />
    </PermissionGuard>
  );
}
