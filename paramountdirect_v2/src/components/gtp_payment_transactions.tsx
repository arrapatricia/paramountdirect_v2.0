
import ProductPaymentTransactions from './product_payment_transactions';
import type { GtpApplication } from './gtp_types';

interface Props {
  data: GtpApplication[];
}

export default function GtpPaymentTransactions({ data }: Props) {
  const rows = data
    .filter((d) => d.isPaid)
    .map((d) => ({
      id: d.id,
      payorName: `${d.travelerFirstName} ${d.travelerSurname}`,
      planLabel: `${d.planVariant} — ${d.destinations.join(', ')}`,
      premium: d.premium,
      dateReceived: d.dateReceived,
    }));

  return <ProductPaymentTransactions productLabel="GTP" accentColor="#002f6c" rows={rows} />;
}
