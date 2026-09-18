import React from 'react';
import ProductPaymentTransactions from './product_payment_transactions';
import type { CtplApplication } from './ctpl_types';

interface Props {
  data: CtplApplication[];
  currentUserRole?: string | null;
}

export default function CtplPaymentTransactions({ data, currentUserRole = null }: Props) {
  const rows = data
    .filter((d) => d.isPaid)
    .map((d) => ({
      id: d.id,
      policyNumber: d.policyNumber ?? '—',
      referenceNo: d.referenceNo ?? '—',
      payorName: `${d.ownerFirstName} ${d.ownerMiddleName} ${d.ownerSurname}`,
      planLabel: `${d.policyType} — ${d.mvType}`,
      premium: d.premium,
      dateReceived: d.dateReceived,
    }));

  // Admin is the seeded demo login used to test every role-gated feature,
  // so it's treated as a superset of Cashier access rather than excluded.
  const canCreate = currentUserRole === 'Cashier' || currentUserRole === 'Admin';

  return <ProductPaymentTransactions productLabel="CTPL" accentColor="#002f6c" rows={rows} canCreate={canCreate} />;
}
