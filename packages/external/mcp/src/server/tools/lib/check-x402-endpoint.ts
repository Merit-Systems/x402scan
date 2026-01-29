import { safeFetch } from '@/shared/neverthrow/fetch';
import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';
import { x402Client } from '@x402/core/client';
import { x402HTTPClient } from '@x402/core/http';
import { err, ok } from '@x402scan/neverthrow';

interface CheckX402EndpointProps {
  surface: string;
  resource: string;
}

export const checkX402Endpoint = async ({
  surface,
  resource,
}: CheckX402EndpointProps) => {
  const postResult = await getResourceResponse({
    surface,
    resource,
    request: new Request(resource, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  });

  if (postResult.isOk()) {
    return postResult;
  }

  const getResult = await getResourceResponse({
    surface,
    resource,
    request: new Request(resource, { method: 'GET' }),
  });

  if (getResult.isOk()) {
    return getResult;
  }

  return err('fetch', surface, {
    cause: 'not_402',
    message: `Resource did not return 402: ${resource}`,
  });
};

interface GetResourceResponseProps extends CheckX402EndpointProps {
  request: Request;
}

const getResourceResponse = async ({
  surface,
  resource,
  request,
}: GetResourceResponseProps) => {
  const client = new x402HTTPClient(new x402Client());

  const fetchResult = await safeFetch(surface, request);

  if (fetchResult.isErr()) {
    return fetchResult;
  }

  const response = fetchResult.value;

  if (response.status !== 402) {
    return err('fetch', surface, {
      cause: 'not_402',
      message: `Resource did not return 402: ${resource}`,
    });
  }

  const paymentRequiredResult = await safeGetPaymentRequired(
    surface,
    client,
    response
  );

  if (paymentRequiredResult.isErr()) {
    return paymentRequiredResult;
  }

  return ok({
    paymentRequired: paymentRequiredResult.value,
    resource,
    method: request.method,
  });
};
