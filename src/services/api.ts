// src/services/api.ts

const API_URL =
  "http://localhost:5000/api";

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

interface ApiRequestOptions
  extends Omit<RequestInit, "method" | "body"> {
  readonly method?: HttpMethod;
  readonly body?: unknown;
}

interface ApiErrorResponse {
  readonly message?: string;
  readonly error?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(
    message: string,
    status: number,
    endpoint: string,
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (!isRecord(value)) {
    return fallback;
  }

  const data =
    value as ApiErrorResponse;

  if (
    typeof data.message === "string" &&
    data.message.trim()
  ) {
    return data.message;
  }

  if (
    typeof data.error === "string" &&
    data.error.trim()
  ) {
    return data.error;
  }

  return fallback;
}

async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const contentType =
    response.headers.get(
      "content-type",
    );

  if (
    contentType?.includes(
      "application/json",
    )
  ) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text =
    await response.text();

  return text.trim() || null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const normalizedEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  const url =
    `${API_URL}${normalizedEndpoint}`;

  const {
    method = "GET",
    body,
    headers,
    ...requestOptions
  } = options;

  const requestHeaders =
    new Headers(headers);

  if (
    body !== undefined &&
    !requestHeaders.has(
      "Content-Type",
    )
  ) {
    requestHeaders.set(
      "Content-Type",
      "application/json",
    );
  }

  requestHeaders.set(
    "Accept",
    "application/json",
  );

  let response: Response;

  try {
    response = await fetch(url, {
      ...requestOptions,
      method,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to connect to the API server.";

    throw new ApiError(
      `Network request failed: ${message}`,
      0,
      normalizedEndpoint,
    );
  }

  const responseBody =
    await parseResponseBody(
      response,
    );

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(
        responseBody,
        `API request failed (${response.status}).`,
      ),
      response.status,
      normalizedEndpoint,
    );
  }

  /*
   * 204 No Content has no response body.
   */
  if (
    response.status === 204 ||
    responseBody === null
  ) {
    return undefined as T;
  }

  return responseBody as T;
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: Omit<
      ApiRequestOptions,
      "method" | "body"
    >,
  ): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "GET",
      },
    ),

  post: <T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<
      ApiRequestOptions,
      "method" | "body"
    >,
  ): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "POST",
        body: data,
      },
    ),

  put: <T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<
      ApiRequestOptions,
      "method" | "body"
    >,
  ): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "PUT",
        body: data,
      },
    ),

  patch: <T>(
    endpoint: string,
    data?: unknown,
    options?: Omit<
      ApiRequestOptions,
      "method" | "body"
    >,
  ): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body: data,
      },
    ),

  delete: <T>(
    endpoint: string,
    options?: Omit<
      ApiRequestOptions,
      "method" | "body"
    >,
  ): Promise<T> =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "DELETE",
      },
    ),
};