const validRedirectUris = ['cursor://anysphere.cursor-mcp/oauth/callback'];

export const isValidRedirectUri = (uri: string) => {
  return validRedirectUris.includes(uri);
};
