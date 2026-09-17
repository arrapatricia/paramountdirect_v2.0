
import ProductPaymentTransactions from './product_payment_transactions';
import type { OfwApplication } from './ofw_types';

interface Props {
  data: OfwApplication[];
}

export default function OfwPaymentTransactions({ data }: Props) {
  const rows = data
    .filter((d) => d.isPaid)
    .map((d) => ({
      id: d.id,
      payorName: `${d.firstName} ${d.middleName} ${d.lastName}`,
      planLabel: `${d.coverageType} OFW Insurance`,
      premium: d.premium,
      dateReceived: d.dateReceived,
    }));

  return <ProductPaymentTransactions productLabel="OFW" accentColor="#002f6c" rows={rows} />;
}
