# X402SCAN

**Terms of Service**

**Last Updated:** October 29, 2025

Welcome to x402scan.com, operated by Merit Systems, Inc. (“**x402scan**,” “**Company**,” “**we**,” or “**us**”). These Terms of Service (the “**Terms**”), together with any applicable **Supplemental Terms** referenced herein, form a binding agreement (this “**Agreement**”) between you (“**you**” or “**User**”) and x402scan governing your access to and use of (a) the website at **x402scan.com** and any related sites, interfaces, SDKs, subdomains, or documentation that link to these Terms, and (b) the services, features, and products provided by x402scan in connection therewith (collectively, the “**Services**”).

BY ACCESSING OR USING THE SERVICES, INCLUDING BY CLICKING “I ACCEPT,” AUTHENTICATING WITH YOUR WALLET, OR BROWSING THE WEBSITE, YOU REPRESENT THAT: (1) YOU HAVE READ, UNDERSTAND, AND AGREE TO BE BOUND BY THESE TERMS; (2) YOU ARE OF LEGAL AGE TO FORM A BINDING CONTRACT; AND (3) YOU HAVE AUTHORITY TO BIND YOURSELF OR THE ENTITY YOU REPRESENT. IF YOU DO NOT AGREE, DO NOT ACCESS OR USE THE SERVICES.

PLEASE NOTE: SECTION 18 CONTAINS AN ARBITRATION AGREEMENT AND CLASS ACTION WAIVER. UNLESS YOU OPT OUT WITHIN 30 DAYS, DISPUTES WILL BE RESOLVED BY BINDING ARBITRATION ON AN INDIVIDUAL BASIS.

We recommend you print or save a copy of these Terms for your records.

We may update these Terms at any time in our discretion. When we do, we will post the revised Terms and update the “Last Updated” date and/or notify you (e.g., by email or in‑product notice). Unless otherwise stated, changes apply to new users immediately and to existing registered users 30 days after posting/notice. Your continued use after the effective date constitutes acceptance.

---

## 1. Description of the Services

1.1 **What x402scan Does.** x402scan is a **blockchain analytics and discovery layer** for API resources that implement the **x402 protocol** (micropayments for API access). The Services enable users, human or agent, to:

- discover, list, and evaluate paid APIs that accept x402 payments (“**x402 Resources**”);
- view blockchain data related to the x402 ecosystem (e.g., transactions, addresses, resource mappings);
- connect or create non‑custodial wallets and facilitate on‑chain payments to x402 Resource providers;
- use AI‑powered chat and agent tools that can call x402 Resources on your behalf; and
- optionally use fiat onramp services provided by third parties (e.g., Coinbase Pay).

  1.2 **Non‑Custodial Wallets & Onramp.**

- **Embedded Wallets (CDP/MPC).** We integrate with **Coinbase Developer Platform (CDP)** to help you create and use **non‑custodial** MPC wallets. You control these wallets via your Coinbase authentication; **we do not hold private keys** and store only wallet identifiers and necessary metadata.
- **Connected Wallets.** You may connect a browser wallet (e.g., via WalletConnect/EIP‑1193). **All signing occurs client‑side**; we cannot initiate transactions without your approval.
- **Onramp.** Fiat‑to‑crypto services (e.g., **Coinbase Pay**) are provided by third parties. KYC/AML, payment processing, and compliance are handled by those providers, not by x402scan.

  1.3 **x402 Protocol and On‑Chain Interactions.** The x402 protocol enables on‑chain, per‑request micropayments—typically in **USDC** on supported networks (e.g., Base, Solana, Polygon). **On‑chain interactions are not part of the Services we operate or control**, even when initiated via our UI or proxy headers. All such interactions occur on public blockchains and are governed by the relevant network rules and third‑party terms.

  1.4 **Discovery, Proxy & Auto‑Registration.** Our discovery index catalogs x402 Resources. When your client encounters an HTTP **402 Payment Required**, our proxy may (i) help construct payment headers, (ii) forward requests with payment proofs, and (iii) **auto‑register** newly encountered x402 Resources. If you enable request/response logging (e.g., `share_data=true`), we may store limited request/response metadata to improve listings and debugging. **Do not include secrets or confidential data** in requests sent through our proxy.

  1.5 **Data Sources.** We rely on third‑party data providers and public datasets (e.g., Coinbase Data Platform, BitQuery, Google BigQuery, public RPC endpoints) for blockchain analytics. Resulting views, charts, and labels are informational only and may be incomplete, delayed, or inaccurate.

  1.6 **AI & Agent Tools.** Our AI features route your prompts (and associated context) to third‑party model providers (e.g., OpenAI, Anthropic, Google, Meta, xAI, DeepSeek) via our server‑side keys. Agents may **automatically call x402 Resources** using your authorized wallet(s) and settings. **You are responsible for all tool calls made by you or your agents**, including payments and resulting outputs.

  1.7 **No Advice; Informational Only.** The Services provide analytics, indexes, and tooling. **We do not provide legal, financial, investment, tax, or professional advice.** Verify information independently before acting.

  1.8 **Beta Services.** We may launch beta or experimental features that are provided **“AS IS”** and may change or be discontinued without notice.

  1.9 **Communications.** Subject to our Privacy Policy, you consent to receive communications (e.g., emails, product notices) about your account, features, updates, and industry news.

