export type ActionShiftInput = {
  store?: string;
  businessDate?: string;
  grossSales: number;
  orderCount?: number;
  laborDollars?: number;
  laborTargetPct?: number;
  expectedCash?: number;
  enteredDeposit?: number;
  payouts?: number;
  discounts?: number;
  promotions?: number;
  voids?: number;
  lateDeliveryCount?: number;
  lateDeliverySales?: number;
  averageDeliveryMinutes?: number;
  targetDeliveryMinutes?: number;
};

export type ActionShiftAction = {
  id: 'cash-proof' | 'labor-window' | 'payout-proof' | 'delivery-clock' | 'approval-proof' | 'close-packet';
  title: string;
  owner: string;
  evidence: string;
  move: string;
  dollarsObserved: number | null;
  sourceStatus: 'unverified';
  claimBoundary: string;
};

export type ActionShiftResult = {
  store: string;
  businessDate: string;
  sourceStatus: 'unverified';
  summary: string;
  morningActions: ActionShiftAction[];
  nightCloseCheck: string[];
  missingEvidence: string[];
  policy: {
    maxMorningActions: 3;
    benchmark: 'operator-supplied targets only';
    boundary: string;
  };
};

type RankedAction = ActionShiftAction & { score: number };

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function validOptionalNumber(name: string, value: number | undefined): string | null {
  if (value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return `${name} must be a finite, non-negative number.`;
  return null;
}

export function buildActionShift(
  input: ActionShiftInput,
): { ok: true; result: ActionShiftResult } | { ok: false; error: string } {
  if (!Number.isFinite(input.grossSales) || input.grossSales <= 0) {
    return { ok: false, error: 'grossSales must be greater than zero.' };
  }

  const optionalNumbers: Array<[string, number | undefined]> = [
    ['orderCount', input.orderCount],
    ['laborDollars', input.laborDollars],
    ['laborTargetPct', input.laborTargetPct],
    ['expectedCash', input.expectedCash],
    ['enteredDeposit', input.enteredDeposit],
    ['payouts', input.payouts],
    ['discounts', input.discounts],
    ['promotions', input.promotions],
    ['voids', input.voids],
    ['lateDeliveryCount', input.lateDeliveryCount],
    ['lateDeliverySales', input.lateDeliverySales],
    ['averageDeliveryMinutes', input.averageDeliveryMinutes],
    ['targetDeliveryMinutes', input.targetDeliveryMinutes],
  ];
  for (const [name, value] of optionalNumbers) {
    const error = validOptionalNumber(name, value);
    if (error) return { ok: false, error };
  }
  if (input.laborTargetPct !== undefined && input.laborTargetPct > 100) {
    return { ok: false, error: 'laborTargetPct must be between 0 and 100.' };
  }

  const actions: RankedAction[] = [];

  if (input.expectedCash !== undefined && input.enteredDeposit !== undefined) {
    const variance = Math.abs(input.expectedCash - input.enteredDeposit);
    if (variance >= 0.01) {
      actions.push({
        id: 'cash-proof',
        score: 100 + variance / input.grossSales,
        title: 'Verify the cash deposit before booking a shortage',
        owner: 'Closing manager',
        evidence: `${money(input.expectedCash)} expected cash vs ${money(input.enteredDeposit)} entered; ${money(variance)} unresolved variance.`,
        move: 'Match the deposit slip and bank/deposit record to the POS close, then correct the entry or document the exception.',
        dollarsObserved: variance,
        sourceStatus: 'unverified',
        claimBoundary: 'An entered deposit variance is not proof of theft, loss, or bank receipt.',
      });
    }
  }

  if (input.laborDollars !== undefined && input.laborTargetPct !== undefined) {
    const laborPct = input.laborDollars / input.grossSales * 100;
    const excess = Math.max(0, input.laborDollars - input.grossSales * input.laborTargetPct / 100);
    if (laborPct > input.laborTargetPct) {
      actions.push({
        id: 'labor-window',
        score: 80 + excess / input.grossSales,
        title: 'Fix the labor window, not the whole schedule',
        owner: 'Kitchen or floor manager',
        evidence: `${money(input.laborDollars)} labor is ${laborPct.toFixed(1)}% of ${money(input.grossSales)} sales vs the operator target of ${input.laborTargetPct.toFixed(1)}%; ${money(excess)} sits above that target.`,
        move: 'Check the current clock and approved schedule by half-hour; move one concrete start, break, or cut only where demand and coverage support it.',
        dollarsObserved: excess,
        sourceStatus: 'unverified',
        claimBoundary: 'The amount above target is an observed target variance, not guaranteed savings or unauthorized labor.',
      });
    }
  }

  if ((input.payouts ?? 0) > 0) {
    actions.push({
      id: 'payout-proof',
      score: 75 + (input.payouts ?? 0) / input.grossSales,
      title: 'Prove and code every payout',
      owner: 'Closing manager',
      evidence: `${money(input.payouts ?? 0)} in POS payouts needs receipt and ledger coding.`,
      move: 'Attach each receipt, name the business purpose, and map it to the correct expense bucket before close.',
      dollarsObserved: input.payouts ?? 0,
      sourceStatus: 'unverified',
      claimBoundary: 'A payout is not a leak unless supporting evidence shows it was invalid, duplicated, or miscoded.',
    });
  }

  if ((input.lateDeliveryCount ?? 0) > 0) {
    const minutes = input.averageDeliveryMinutes !== undefined
      ? ` Average delivery time was ${input.averageDeliveryMinutes.toFixed(1)} minutes${input.targetDeliveryMinutes !== undefined ? ` vs the operator target of ${input.targetDeliveryMinutes.toFixed(1)}` : ''}.`
      : '';
    actions.push({
      id: 'delivery-clock',
      score: 70 + (input.lateDeliverySales ?? 0) / input.grossSales,
      title: 'Coach the delivery bottleneck from the late-ticket list',
      owner: 'Kitchen manager',
      evidence: `${input.lateDeliveryCount} late deliver${input.lateDeliveryCount === 1 ? 'y' : 'ies'}${input.lateDeliverySales !== undefined ? ` covering ${money(input.lateDeliverySales)}` : ''}.${minutes}`,
      move: 'Review the late tickets by promise time, make-line completion, handoff, and driver arrival; choose one controllable bottleneck for tonight.',
      dollarsObserved: input.lateDeliverySales ?? null,
      sourceStatus: 'unverified',
      claimBoundary: 'Sales tied to late tickets are exposed revenue, not proven lost sales or recoverable cash.',
    });
  }

  const approvalReviewSize = Math.max(input.discounts ?? 0, input.promotions ?? 0, input.voids ?? 0);
  if (approvalReviewSize > 0) {
    actions.push({
      id: 'approval-proof',
      score: 60 + approvalReviewSize / input.grossSales,
      title: 'Close the approval trail on discounts, promos, and voids',
      owner: 'Manager on duty',
      evidence: `${money(input.discounts ?? 0)} discounts, ${money(input.promotions ?? 0)} promos, and ${money(input.voids ?? 0)} voids were supplied for review.`,
      move: 'Match each exception to the ticket, reason, manager authorization, employee, tender, and timestamp; resolve only unsupported exceptions.',
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: 'These categories can overlap. They are not added together, and approved exceptions are not automatically waste, abuse, or theft.',
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'close-packet',
      score: 1,
      title: 'Build tonight\'s complete close packet',
      owner: 'Closing manager',
      evidence: `${money(input.grossSales)} in typed sales was supplied, but no supported exception crossed an operator-defined rule.`,
      move: 'Save the final POS close, deposit proof, payout receipts, time clock, invoice packet, and delivery exceptions under the same business date.',
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: 'No flag from typed inputs does not prove the shift was clean.',
    });
  }

  const rankedActions = actions
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
  const selectedIds = new Set(rankedActions.map((action) => action.id));
  const nightCloseCheck: string[] = [];
  const missingEvidence = ['Final POS close report for the same store, business date, timezone, and cutoff.'];

  if (selectedIds.has('cash-proof')) {
    nightCloseCheck.push('Attach the deposit slip or bank/deposit proof and reconcile expected cash to the final entered deposit.');
    missingEvidence.push('Deposit slip or matching bank/deposit record.');
  }
  if (selectedIds.has('labor-window')) {
    nightCloseCheck.push('Save the approved schedule and final time clock, including manager edits and reasons.');
    missingEvidence.push('Current time clock, approved schedule, wage basis, and manager edits.');
  }
  if (selectedIds.has('payout-proof')) {
    nightCloseCheck.push('Attach receipts and business-purpose coding for every payout.');
    missingEvidence.push('Payout detail, receipts, payee, business purpose, and ledger coding.');
  }
  if (selectedIds.has('delivery-clock')) {
    nightCloseCheck.push('Save the late-ticket exception list with cause and manager follow-up.');
    missingEvidence.push('Order-level promise, make-line completion, ready, handoff, and driver-arrival timestamps.');
  }
  if (selectedIds.has('approval-proof')) {
    nightCloseCheck.push('Confirm ticket-level reason and manager authorization for discounts, promos, refunds, and voids.');
    missingEvidence.push('Ticket-level exception detail with employee, approver, reason, tender, and timestamp.');
  }
  if (selectedIds.has('close-packet')) {
    nightCloseCheck.push('Save one complete, same-scope close packet before leaving the store.');
  }

  const morningActions = rankedActions
    .map(({ score: _score, ...action }) => action);

  return {
    ok: true,
    result: {
      store: input.store?.trim() || 'Unspecified store',
      businessDate: input.businessDate?.trim() || 'Unspecified business date',
      sourceStatus: 'unverified',
      summary: `${morningActions.length} ranked action${morningActions.length === 1 ? '' : 's'} from ${money(input.grossSales)} in typed gross sales. Verify against source evidence before acting.`,
      morningActions,
      nightCloseCheck,
      missingEvidence,
      policy: {
        maxMorningActions: 3,
        benchmark: 'operator-supplied targets only',
        boundary: 'This tool ranks review work. It does not make theft, discipline, contract, bank-reconciliation, or guaranteed-savings claims.',
      },
    },
  };
}
