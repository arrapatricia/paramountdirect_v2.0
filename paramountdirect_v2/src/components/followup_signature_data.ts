import type { ScreeningItem } from '../App';

export interface FollowUpRow {
  id: string;
  payor: string;
  policyNumber: string;
  planCode: string;
  planDesc: string;
  premium: string;
  dateReceived: string;
  dateIssued: string;
  dateShipped: string; // '' = not yet shipped
  effectivityDate: string;
  policyStatus: 'INFORCE' | 'LAPSED';
  latestPrintFollowUp: string; // '' = none sent yet
  latestEmailFollowUp: string; // '' = none sent yet
  signed: boolean; // client's physical application form has been received back
}

export function addDays(dateStr: string, days: number): string {
  const [mm, dd, yyyy] = dateStr.split('/').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
}

// Only issued policies have a policy number / effectivity date to chase a
// wet-ink signature for, so the queue is built from the same `screeningData`
// as Application Screening, filtered to Issued rows and deterministically
// enriched with the follow-up-specific fields the real system tracks.
// `signedIds` is the shared "has this one been signed" set that both
// Follow-up Signature and Signed Applications read from and write to, so a
// row built here reflects whichever page last marked it signed.
//
// A policy only belongs in this queue while it's still worth chasing a
// signature for: Inforce policies always qualify, but a Lapsed policy drops
// out once it's been lapsed for more than 3 years - chasing a signature on
// something that lapsed that long ago serves no purpose.
export function buildFollowUpRows(data: ScreeningItem[], signedIds: string[] = []): FollowUpRow[] {
  const signedSet = new Set(signedIds);
  return data
    .filter((item) => item.status === 'Issued')
    .flatMap((item) => {
      const seed = parseInt(item.id, 10) || 0;
      const receivedDateOnly = item.dateReceived.split(' at ')[0];
      const dateIssued = item.dateScreened !== '-' ? item.dateScreened : receivedDateOnly;
      const dateShipped = seed % 3 !== 0 ? dateIssued : '';
      const effectivityDate = addDays(dateIssued, (seed % 3) + 1);
      const policyStatus: 'INFORCE' | 'LAPSED' = seed % 11 === 0 ? 'LAPSED' : 'INFORCE';
      // Mock how long ago a lapsed policy actually lapsed, 1-5 years back.
      const lapsedYearsAgo = (seed % 5) + 1;
      if (policyStatus === 'LAPSED' && lapsedYearsAgo > 3) return [];

      const latestEmailFollowUp = seed % 3 !== 0 ? addDays(effectivityDate, (seed % 5) + 1) : '';
      const latestPrintFollowUp = seed % 7 === 0 ? addDays(effectivityDate, (seed % 5) + 2) : '';
      const policyNumber = `${item.planCode}-${((seed * 37) % 900000 + 100000).toString().padStart(6, '0')}-${seed % 2}`;

      return [{
        id: item.id,
        payor: item.payor,
        policyNumber,
        planCode: item.planCode,
        planDesc: item.planDesc,
        premium: item.premium,
        dateReceived: receivedDateOnly,
        dateIssued,
        dateShipped,
        effectivityDate,
        policyStatus,
        latestPrintFollowUp,
        latestEmailFollowUp,
        signed: signedSet.has(item.id),
      }];
    });
}

// Whether staff has followed up on this policy at all (print or email) -
// distinct from `row.signed`, which tracks whether the client's signed form
// has actually come back. A row can be followed-up but still unsigned.
export function isUnsigned(row: FollowUpRow): boolean {
  return !row.latestPrintFollowUp && !row.latestEmailFollowUp;
}