---

## 2. Accounts, Authentication & Eligibility

2.1 **Registration.** Certain features require an account (“**Account**”). You may authenticate via **Sign‑In With Ethereum (EIP‑4361)**, OAuth (e.g., Coinbase), or other methods we support. You must provide accurate and current information and keep it updated. You must be at least **18 years old** and not barred from using the Services under applicable law or sanctions rules.

2.2 **Security.** You are responsible for your Account and for maintaining the security of your wallets, devices, credentials, and API keys. Notify us immediately of any suspected unauthorized access. We are not responsible for losses due to compromised devices or keys.

2.3 **Sessions & Data.** We use session tokens/cookies and store standard account metadata (see our Privacy Policy). We may link multiple authentication methods/wallets to your Account.

2.4 **Third‑Party Accounts.** If you link third‑party accounts (e.g., Coinbase, GitHub), you authorize our access consistent with those providers’ terms. You are solely responsible for compliance with such terms and for any data shared via the linkage.

2.5 **Ownership of Account.** Notwithstanding any contrary label, **Accounts are licensed, not sold**, and remain our property. We may suspend or terminate inactive or non‑compliant Accounts.

---

## 3. Roles, Listings & Resource Providers

3.1 **User Roles.** Users may act as:

- **Explorers/Buyers** (discover and purchase access to x402 Resources),
- **Resource Providers** (list, describe, and accept x402 payments for API endpoints), and/or
- **Agents/Developers** (configure automations that call Resources on behalf of a User).

  3.2 **Resource Listings.** Resource Providers are solely responsible for their listings (metadata, pricing, `maxAmountRequired`, network/asset details, documentation, status, and content). Providers must ensure their Resources comply with applicable law and do not require access to unlawful or sensitive data.

  3.3 **Service Levels & Uptime.** **x402scan does not guarantee any Resource’s uptime, accuracy, latency, or suitability.** Providers are responsible for their own APIs and customer support.

  3.4 **Changes to Listings.** Providers may update or delist Resources at any time, subject to applicable law and existing on‑chain payment flows. We may remove or modify listings that violate these Terms or law, or for any reason in our discretion.

  3.5 **No Endorsement.** Listings and discovery results do not constitute endorsement by x402scan. We do not verify Providers or the quality of their APIs.

---

## 4. Wallets, Payments & Fees

4.1 **Non‑Custodial by Design.** We **do not custody** digital assets. All blockchain transactions are authorized by you and executed by your chosen wallet(s). **Transactions are final** once recorded on the applicable blockchain.

4.2 **Onramp.** Fiat purchases are processed by third‑party onramps (e.g., Coinbase Pay). Their KYC/AML, payment, dispute, and refund policies apply. We may receive status updates and transaction hashes but do not handle your fiat funds.

4.3 **Free Tier.** We may offer a limited **free tier** that uses a **platform‑controlled wallet** solely for cost management and testing. We may throttle, limit, or discontinue free tier access at any time. You acquire **no rights** in the free‑tier wallet or its funds.

