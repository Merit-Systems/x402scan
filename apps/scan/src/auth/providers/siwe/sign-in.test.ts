import { describe, it, expect } from "vitest";

import { SiweMessage } from "@signinwithethereum/siwe";
import { privateKeyToAccount } from "viem/accounts";

import { buildSiweMessage } from "./sign-in";
import { SIWE_STATEMENT } from "./constants";

const account = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);

const params = {
  domain: "www.x402scan.com",
  uri: "https://www.x402scan.com",
  address: account.address,
  chainId: 8453,
  nonce: "abcdef1234567890",
};

describe("buildSiweMessage", () => {
  it("constructs a message without throwing", () => {
    expect(() => buildSiweMessage(params)).not.toThrow();
  });

  it("sets issuedAt, which the SiweMessage constructor requires", () => {
    // Regression: omitting issuedAt threw "Unable to parse the message."
    // before the wallet was ever prompted, breaking all EVM sign-in.
    const message = buildSiweMessage(params);
    expect(message.issuedAt).toBeDefined();
    expect(new Date(message.issuedAt!).toString()).not.toBe("Invalid Date");
  });

  it("expires after issuedAt", () => {
    const message = buildSiweMessage(params);
    expect(new Date(message.expirationTime!).getTime()).toBeGreaterThan(
      new Date(message.issuedAt!).getTime()
    );
  });

  it("survives the JSON round trip the provider does on the wire", () => {
    const message = buildSiweMessage(params);
    const parsed = JSON.parse(JSON.stringify(message)) as SiweMessage;
    expect(() => new SiweMessage(parsed)).not.toThrow();
  });

  it("produces a message the server can verify", async () => {
    const message = buildSiweMessage(params);
    const signature = await account.signMessage({
      message: message.prepareMessage(),
    });

    // Mirrors verifySignature in the provider.
    const onTheWire = JSON.parse(JSON.stringify(message)) as SiweMessage;
    const siwe = new SiweMessage(onTheWire);
    const result = await siwe.verify({
      signature,
      domain: siwe.domain,
      nonce: onTheWire.nonce,
    });

    expect(result.success).toBe(true);
    expect(result.data.address).toBe(account.address);
    expect(result.data.statement).toBe(SIWE_STATEMENT);
    expect(new Date(result.data.expirationTime!).getTime()).toBeGreaterThan(
      Date.now()
    );
  });
});
