import { describe, expect, it } from 'vitest';

import { collapseTransferChains } from '../trigger/lib/collapse';
import type { TransferEventData } from '../trigger/types';

const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

function leg(
  tx_hash: string,
  log_index: number,
  sender: string,
  recipient: string,
  amount: number
): TransferEventData {
  return {
    address: USDC_BASE,
    transaction_from: '0xfacilitator',
    sender,
    recipient,
    amount,
    block_timestamp: new Date('2026-10-28T00:00:00Z'),
    tx_hash,
    chain: 'base',
    provider: 'cdp',
    decimals: 6,
    facilitator_id: 'test',
    log_index,
  };
}

const summarize = (rows: TransferEventData[]) =>
  rows.map(({ sender, recipient, amount }) => ({ sender, recipient, amount }));

describe('collapseTransferChains', () => {
  it('keeps a direct buyer -> merchant transfer as-is', () => {
    const rows = collapseTransferChains([
      leg('0xa', 1, '0xbuyer', '0xmerchant', 100),
    ]);

    expect(summarize(rows)).toEqual([
      { sender: '0xbuyer', recipient: '0xmerchant', amount: 100 },
    ]);
  });

  it('collapses buyer -> proxy -> merchant into one payment', () => {
    // Meridian 0x9e073fc0…: the proxy keeps its 1% fee, so only two legs.
    const proxy = '0x8e7769d440b3460b92159dd9c6d17302b036e2d6';
    const rows = collapseTransferChains([
      leg(
        '0xb',
        1,
        '0x1cec447da1915f018bd74006ff6d695468b68dd4',
        proxy,
        9160406
      ),
      leg(
        '0xb',
        2,
        proxy,
        '0xfe8f511d8542f687cf70b798c388ef4c3265794d',
        9068802
      ),
    ]);

    expect(summarize(rows)).toEqual([
      {
        sender: '0x1cec447da1915f018bd74006ff6d695468b68dd4',
        recipient: '0xfe8f511d8542f687cf70b798c388ef4c3265794d',
        amount: 9068802,
      },
    ]);
  });

  it('drops a fee leg the proxy pays out alongside the settlement', () => {
    // thirdweb 0x0afc360c…: buyer -> proxy, proxy -> fee collector, proxy -> merchant.
    const proxy = '0x674a6c77813fc690966b239e8c46fca63039aa95';
    const rows = collapseTransferChains([
      leg(
        '0xc',
        265,
        '0x609f63f0e1995a150e8ed33d4c6b29893a28e52c',
        proxy,
        2490000
      ),
      leg(
        '0xc',
        266,
        proxy,
        '0x13c155ec47fb0a8e3e745b830c97692859fbc5e0',
        7470
      ),
      leg(
        '0xc',
        267,
        proxy,
        '0xf19b97914395563fbf2872e247ecbbd8842470a1',
        2482530
      ),
    ]);

    expect(summarize(rows)).toEqual([
      {
        sender: '0x609f63f0e1995a150e8ed33d4c6b29893a28e52c',
        recipient: '0xf19b97914395563fbf2872e247ecbbd8842470a1',
        amount: 2482530,
      },
    ]);
  });

  it('drops every split leg when a router fans one payment out several ways', () => {
    // Base 0x04a3fcdc…: one payment split into two commission legs, a protocol fee and the merchant.
    const router = '0xc3fa2f571ec2f423539fd24a1b9813553f7b45cd';
    const rows = collapseTransferChains([
      leg(
        '0xd',
        558,
        '0x6120cab3590913056efea9282f92201104be3466',
        router,
        100000
      ),
      leg(
        '0xd',
        559,
        router,
        '0x3a3e0f1b548c0d9bd086ee994276c21a8ae864ca',
        5502
      ),
      leg(
        '0xd',
        560,
        router,
        '0xd3bdaf86e6c92edf61956b51c92a0dfaecdb8460',
        4498
      ),
      leg(
        '0xd',
        562,
        router,
        '0xc520d05e392820217a44eb7a8d9af226c50e6db7',
        1000
      ),
      leg(
        '0xd',
        563,
        router,
        '0x3a3e0f1b548c0d9bd086ee994276c21a8ae864ca',
        89000
      ),
    ]);

    expect(summarize(rows)).toEqual([
      {
        sender: '0x6120cab3590913056efea9282f92201104be3466',
        recipient: '0x3a3e0f1b548c0d9bd086ee994276c21a8ae864ca',
        amount: 89000,
      },
    ]);
  });

  it('keeps one payment per buyer when a proxy settles a batch', () => {
    const rows = collapseTransferChains([
      leg('0xe', 1, '0xbuyer1', '0xproxy', 1000),
      leg('0xe', 2, '0xbuyer2', '0xproxy', 2000),
      leg('0xe', 3, '0xproxy', '0xmerchant1', 990),
      leg('0xe', 4, '0xproxy', '0xmerchant2', 1980),
      leg('0xe', 5, '0xproxy', '0xfees', 30),
    ]);

    expect(summarize(rows)).toEqual([
      { sender: '0xbuyer1', recipient: '0xmerchant1', amount: 990 },
      { sender: '0xbuyer2', recipient: '0xmerchant2', amount: 1980 },
    ]);
  });

  it('keeps independent transfers that share a transaction', () => {
    const rows = collapseTransferChains([
      leg('0xf', 1, '0xbuyer1', '0xmerchant1', 100),
      leg('0xf', 2, '0xbuyer2', '0xmerchant2', 200),
    ]);

    expect(summarize(rows)).toEqual([
      { sender: '0xbuyer1', recipient: '0xmerchant1', amount: 100 },
      { sender: '0xbuyer2', recipient: '0xmerchant2', amount: 200 },
    ]);
  });

  it('keeps a leg an address sent before it first received funds', () => {
    // 0xproxy pays out of its own balance before the payment arrives, so that
    // leg is not part of forwarding this payment.
    const rows = collapseTransferChains([
      leg('0x10', 1, '0xproxy', '0xother', 50),
      leg('0x10', 2, '0xbuyer', '0xproxy', 1000),
      leg('0x10', 3, '0xproxy', '0xmerchant', 1000),
    ]);

    expect(summarize(rows)).toEqual([
      { sender: '0xbuyer', recipient: '0xmerchant', amount: 1000 },
      { sender: '0xproxy', recipient: '0xother', amount: 50 },
    ]);
  });

  it('collapses each transaction independently', () => {
    const rows = collapseTransferChains([
      leg('0x11', 1, '0xbuyer', '0xproxy', 1000),
      leg('0x11', 2, '0xproxy', '0xmerchant', 997),
      leg('0x11', 3, '0xproxy', '0xfees', 3),
      leg('0x12', 1, '0xbuyer', '0xmerchant', 500),
    ]);

    expect(summarize(rows)).toEqual([
      { sender: '0xbuyer', recipient: '0xmerchant', amount: 997 },
      { sender: '0xbuyer', recipient: '0xmerchant', amount: 500 },
    ]);
  });
});
