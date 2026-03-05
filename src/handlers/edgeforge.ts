import { CORS_HEADERS, jsonResponse } from '../helpers';

/**
 * Handle EdgeForge (BETA) requests.
 * Generates customizable Mock JSON responses for testing.
 */
export async function handleEdgeForge(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Parse query parameters
  const statusParam = url.searchParams.get('status');
  const delayParam = url.searchParams.get('delay');
  const bodyParam = url.searchParams.get('body');

  // Determine status code
  let status = 200;
  if (statusParam) {
    const parsedStatus = parseInt(statusParam, 10);
    if (!isNaN(parsedStatus) && parsedStatus >= 100 && parsedStatus <= 599) {
      status = parsedStatus;
    }
  }

  // Determine delay (max 10 seconds)
  let delay = 0;
  if (delayParam) {
    const parsedDelay = parseInt(delayParam, 10);
    if (!isNaN(parsedDelay) && parsedDelay > 0) {
      delay = Math.min(parsedDelay, 10000); // hard cap at 10,000ms
    }
  }

  // Sleep if delay is specified
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Determine response body
  let responseData: any = {};

  if (bodyParam) {
    try {
      responseData = JSON.parse(bodyParam);
    } catch (e) {
      return jsonResponse({ error: 'invalid json in body parameter' }, 400);
    }
  } else {
    // Fallback: collect all query parameters (except status and delay)
    let hasCustomParams = false;
    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'status' && key !== 'delay') {
        responseData[key] = value;
        hasCustomParams = true;
      }
    }

    // If no custom params, provide a default mock response
    if (!hasCustomParams) {
      responseData = {
        message: 'Welcome to EdgeForge (BETA)!',
        status_returned: status,
        delay_applied_ms: delay,
        hint: 'Use ?status=404, ?delay=1000, or ?body={"custom":"json"} to customize this response.',
      };
    }
  }

  return new Response(JSON.stringify(responseData), {
    status,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
