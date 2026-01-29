import { registerFetchOriginTool } from './fetch-origin';
import { registerFetchX402ResourceTool } from './x402-fetch';
import { registerWalletTools } from './wallet';
import { registerCheckX402EndpointTool } from './check-endpoint';
import { registerRedeemInviteTool } from './redeem-invite';
import { registerDiscoveryTools } from './discover-resources';
import { registerTelemetryTools } from './telemetry';
import { registerAuthTools } from './auth-fetch';

import type { RegisterTools } from '../types';

export const registerTools: RegisterTools = async props => {
  await Promise.all([
    registerFetchX402ResourceTool(props),
    registerAuthTools(props),
    registerWalletTools(props),
    registerCheckX402EndpointTool(props),
    registerRedeemInviteTool(props),
    registerDiscoveryTools(props),
    registerTelemetryTools(props),
    registerFetchOriginTool(props),
  ]);
};
