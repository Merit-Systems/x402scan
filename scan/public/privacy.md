# x402scan Privacy Policy

**Effective as of October 29, 2025**

This Privacy Policy describes how **Merit Systems, Inc.** (“**x402scan**,” “**we**,” “**us**,” or “**our**”) collects, uses, discloses, and safeguards information in connection with **x402scan.com**, our APIs, interfaces, agent and chat features, block explorer pages, and any other websites, apps, or online services that link to this Privacy Policy (collectively, the “**Services**”).

We may provide additional or supplemental notices for particular features or regions; those supplements will control to the extent they conflict with this Policy.

---

## Quick Summary (At a Glance)

- **Non‑custodial by design.** We do not hold your funds or private keys. Embedded wallets are provided by **Coinbase Developer Platform (CDP)** using MPC; browser wallets connect client‑side using WalletConnect/EIP‑1193.
- **On‑chain is public and permanent.** Wallet addresses, transactions, and resource payments recorded on Base, Solana, Polygon and other supported networks are public and immutable. We cannot delete or alter blockchain records.
- **AI model routing.** If you use agent/chat features, your prompts and related context are sent to the selected **third‑party AI model providers** (e.g., OpenAI, Anthropic, Google, xAI, Meta, DeepSeek) to generate responses. Their use of data is governed by their own privacy policies.
- **Analytics & performance.** We use **PostHog** (optional) and **Vercel Analytics/Speed Insights** to understand usage and improve performance.
- **Proxy & paid API access (x402).** Our proxy may log limited request/response metadata for discovery/debugging **only when enabled** (see **“Proxy & API routing data”**).
- **What we do not collect.** We do not collect or store private keys, seed phrases, or card/bank details for onramps (those are handled by Coinbase Pay/CDP).
- **Your choices.** You can connect/disconnect wallets, delete chats, set chat visibility, and opt out of marketing emails. Analytics opt‑out may be available in‑product; you can also control cookies in your browser.
- **Region‑specific rights.** Additional disclosures for **California (CPRA)** and **EEA/UK (GDPR)** appear below.

---

## Index

1. Information We Collect
2. Sources of Information
3. How We Use Information
4. How We Disclose Information
5. Public & Immutable Blockchain Data
6. Cookies, Analytics & Tracking
7. Your Choices & Rights
8. Data Security
9. International Data Transfers
10. Data Retention
11. Children
12. Changes to This Policy
13. How to Contact Us
14. California Notice (CPRA)
15. EEA/UK Notice (GDPR)
16. GLBA Consumer Privacy Notice (applies only if x402scan is treated as a “financial institution”)

---

## 1) Information We Collect

### A. Information you provide directly

- **Account & authentication.**
  - **Wallet address(es)** (public blockchain identifiers).
  - **Sign‑In With Ethereum (SIWE) data** (EIP‑4361): signed message, nonce, domain, expiration, verification timestamp.
  - **Optional contact info** (e.g., email, name, avatar).

- **Chats & agent interactions.** Messages, prompts, attachments, tool calls (which x402 resources were invoked), conversation context, and visibility settings (e.g., public/private).
- **Support & communications.** Content of messages you send to us (email, forms, social).
- **Resource listings.** If you list an x402‑compatible API, we collect listing metadata (endpoint, pricing, networks, terms, and related public information).

### B. Wallet, payment & onramp data

- **Embedded wallets (CDP/MPC).** We store **wallet identifiers**, user ID, wallet name/type, and timestamps. **We do not store private keys or seed phrases.**
- **Connected browser wallets.** We receive your address and transaction status from your client‑side wallet provider (MetaMask, Phantom, etc.). Transactions are signed in your browser; we cannot initiate transactions without your approval.
- **Onramp sessions (Coinbase Pay).** We generate a session token and track amount intent, status, and (after completion) a transaction hash. **We do not receive your card/bank details or KYC documents**—those are handled by Coinbase.

### C. Blockchain, telemetry & platform usage

- **Public blockchain data.** Transaction metadata, block numbers/timestamps, addresses, token balances, transfer events, facilitator mappings, and other public ledger records.
- **Usage metrics.** Tool call counts, free‑tier usage, message counts, rate limits/quota usage.
- **Device & online activity data (automatic collection).** IP address, general location (city/region), browser/OS type and version, device type, user agent, pages viewed, referring/exit pages, time on page, clickstream, access times, and similar event data.

