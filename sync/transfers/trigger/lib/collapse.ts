import type { TransferEventData } from "@/trigger/types";

// Some facilitators don't settle payments directly from buyer to merchant.
// Meridian, for example, routes every payment through a fee-proxy contract:
// the buyer's transferWithAuthorization moves funds buyer -> proxy, then the
// proxy forwards them proxy -> merchant minus a 1% fee, all in one
// transaction. fluxa routes through a fixed escrow the same way, and
// thirdweb's proxy fans out to fee collectors and the merchant.
//
// We ingest every USDC Transfer event in facilitator-submitted transactions,
// so each such payment produces two (or more) rows and its count and volume
// are doubled in every stat that sums over rows (issue #1024).
//
// Within a single transaction, an address that receives funds and forwards
// them afterwards is such a pass-through, not a real buyer or seller. This
// collapses each chain buyer -> proxy -> ... -> merchant into one transfer:
// the origin leg's sender and log_index, the terminal leg's recipient, and
// the terminal leg's amount (what the merchant actually received). When a
// proxy fans out into several transfers, the one closest in amount to the
// incoming payment is the settlement; the rest (fee payouts) and any legs
// that don't pair up cleanly are kept as-is rather than guessed at.
export function collapseTransferChains(
  batch: TransferEventData[]
): TransferEventData[] {
  const byTx = new Map<string, TransferEventData[]>();
  for (const event of batch) {
    const key = `${event.chain}:${event.tx_hash}`;
    const legs = byTx.get(key);
    if (legs) {
      legs.push(event);
    } else {
      byTx.set(key, [event]);
    }
  }

  const collapsed: TransferEventData[] = [];
  for (const legs of byTx.values()) {
    if (legs.length === 1) {
      collapsed.push(legs[0]!);
    } else {
      collapsed.push(...collapseTx(legs));
    }
  }
  return collapsed;
}

function collapseTx(legs: TransferEventData[]): TransferEventData[] {
  const sorted = [...legs].sort(
    (a, b) => (a.log_index ?? 0) - (b.log_index ?? 0)
  );
  const position = new Map(sorted.map((leg, index) => [leg, index]));

  const firstReceived = new Map<string, number>();
  const lastSent = new Map<string, number>();
  sorted.forEach((leg, index) => {
    if (!firstReceived.has(leg.recipient)) {
      firstReceived.set(leg.recipient, index);
    }
    lastSent.set(leg.sender, index);
  });

  const isPassThrough = (address: string) => {
    const received = firstReceived.get(address);
    const sent = lastSent.get(address);
    return received !== undefined && sent !== undefined && received < sent;
  };

  const consumed = new Set<TransferEventData>();
  const result: TransferEventData[] = [];

  for (const origin of sorted) {
    if (consumed.has(origin) || isPassThrough(origin.sender)) {
      continue;
    }
    consumed.add(origin);

    let terminal = origin;
    while (isPassThrough(terminal.recipient)) {
      const candidates = sorted.filter(
        (leg) =>
          !consumed.has(leg) &&
          leg.sender === terminal.recipient &&
          position.get(leg)! > position.get(terminal)!
      );
      if (candidates.length === 0) {
        break;
      }
      const target = terminal.amount;
      const next = candidates.reduce((best, leg) =>
        Math.abs(leg.amount - target) < Math.abs(best.amount - target)
          ? leg
          : best
      );
      consumed.add(next);
      terminal = next;
    }

    result.push(
      terminal === origin
        ? origin
        : { ...origin, recipient: terminal.recipient, amount: terminal.amount }
    );
  }

  for (const leg of sorted) {
    if (!consumed.has(leg)) {
      result.push(leg);
    }
  }

  return result;
}