4.4 **Paid Tier.** For paid usage, you authorize our tooling to prepare and submit payment headers on your behalf using your **non‑custodial** wallet(s). You are responsible for funding your wallet, gas/fees, and all amounts paid to Providers.

4.5 **Platform/Protocol Fees.** We may charge platform or protocol fees, including fees embedded in x402 transactions or settlement flows. **You agree not to circumvent, avoid, or reduce** any such fees.

4.6 **Taxes.** You are responsible for all taxes associated with your use of the Services and x402 Resources, except taxes on our net income. We may provide tax forms or disclosures where required by law.

4.7 **Refunds.** Because transactions are on‑chain and executed peer‑to‑peer, **refunds are not guaranteed** and are solely at the discretion of the receiving party and applicable chain mechanics.

---

## 5. AI, Agents & Spending Controls

5.1 **Your Authorization.** By enabling agent tools, you **authorize** the agent to send your prompts and context to third‑party LLMs and to call x402 Resources within the **spending limits** you configure (e.g., per‑call `maxAmountRequired`, per‑session limits). You are responsible for reviewing and setting limits.

5.2 **Outputs May Be Incorrect.** **AI outputs can be inaccurate, incomplete, or inappropriate.** Do not rely on AI outputs without independent verification.

5.3 **Your Responsibility.** You are responsible for all **tool calls, payments, and consequences** initiated by you or your agents. We are not responsible for unexpected spend arising from your configuration, prompts, or third‑party model behavior.

---

## 6. Content & Licenses

6.1 **Your Content.** You retain ownership of content you submit to the Services (e.g., listings, documentation, reviews, prompts, messages, tags) (“**Your Content**”). You grant x402scan a **worldwide, non‑exclusive, royalty‑free, sublicensable license** to host, use, reproduce, modify, publish, display, and distribute Your Content as needed to operate, improve, and promote the Services, including public discovery features, unless you mark items as private where that option exists.

6.2 **Public vs. Private.** Some features (e.g., public listings, public chats) are **public by default**. Do not upload confidential information. For proxy requests, avoid sharing secrets; if you do, you do so at your own risk.

6.3 **AI Improvement.** Where permitted by law and your settings, you grant us the right to use de‑identified logs and artifacts from Your Content and tool calls to **operate and improve** the Services (including model selection, safety, ranking, and anti‑fraud). We do **not** use Your Content to **train** third‑party models unless those providers independently do so under their own terms and your configuration.

6.4 **User Content & Accuracy.** Content from other users is their responsibility. We do not endorse or verify user content and may remove it at any time.

6.5 **Our IP.** The Services and all related software, graphics, trademarks, and content (excluding Your Content) are owned by x402scan or its licensors and are protected by IP laws. You receive a **limited, revocable, non‑transferable** license to access and use the Services for their intended purpose.

6.6 **Feedback.** If you submit feedback, you grant us a **perpetual, irrevocable** license to use it without restriction or attribution.

---

## 7. Acceptable Use

You agree not to, and not to allow others to:

- use the Services for any unlawful purpose, to violate third‑party rights, or in breach of sanctions, export controls, or AML laws;
- interfere with, disrupt, or degrade the Services or any blockchain network;
- attempt to **circumvent x402 payments or platform fees**, or to spoof, replay, or forge payment proofs;
- scrape, harvest, or copy the Services (except for public, revocable search‑engine indexing), or misrepresent source or affiliation;
- upload malware, exploits, or attempt to gain unauthorized access to accounts, wallets, or networks;
- list, promote, or purchase **illegal** or **unsafe** Resources, including those that facilitate unlawful surveillance, unauthorized data access, or exploitation;
- submit secret or personal data in proxy requests (including credentials or PII) that you are not permitted to disclose;
- impersonate any person/entity or misrepresent association with x402scan.

We may monitor activity to protect the Services, users, and third parties.

---

## 8. Investigations & Enforcement

