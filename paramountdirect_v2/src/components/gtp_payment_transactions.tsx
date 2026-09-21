
import ProductPaymentTransactions from './product_payment_transactions';
import type { GtpApplication } from './gtp_types';
import { canCreatePayments } from '../lib/roles';

interface Props {
  data: GtpApplication[];
  currentUserRole?: string | null;
}

export default function GtpPaymentTransactions({ data, currentUserRole = null }: Props) {
  const rows = data
    .filter((d) => d.isPaid)
    .map((d) => ({
      id: d.id,
      policyNumber: d.policyNumber ?? '—',
      referenceNo: d.referenceNo ?? '—',
      payorName: `${d.travelerFirstName} ${d.travelerSurname}`,
      planLabel: `${d.planVariant} — ${d.destinations.join(', ')}`,
      premium: d.premium,
      dateReceived: d.dateReceived,
    }));

  const canCreate = canCreatePayments(currentUserRole, 'GTP');

  return <ProductPaymentTransactions productLabel="GTP" accentColor="#002f6c" rows={rows} canCreate={canCreate} />;
}
