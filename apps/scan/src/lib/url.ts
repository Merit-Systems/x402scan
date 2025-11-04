export const getOriginFromUrl = (url: string) => {
  return new URL(url).origin;
};
