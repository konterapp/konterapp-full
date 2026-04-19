'use client';

import { use } from 'react';
import PurchaseForm from '../../../_components/PurchaseForm';

export default function EditPurchaseDraftPage({ params }: { params: Promise<{ uuid: string }> }) {
  const resolvedParams = use(params);
  return <PurchaseForm mode="edit" purchaseUuid={resolvedParams.uuid} />;
}