### D. Analytics & performance data

- **PostHog (optional).** Page views, feature use, click events, errors, and (if enabled) session recordings.
- **Vercel Analytics / Speed Insights.** Web vitals, load timings, edge region, and user agent information.

> **Sensitive data we do not seek:** We do **not** request or store private keys, seed phrases, payment card details, or government IDs for ordinary use of x402scan. Coinbase handles any KYC/AML required for onramp services.

---

## 2) Sources of Information

- **You**, when you connect a wallet, use chat/agent features, list a resource, or contact support.
- **Blockchain networks & indexers** (e.g., Base, Solana, Polygon; BitQuery; Google BigQuery; CDP read APIs).
- **Wallet & onramp providers** (CDP, WalletConnect‑compatible wallets, Coinbase Pay) for session and transaction status.
- **Analytics & infrastructure providers** (PostHog, Vercel, Neon/PostgreSQL, Redis [if enabled], Trigger.dev, hosting/CDN).
- **Linked services** you choose to connect (e.g., GitHub for certain features).

---

## 3) How We Use Information

We use information to:

- **Provide and operate the Services,** including wallet integration, resource discovery, block explorer views, chat/agent functionality, and x402 micropayments for paid APIs.
- **Authenticate sessions** (e.g., SIWE/NextAuth), maintain profiles, and secure accounts.
- **Facilitate transactions** by preparing x402 payment headers and relaying requests; on‑chain payments occur peer‑to‑peer.
- **Operate the proxy** to forward requests, handle “402 Payment Required,” register new x402 resources automatically, and (if enabled) log request/response metadata for discovery and debugging.
- **Personalize features** (e.g., suggested resources) and improve the Services.
- **Perform analytics,** monitor performance, and run experiments/feature flags.
- **Communicate with you,** including service notices, updates, and support.
- **Ensure security and integrity** (fraud/abuse detection, incident response).
- **Comply with law** and enforce our Terms.
- **Create de‑identified/aggregated data** for lawful business purposes.

Where required (e.g., for marketing emails), we rely on your **consent**. Otherwise we rely on performance of a contract, **legitimate interests** (e.g., security, improvement), or **legal obligations** as applicable.

---

## 4) How We Disclose Information

We disclose information to:

- **Service providers / processors** that help us operate the Services (hosting, database, analytics, job processing, monitoring, email, and customer support).
- **Wallet & onramp providers.** Coinbase Developer Platform (embedded wallets, MPC, OAuth), Coinbase Pay (fiat‑to‑crypto onramp), and connected browser wallets.
- **AI model providers** when you use chat/agent features (OpenAI, Anthropic, Google, xAI, Meta, DeepSeek, and similar). Your prompts and context are sent to the selected provider(s) to generate responses. Their privacy policies apply to their processing.
- **Blockchain networks & indexers** as needed to submit or query transactions and display public data.
- **Analytics & performance providers** (PostHog, Vercel).
- **Linked third‑party services** you choose to connect (e.g., GitHub); their use is governed by their policies and your settings.
- **Other users / the public** if you set chats to public or publish resource listings; explorer pages surface public on‑chain data.
- **Professional advisors** (lawyers, auditors, insurers, bankers).
- **Authorities and legal requests** when we believe disclosure is required or appropriate.
- **Business transferees** in connection with a merger, financing, acquisition, or similar transaction.

We do **not** sell your personal information, and we do **not** “share” it for cross‑context behavioral advertising as defined by California law.

---

## 5) Public & Immutable Blockchain Data

Transactions, token transfers, and wallet balances on supported networks are **public** and typically **cannot be altered or deleted**. Anyone—including us—can view, copy, analyze, and redistribute this data. If you associate a wallet address with your identity (e.g., by providing an email or using it in a public profile), that association may become visible to others. Consider using separate addresses for different contexts if you wish to limit linkage.

---

## 6) Cookies, Analytics & Tracking

### A. Cookies & local storage

We use cookies and similar technologies to authenticate sessions (HTTP‑only cookies), remember preferences, analyze usage, and improve performance. You can usually set your browser to block or delete cookies, but some features may not work properly without them.

### B. Analytics & session replay

- **PostHog (optional):** captures usage analytics and may capture session replays (clicks, scrolls, UI interactions). We configure it for product analytics and debugging; you can further control tracking in your browser/device.
- **Vercel Analytics / Speed Insights:** collects web vitals, performance timings, and related diagnostics.

