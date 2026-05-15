type RegistrationDomainPolicySeverity = 'block' | 'warn';

interface RegistrationDomainRule {
  domain: string;
  severity: RegistrationDomainPolicySeverity;
  reason: string;
}

type RegistrationDomainRuleInput = Omit<RegistrationDomainRule, 'severity'>;

export interface RegistrationDomainPolicyMatch extends RegistrationDomainRule {
  hostname: string;
}

const BLOCKED_REGISTRATION_DOMAIN_RULES = [
  {
    domain: 'railway.app',
    reason:
      'Railway-provided domains are platform-owned deployment URLs. Use a custom domain you control.',
  },
  {
    domain: 'up.railway.app',
    reason:
      'Railway-provided domains are platform-owned deployment URLs. Use a custom domain you control.',
  },
  {
    domain: 'trycloudflare.com',
    reason:
      'Cloudflare Quick Tunnel domains are random development tunnel URLs.',
  },
  {
    domain: 'localtunnel.me',
    reason: 'Localtunnel domains are temporary development tunnel URLs.',
  },
  {
    domain: 'loca.lt',
    reason: 'Localtunnel domains are temporary development tunnel URLs.',
  },
  {
    domain: 'serveo.net',
    reason: 'Serveo domains are tunnel forwarding URLs, not durable API identity.',
  },
  {
    domain: 'localhost.run',
    reason:
      'localhost.run domains expose local development servers and are not durable API identity.',
  },
  {
    domain: 'pinggy.link',
    reason: 'Pinggy free tunnel domains are random and temporary.',
  },
  {
    domain: 'ngrok-free.app',
    reason: 'ngrok free domains are development tunnel URLs.',
  },
  {
    domain: 'ngrok-free.dev',
    reason: 'ngrok free domains are development tunnel URLs.',
  },
  {
    domain: 'ngrok.app',
    reason: 'ngrok-managed domains are tunnel URLs. Use a custom domain you control.',
  },
  {
    domain: 'ngrok.dev',
    reason: 'ngrok-managed domains are tunnel URLs. Use a custom domain you control.',
  },
  {
    domain: 'ngrok.io',
    reason: 'ngrok-managed domains are tunnel URLs. Use a custom domain you control.',
  },
  {
    domain: 'gitpod.io',
    reason: 'Gitpod workspace URLs are development preview URLs.',
  },
  {
    domain: 'stackblitz.io',
    reason: 'StackBlitz preview URLs are development workspace URLs.',
  },
  {
    domain: 'webcontainer.io',
    reason: 'WebContainer URLs are browser development runtime URLs.',
  },
  {
    domain: 'csb.app',
    reason: 'CodeSandbox preview URLs are development workspace URLs.',
  },
  {
    domain: 'codesandbox.io',
    reason: 'CodeSandbox URLs are development workspace URLs.',
  },
  {
    domain: 'onrender.com',
    reason: 'Render-provided domains are platform-owned deployment URLs.',
  },
  {
    domain: 'herokuapp.com',
    reason: 'Heroku-provided domains are platform-owned deployment URLs.',
  },
  {
    domain: 'replit.app',
    reason: 'Replit-provided domains are platform-owned deployment URLs.',
  },
  {
    domain: 'repl.co',
    reason: 'Replit workspace domains are platform-owned development URLs.',
  },
  {
    domain: 'replit.dev',
    reason: 'Replit development domains are workspace URLs.',
  },
  {
    domain: 'workers.dev',
    reason: 'workers.dev domains are Cloudflare-owned starter domains.',
  },
  {
    domain: 'deno.dev',
    reason: 'Deno Deploy default domains are platform-owned deployment URLs.',
  },
  {
    domain: 'amplifyapp.com',
    reason: 'AWS Amplify default domains are platform-owned deployment URLs.',
  },
  {
    domain: 'surge.sh',
    reason: 'Surge default domains are platform-owned deployment URLs.',
  },
  {
    domain: 'firebaseapp.com',
    reason: 'Firebase default domains are platform-owned deployment URLs.',
  },
  {
    domain: 'web.app',
    reason: 'Firebase default domains are platform-owned deployment URLs.',
  },
  {
    domain: 'fly.dev',
    reason: 'Fly.io default domains are platform-owned deployment URLs.',
  },
] as const satisfies RegistrationDomainRuleInput[];

const WARN_REGISTRATION_DOMAIN_RULES = [
  {
    domain: 'vercel.app',
    reason:
      'Vercel domains can be legitimate, but a custom domain is stronger API identity.',
  },
  {
    domain: 'netlify.app',
    reason:
      'Netlify domains can be legitimate, but a custom domain is stronger API identity.',
  },
  {
    domain: 'pages.dev',
    reason:
      'Cloudflare Pages domains can be legitimate, but a custom domain is stronger API identity.',
  },
  {
    domain: 'github.io',
    reason:
      'GitHub Pages domains can be legitimate, but a custom domain is stronger API identity.',
  },
] as const satisfies RegistrationDomainRuleInput[];

const REGISTRATION_DOMAIN_RULES = [
  ...BLOCKED_REGISTRATION_DOMAIN_RULES.map(rule => ({
    ...rule,
    severity: 'block' as const,
  })),
  ...WARN_REGISTRATION_DOMAIN_RULES.map(rule => ({
    ...rule,
    severity: 'warn' as const,
  })),
] satisfies RegistrationDomainRule[];

function getHostname(urlOrHostname: string): string | null {
  try {
    return new URL(urlOrHostname).hostname.toLowerCase();
  } catch {
    const hostname = urlOrHostname.trim().toLowerCase();
    if (!hostname || hostname.includes('/')) return null;
    return hostname;
  }
}

function hostnameMatchesRule(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function getRegistrationDomainPolicyMatch(
  urlOrHostname: string
): RegistrationDomainPolicyMatch | null {
  const hostname = getHostname(urlOrHostname);
  if (!hostname) return null;

  const rule = [...REGISTRATION_DOMAIN_RULES]
    .sort((a, b) => b.domain.length - a.domain.length)
    .find(item => hostnameMatchesRule(hostname, item.domain));

  if (!rule) return null;

  return {
    ...rule,
    hostname,
  };
}
