import { printBanner } from '@/lib/banner';

export const printInstallBanner = (isNew: boolean) => {
  if (isNew) {
    printBanner({
      heading: `Welcome to the x402scan MCP server!`,
      description:
        'A tool for calling x402-protected APIs with automatic payment handling.',
    });
  } else {
    printBanner({
      heading: `Welcome back to the x402scan MCP server!`,
      description:
        'A tool for calling x402-protected APIs with automatic payment handling.',
    });
  }
  console.log('');
};