### C. Do Not Track / Global Privacy Control

Some browsers offer **Do Not Track** or **Global Privacy Control (GPC)** signals. We do not use your data for cross‑context behavioral advertising. Where required by law, we honor GPC signals for “sale/share” opt‑out; our current practice does not involve such “sale/share.”

---

## 7) Your Choices & Rights

- **Wallet connections.** Connect or disconnect wallets at any time. We cannot transact without your explicit approval.
- **Chats & visibility.** You may delete chats and set visibility (public/private). Public chats are viewable by others.
- **Marketing emails.** Opt out by using the “unsubscribe” link in any marketing email.
- **Cookies & analytics.** Control cookies via your browser/device settings. If an in‑product analytics toggle is available, you can use it to reduce analytics collection.
- **Access, deletion, portability (where applicable).** Contact us to request access to, deletion of, or a machine‑readable copy of your personal information.
- **Limits of deletion.** We cannot delete **on‑chain** data or public blockchain records. Deleting your account or chats does not affect historical blockchain transactions.
- **Do not paste secrets.** Do not submit private keys, seed phrases, or confidential secrets in chats or support channels.

Additional rights for **California** and **EEA/UK** residents are described below.

---

## 8) Data Security

We use technical and organizational measures appropriate to the nature of the data we process, including:

- TLS for data in transit;
- Secure database hosting (e.g., Neon/PostgreSQL) and access controls;
- Role‑based access, logging, and key rotation for back‑office systems;
- Non‑custodial wallet design and **MPC** key management via **CDP**;
- Client‑side transaction signing for connected wallets.

No system is perfectly secure, and we cannot guarantee absolute security. If you believe your account or wallet has been compromised, please contact us immediately.

---

## 9) International Data Transfers

We are headquartered in the **United States** and use service providers in the U.S. and other countries. Your information may be processed outside your country of residence, where privacy laws may be different. Where required, we use appropriate safeguards (e.g., Standard Contractual Clauses for EEA/UK data) for such transfers.

---

## 10) Data Retention

We retain information for as long as necessary to provide the Services, comply with legal obligations, resolve disputes, enforce agreements, and for other legitimate and lawful business purposes. Illustrative examples:

- **Sessions (NextAuth):** session tokens generally expire after ~30 days.
- **Chats & messages:** retained until you delete them (or until we implement automatic deletion policies).
- **Onramp session metadata:** retained as needed to reconcile transactions and meet accounting/legal requirements.
- **Proxy logs (if enabled):** retained for limited periods for discovery/debugging.
- **Analytics data:** retained in accordance with our internal schedules and provider defaults.

When no longer needed, we may delete, de‑identify, or aggregate the data in accordance with applicable law.

---

## 11) Children

The Services are not intended for individuals under **16** years of age. If we learn we have collected personal information from a child contrary to law, we will delete it as required.

---

## 12) Changes to This Policy

We may update this Privacy Policy from time to time. If we make material changes, we will update the “Effective as of” date and may provide additional notice as appropriate. Your continued use of the Services after an update signifies acceptance of the revised Policy.

---

## 13) How to Contact Us

**Email:** [privacy@merit.systems](mailto:privacy@merit.systems)
**Mail:** 224 West 35th Street, Ste 500 #2218, New York, NY 10001, USA

If you are in the EEA/UK and believe we have not adequately addressed your concern, you may have the right to lodge a complaint with your local supervisory authority.

---

## 14) California Notice (CPRA)

**Categories collected:** Identifiers (wallet addresses, email if provided), internet/network activity (usage, device, analytics), geolocation (coarse, from IP), commercial information (on‑chain transactions related to API purchases), inferences (feature engagement), and audio/visual/electronic information (session replay if enabled). We do **not** intentionally collect sensitive personal information such as precise geolocation, government IDs, or financial account numbers; onramp KYC/AML is handled by Coinbase.

**Sources:** You, your devices/browsers, blockchain networks/indexers, wallet/onramp providers, analytics providers, and linked services you authorize.

**Business or commercial purposes:** See **How We Use Information** above.

**Disclosures:** See **How We Disclose Information** above (service providers/processors, AI providers when you use chat, analytics, infrastructure). We do **not** sell personal information and do **not** “share” it for cross‑context behavioral advertising.

