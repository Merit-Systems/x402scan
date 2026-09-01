import { Network } from "../types";
import { USDC_BASE_TOKEN } from "../constants";

import type { Facilitator, FacilitatorConfig } from "../types";

export const obol: FacilitatorConfig = {
  url: "https://x402.gcp.obol.tech",
};

export const obolFacilitator = {
  id: "obol",
  metadata: {
    name: "Obol",
    image: "https://x402scan.com/obol.png",
    docsUrl: "https://obol.org",
    color: "#2FD9B6",
  },
  config: obol,
  addresses: {
    [Network.BASE]: [
      {
        address: "0xd744494e28b01073514ebc89987b305001ed257a",
        tokens: [USDC_BASE_TOKEN],
        dateOfFirstTransaction: new Date("2026-06-07"),
      },
    ],
  },
} as const satisfies Facilitator;
