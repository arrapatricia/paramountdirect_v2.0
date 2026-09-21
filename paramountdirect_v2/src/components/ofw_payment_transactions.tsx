
import ProductPaymentTransactions from './product_payment_transactions';
import type { OfwApplication } from './ofw_types';
import { canCreatePayments } from '../lib/roles';

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

  const canCreate = canCreatePayments(currentUserRole, 'OFW');

  return <ProductPaymentTransactions productLabel="OFW" accentColor="#002f6c" rows={rows} canCreate={canCreate} />;
}