We may investigate suspected violations and take any action we deem appropriate, including removing content, suspending or terminating Accounts, limiting features, enforcing spending limits, and/or reporting to authorities where required by law. We have no obligation to pre‑screen content.

---

## 9. Interactions Between Users

x402scan is **not a party** to transactions between Buyers and Resource Providers. Disputes are solely between those parties. We may, but are not obligated to, facilitate communications. **We do not guarantee** any party’s ability to perform.

---

## 10. Fees & Charges

We may charge fees (e.g., listing, platform, or embedded protocol fees) and will disclose them via the Services or applicable docs. Fees may change from time to time. You authorize us to deduct or embed applicable fees in on‑chain payment flows as permitted by the protocol and your configuration.

---

## 11. Blockchain, Stablecoin & Technology Disclaimers

11.1 **Blockchains & Finality.** Blockchain transactions require network confirmation and are **irreversible** once finalized. We do not control blockchains, validators, mempools, RPC providers, or network congestion, forks, reorgs, or outages.

11.2 **Smart Contracts & Protocols.** Smart contracts and protocols (including x402) may contain **bugs, vulnerabilities, misconfigurations, or unexpected behaviors**. **USE AT YOUR OWN RISK.**

11.3 **Stablecoins.** Stablecoins are not legal tender and may de‑peg, face issuer/treasury risk, regulatory action, or become non‑redeemable. Cybersecurity incidents can cause complete, immediate, and irreversible loss.

11.4 **No Custody; No Reversals.** We cannot freeze, reverse, or claw back on‑chain payments.

11.5 **Regulatory Uncertainty.** Regulations impacting digital assets, stablecoins, and AI are evolving and may materially affect the Services or your ability to use them.

11.6 **Third‑Party Infrastructure.** We rely on external providers (e.g., CDP, onramps, data APIs, LLMs, hosting, analytics). **We are not responsible** for their acts, omissions, outages, or changes.

---

## 12. Third‑Party Services & Terms

Your use of **Coinbase CDP/Coinbase Pay**, **LLM providers** (OpenAI, Anthropic, etc.), **data providers** (BitQuery, BigQuery), analytics (PostHog, Vercel), and other third‑party services is subject to those providers’ terms and privacy notices. We do not control or endorse third‑party services and are not responsible for them.

---

## 13. Indemnification

To the maximum extent permitted by law, you agree to **indemnify, defend, and hold harmless** x402scan and its affiliates, officers, employees, agents, partners, suppliers, and licensors from and against any claims, losses, liabilities, damages, costs, and expenses (including reasonable attorneys’ fees) arising out of or related to: (a) Your Content; (b) your use of the Services or x402 Resources; (c) your on‑chain transactions; (d) your violation of these Terms or any law; (e) your interactions with other users; or (f) actions taken by your agents or automations.

---

## 14. Disclaimers

THE SERVICES, DISCOVERY INDEX, ANALYTICS, PROXY, AI/AGENT TOOLS, AND ALL CONTENT ARE PROVIDED **“AS IS” AND “AS AVAILABLE,” WITH ALL FAULTS**. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM **ALL WARRANTIES**, EXPRESS OR IMPLIED, INCLUDING **MERCHANTABILITY**, **FITNESS FOR A PARTICULAR PURPOSE**, **NON‑INFRINGEMENT**, **ACCURACY**, **QUIET ENJOYMENT**, AND **TITLE**. WE DO NOT WARRANT THAT THE SERVICES WILL BE **ERROR‑FREE**, **SECURE**, OR **UNINTERRUPTED**, OR THAT RESULTS WILL BE **ACCURATE** OR **RELIABLE**. YOU ACCESS AND USE THE SERVICES **AT YOUR OWN RISK**.

---

## 15. Limitation of Liability

TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL X402SCAN OR ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, SUPPLIERS, OR LICENSORS BE LIABLE FOR **INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE** DAMAGES, OR FOR **LOSS OF PROFITS, GOODWILL, DATA, OR BUSINESS INTERRUPTION**, EVEN IF ADVISED OF THE POSSIBILITY. OUR **TOTAL LIABILITY** FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SERVICES SHALL NOT EXCEED THE GREATER OF **(A) THE AMOUNT YOU PAID TO X402SCAN IN THE ONE (1) MONTH PRIOR TO THE EVENT GIVING RISE TO LIABILITY, OR (B) USD **$100**.**
The foregoing does not limit liability for death or personal injury caused by our negligence, fraud, or other liability that cannot be limited under applicable law.