**Your CPRA rights:** Access, deletion, correction, portability, and to limit use/disclosure of sensitive PI (not applicable based on our current practices). You also have the right to be free from discrimination for exercising your rights. To exercise rights, contact **[privacy@merit.systems](mailto:privacy@merit.systems)**. We may verify your request and ask for additional information to confirm your identity.

**Retention:** See **Data Retention** above.

---

## 15) EEA/UK Notice (GDPR)

**Controller:** Merit Systems, Inc. (contact details above).

**Legal bases:**

- **Contract:** to provide the Services at your request (e.g., session/auth, proxying paid API calls).
- **Legitimate interests:** security, fraud prevention, product improvement, analytics proportionate to user expectations.
- **Consent:** marketing emails, certain cookies/analytics where required, and any other processing we identify as based on consent.
- **Legal obligation:** where processing is necessary to comply with applicable law.

**Your rights:** Access, rectification, erasure, restriction, objection, portability, and withdrawal of consent (where processing is based on consent). To exercise rights, contact **[privacy@merit.systems](mailto:privacy@merit.systems)**. You may also lodge a complaint with your local supervisory authority.

**International transfers:** See **International Data Transfers** above; we rely on appropriate safeguards (e.g., SCCs) for transfers outside the EEA/UK.

---

## 16) GLBA Consumer Privacy Notice (Only If Applicable)

**This section applies only if, in a specific product context, x402scan is deemed a “financial institution” under the Gramm‑Leach‑Bliley Act (GLBA).** If GLBA does not apply to your use of x402scan, this section does not apply.

**Why?** Federal law gives consumers the right to limit some, but not all, sharing of financial information and requires us to explain how we collect, share, and protect such information.

**What?** Depending on the product/service, we may collect and share information such as: wallet/account identifiers and transactions related to resource payments, payment history recorded on public blockchains, and related metadata. **We do not collect payment card/bank details or KYC documents for onramps (Coinbase handles those directly).**

**How?** All financial companies need to share customers’ information to run their everyday business. In the table below, “sharing” refers to information handled off‑chain by us (not public blockchain data).

| Reasons we can share personal information                                                     | Does x402scan share? | Can you limit this sharing? |
| --------------------------------------------------------------------------------------------- | -------------------: | --------------------------: |
| For our everyday business purposes (e.g., to operate the Services, respond to legal requests) |              **Yes** |                      **No** |
| For our marketing purposes                                                                    |               **No** |                         n/a |
| For joint marketing with other financial companies                                            |               **No** |                         n/a |
| For our affiliates’ everyday business purposes                                                |               **No** |                         n/a |
| For our affiliates to market to you                                                           |               **No** |                         n/a |
| For nonaffiliates to market to you                                                            |               **No** |                         n/a |

**How we protect information.** We use security measures that comply with federal law, including computer safeguards and secured files and buildings.

**How we collect information.** We collect information when you open an account, connect a wallet, use the Services, or otherwise interact with us. We also collect from public sources (blockchains), service providers, and companies you connect (e.g., Coinbase, wallet providers).

**State laws.** State laws may give you additional rights. See **California Notice (CPRA)** above.

**Who we are.** Merit Systems, Inc. operates x402scan.com.

---

## Additional Product‑Specific Disclosures

### Non‑custodial clarification

- **Embedded wallets (CDP):** Controlled via your Coinbase OAuth session/MPC. We cannot access your private keys or move your funds without your authorization.
- **Connected wallets:** Transactions are signed client‑side in your wallet provider; we cannot initiate them.
- **Free‑tier wallet:** If offered, the free‑tier wallet is platform‑managed for cost control; it is separate from user‑controlled wallets.

### Proxy & API routing data

Our `/api/proxy` endpoint registers x402 resources, handles `402 Payment Required`, and forwards requests with cryptographic payment headers. **When a share/logging flag is enabled**, we may log limited request/response metadata to improve discovery and debugging of public x402 resources. We do not intend to store sensitive payloads for paid resources and design the system for public APIs; avoid including secrets in requests.

### AI model providers

When you use agent/chat features, your content is sent to chosen AI providers for inference and streamed back. Providers process data under their terms. We recommend reviewing the provider’s privacy policy before enabling that provider in your settings.

---

## Other Sites and Services

Our Services may contain links to third‑party websites, services, wallets, onramps, and APIs. We do not control these third parties and are not responsible for their practices. Review their privacy policies before sharing information with them.

---

**Last revised:** October 29, 2025
