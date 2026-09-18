
import ProductPaymentTransactions from './product_payment_transactions';
import type { OfwApplication } from './ofw_types';

interface Props {
  data: OfwApplication[];
  currentUserRole?: string | null;
}

export default function OfwPaymentTransactions({ data, currentUserRole = null }: Props) {
  const rows = data
    .filter((d) => d.isPaid)
    .map((d) => ({
      id: d.id,
      policyNumber: d.policyNumber ?? '—',
      referenceNo: d.referenceNo ?? '—',
      payorName: `${d.firstName} ${d.middleName} ${d.lastName}`,
      planLabel: `${d.coverageType} OFW Insurance`,
      premium: d.premium,
      dateReceived: d.dateReceived,
    }));

  // Admin is the seeded demo login used to test every role-gated feature,
  // so it's treated as a superset of Cashier access rather than excluded.
  const canCreate = currentUserRole === 'Cashier' || currentUserRole === 'Admin';

  return <ProductPaymentTransactions productLabel="OFW" accentColor="#002f6c" rows={rows} canCreate={canCreate} />;
}