---

## 16. Copyright & DMCA

We respect IP rights. If you believe content on the Services infringes your copyright, please send a notice including: (a) your signature; (b) identification of the copyrighted work; (c) identification of the allegedly infringing material and its location; (d) your contact information; (e) a statement of good‑faith belief; and (f) a statement, under penalty of perjury, of authority and accuracy.
**DMCA Agent:**
Samuel Ragsdale, CEO, Merit Systems, Inc.
300 Kent Ave., Ste 604, Brooklyn, NY 11249
**[copyright@merit.systems](mailto:copyright@merit.systems)**

---

## 17. Term; Suspension; Termination; Effect

This Agreement starts when you first use the Services and continues until terminated. We may suspend or terminate the Services or your Account immediately for any breach, unlawful activity, risk to the Services or users, or as required by law. You may terminate by closing your Account and ceasing use. Upon termination, your right to access the Services ends and we may delete Your Content from live systems (subject to legal holds and backups). Sections that by nature should survive (including ownership, licenses, fees, disclaimers, limitations, indemnities, and dispute resolution) will survive.

---

## 18. Dispute Resolution; Arbitration; Class Waiver

18.1 **Informal Resolution.** Before filing a claim, you and x402scan agree to attempt to resolve disputes informally via a conference (phone or video) within **45 days** after written notice.

18.2 **Arbitration Agreement.** Except for small‑claims matters and claims for injunctive relief regarding IP or unauthorized use of the Services, **all disputes** arising out of or relating to this Agreement or the Services shall be resolved by **binding arbitration** under the **Federal Arbitration Act**, administered by the **American Arbitration Association (AAA)** under its **Consumer Arbitration Rules** then in effect.

18.3 **Venue & Rules.** Unless otherwise agreed, the arbitration will occur in the county of your residence. The arbitrator will be a licensed attorney or retired judge. Limited discovery may be permitted consistent with expedited proceedings.

18.4 **Class Action Waiver.** **YOU AND X402SCAN AGREE TO ARBITRATE ONLY ON AN INDIVIDUAL BASIS.** NO CLASS, COLLECTIVE, REPRESENTATIVE, OR MASS ACTIONS OR ARBITRATIONS.

18.5 **Batch Arbitration.** If 100+ similar arbitration demands are filed by/with the same counsel within 30 days, AAA will administer them in **batches of up to 100** with one arbitrator per batch, one schedule, and one hearing per batch. Disputes about batching are decided by an administrative arbitrator.

18.6 **Opt‑Out.** You may opt out of arbitration by mailing written notice to: **Merit Systems, Inc., 224 West 35th Street, Ste 500 #2218, New York, NY 10001** within **30 days** after you first become subject to this Arbitration Agreement. If you opt out, this Section 18 does not apply.

18.7 **Fees & Attorneys’ Fees.** Each party bears its own attorneys’ fees unless the arbitrator finds a claim frivolous. Court actions to compel arbitration or to decide conditions precedent may award reasonable fees to the prevailing party.

18.8 **Confidentiality.** Arbitration proceedings and awards are confidential except as required by law or to enforce an award.

---

## 19. International Use; Export; Sanctions

The Services are operated from the United States. You are responsible for compliance with local laws. You may not use the Services if you are located in or are a national of a **sanctioned** country or are on a **U.S. restricted list**. You must comply with **U.S. export control** laws and may not use the Services for prohibited purposes (e.g., weapons development).

---

## 20. Privacy; Analytics

Use of the Services is subject to our **Privacy Policy** (incorporated by reference). We may use analytics (e.g., **PostHog**, **Vercel Analytics**) to understand usage and improve performance. Configuration options may allow you to opt out of certain analytics.

---

## 21. Notices; Electronic Communications

