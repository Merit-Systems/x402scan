export async function register() {
  // prevent this from running in the edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.LMNR_PROJECT_API_KEY) {
    const { Laminar } = await import('@lmnr-ai/lmnr');

    Laminar.initialize({
      projectApiKey: process.env.LMNR_PROJECT_API_KEY,
    });
  }
}
