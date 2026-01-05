import type { OAuth2ProviderType } from '@coinbase/cdp-hooks';

type OauthProvider = {
  id: OAuth2ProviderType;
  name: string;
  icon: string;
  iconClassName: string;
};

export const oauthProviders: OauthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '/google.png',
    iconClassName: 'size-4',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: '/apple.png',
    iconClassName: 'size-4 dark:invert',
  },
  {
    id: 'x',
    name: 'X',
    icon: '/x.png',
    iconClassName: 'size-4 invert dark:invert-0',
  },
];