You consent to receive notices electronically. Keep your email address current in your Account. If your last email is invalid or cannot receive notices, our sending still constitutes effective notice. You may send notices to: **[legal@merit.systems](mailto:legal@merit.systems)** and by mail to **224 West 35th Street, Ste 500 #2218, New York, NY 10001**.

---

## 22. General

22.1 **Governing Law; Venue.** Subject to the FAA for arbitration issues, this Agreement is governed by the **laws of the State of New York**, without regard to conflicts rules. Where litigation is permitted, the **state or federal courts in New York, NY** have exclusive jurisdiction and venue.
22.2 **Assignment.** You may not assign or transfer this Agreement without our prior written consent.
22.3 **Force Majeure.** We are not liable for delays or failures beyond our reasonable control.
22.4 **Waiver; Severability.** A waiver is not a continuing waiver. If any provision is unenforceable, the remainder stays in effect and is enforced to the maximum extent permissible.
22.5 **Entire Agreement.** These Terms and any Supplemental Terms and policies referenced herein are the entire agreement between you and us regarding the Services and supersede prior or contemporaneous agreements on the subject.
22.6 **No Third‑Party Beneficiaries (UK).** No person other than the parties has rights under the Contracts (Rights of Third Parties) Act 1999 to enforce these Terms.
22.7 **Germany (Liability).** Notwithstanding Section 15, x402scan is also not liable for acts of simple negligence (unless causing death or personal injury) except for breaches of material contractual duties (vertragswesentliche Pflichten).

---

## 23. Contact

**Merit Systems, Inc.**
224 West 35th Street, Ste 500 #2218, New York, NY 10001
**[legal@merit.systems](mailto:legal@merit.systems)**

---

### Appendix A – Service‑Specific Disclosures & Clarifications

A.1 **CDP Embedded Wallets.** Wallets are created and managed using **Coinbase Developer Platform (MPC)**. We store wallet identifiers and metadata but **no private keys or seed phrases**. Wallet export is handled by CDP subject to its terms.

A.2 **Connected Wallets.** Connections via WalletConnect/EIP‑1193 (e.g., MetaMask, Phantom) are initiated by you, and **all signatures occur in your client**. We cannot sign or broadcast without your explicit approval.

A.3 **Onramp Sessions.** When you use Coinbase Pay, we may store a session token, intended amount, status, and resulting transaction hash for reconciliation. **We do not process fiat** or store card/bank details.

A.4 **Proxy & Auto‑Registration.** Our `/api/proxy` intercepts **HTTP 402** flows to construct x402 payment headers and may **auto‑register** discovered Resources. If you enable `share_data=true`, request/response bodies may be logged **for discovery and debugging**. Do not send secrets.

A.5 **Data Sources.** Read‑only blockchain data may be pulled from **CDP**, **BitQuery**, **Google BigQuery**, and public RPCs. Indexes and labels are **best‑effort** and may be inaccurate or delayed.

A.6 **Analytics.** We may use **PostHog** and **Vercel Analytics** for product analytics and performance. Configuration may allow disabling certain analytics features.

A.7 **Free vs. Paid Tiers.** Free tier usage draws on a **platform‑controlled wallet**; paid tier usage draws on **your wallet(s)**. We may enforce tool‑call and message limits and may change tier limits or availability at any time.

A.8 **AI Providers.** Prompts and context may be forwarded to LLM providers you select or that we provision. Provider terms apply. **We do not guarantee** output quality, safety, correctness, or uniqueness.

A.9 **x402 Payments.** Payments are **peer‑to‑peer** on chain. **x402scan is not a money transmitter, custodian, broker, exchange, or marketplace for securities** and does not handle fiat.

---

### Appendix B – Definitions

- “**x402 Resource**” means an API or endpoint that accepts on‑chain micropayments in accordance with the x402 standard.
- “**Buyer**” means a User purchasing access to an x402 Resource.
- “**Resource Provider**” means a User listing and accepting payments for an x402 Resource.
- “**Agent**” means an automated process, tool, or LLM‑driven workflow that can call Resources on a User’s behalf.
- “**Stablecoin**” means a blockchain‑based token designed to maintain a peg to fiat (e.g., USDC).

---

**End of Terms**
