
import ProductPaymentTransactions from './product_payment_transactions';
import type { CtplApplication } from './ctpl_types';

interface Props {
  data: CtplApplication[];
}

export default function CtplPaymentTransactions({ data }: Props) {
  const rows = data
    .filter((d) => d.isPaid)
    .map((d) => ({
      id: d.id,
      payorName: `${d.ownerFirstName} ${d.ownerMiddleName} ${d.ownerSurname}`,
      planLabel: `${d.policyType} — ${d.mvType}`,
      premium: d.premium,
      dateReceived: d.dateReceived,
    }));

  return <ProductPaymentTransactions productLabel="CTPL" accentColor="#002f6c" rows={rows} />;
}
