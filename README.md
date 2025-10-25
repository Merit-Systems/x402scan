<div align="center">

# x402scan

</div>

<div align="center">
    
  [![Discord](https://img.shields.io/discord/1382120201713352836?style=flat&logo=discord&logoColor=white&label=Discord)](https://discord.gg/JuKt7tPnNc) 
  ![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/merit_systems) 
  [![GitHub Repo stars](https://img.shields.io/github/stars/Merit-Systems/echo?style=social)](https://github.com/Merit-Systems/echo) 
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

</div>

[x402scan](https://x402scan.com) is an ecosystem explorer for [x402](https://www.x402.org/), a new standard for digital payments. It's live at [x402scan.com](https://x402scan.com).

![x402scan screenshot](./preview.png)

x402 API resources can be be purchased just-in-time without a prior relationship with the seller using cryptocurrency. x402 is vision for an internet without ads or centralized intermediaries.

x402scan lets you explore the ecosystem of x402 servers, see their transaction volumes and directly access their resources through an embedded wallet.

## Development

_Note: We're working on making this easier to spin-up. If you have any trouble in the mean time, please reach out._

Fill out a `.env.example` with the variables in [env.ts](https://github.com/Merit-Systems/x402scan/blob/main/.env.example).

Then install and run.

```bash
pnpm install && pnpm dev
```

## Contributing

We're actively seeking contributors to help build x402scan. We believe an ecosystem explorer will shed light on the activities happening over x402, build trust, and help standardize interaction patterns to grow the ecosystem massively.

### Add Resources

If you know if a resource that is not yet listed, you can add it by visiting https://www.x402scan.com/add_resources=true and submitting the URL. If the URL returns a valid x402 schema, it be added to the resources list automatically.

### Add Facilitators

If you know of another facilitator that are not listed, you can add it to [`src/lib/facilitators`](https://github.com/Merit-Systems/x402scan/blob/main/src/lib/facilitators.ts) and the dashboard will automatically update.
