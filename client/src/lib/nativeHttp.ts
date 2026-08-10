import { CapacitorHttp, type HttpOptions, type HttpResponse } from '@capacitor/core';
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { isNative } from './native';

/**
 * Axios adapter that performs requests through Capacitor's native HTTP layer
 * instead of the WebView's XMLHttpRequest.
 *
 * Why: inside the APK the SPA is served from `https://localhost`, so every call
 * to the hosted API (https://app.sprintsociety.in/api) is cross-origin. The
 * WebView then enforces CORS *and* Cross-Origin-Resource-Policy, so a single
 * mis-set server header (a CLIENT_URL that doesn't match, Helmet's default CORP
 * of `same-origin`) silently kills login and every other request with an opaque
 * "Network Error". Requests issued from the native layer are not subject to
 * either check, so the APK keeps working regardless of how the API's CORS is
 * configured on any given deploy.
 *
 * Scope is deliberately narrow: only the `api` axios instance uses this. We do
 * NOT enable the global `CapacitorHttp` plugin (which monkey-patches
 * window.fetch / XMLHttpRequest), because that breaks `fetch(dataUrl)` on the
 * `data:` URIs used by run-card image sharing.
 *
 * No-op on web — there `nativeHttpAdapter` is undefined and axios uses its
 * default XHR adapter.
 */

/** Serialize axios `params` the way the default axios adapter does. */
function appendParams(url: string, params: unknown): string {
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else if (value instanceof Date) {
      search.append(key, value.toISOString());
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  if (!qs) return url;
  return url + (url.includes('?') ? '&' : '?') + qs;
}

function flattenHeaders(config: InternalAxiosRequestConfig): Record<string, string> {
  const raw = config.headers as unknown;
  const source =
    raw && typeof (raw as { toJSON?: () => unknown }).toJSON === 'function'
      ? ((raw as { toJSON: () => Record<string, unknown> }).toJSON())
      : ((raw || {}) as Record<string, unknown>);

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null) continue;
    headers[key] = String(value);
  }
  return headers;
}

/**
 * Axios has already run `transformRequest` by the time the adapter sees the
 * body, so JSON payloads arrive as a string. CapacitorHttp expects a plain
 * object for `application/json` — parse it back so the native layer sets the
 * body and content type consistently on both platforms.
 */
function normalizeBody(data: unknown, headers: Record<string, string>): unknown {
  if (data === undefined || data === null) return undefined;
  const contentType = Object.entries(headers).find(
    ([k]) => k.toLowerCase() === 'content-type',
  )?.[1] ?? '';

  if (typeof data === 'string' && contentType.includes('json')) {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function mapResponseType(config: InternalAxiosRequestConfig): HttpOptions['responseType'] {
  switch (config.responseType) {
    case 'text':
      return 'text';
    case 'arraybuffer':
    case 'blob':
      return 'arraybuffer';
    default:
      return 'json';
  }
}

const capacitorHttpAdapter: AxiosAdapter = async (config) => {
  const headers = flattenHeaders(config);
  const base = (config.baseURL || '').replace(/\/$/, '');
  const path = config.url || '';
  const absolute = /^https?:\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const url = appendParams(absolute, config.params);

  const options: HttpOptions = {
    url,
    method: (config.method || 'get').toUpperCase(),
    headers,
    data: normalizeBody(config.data, headers),
    responseType: mapResponseType(config),
    // Capacitor splits axios' single `timeout` into connect + read budgets.
    connectTimeout: config.timeout || undefined,
    readTimeout: config.timeout || undefined,
  };

  let native: HttpResponse;
  try {
    native = await CapacitorHttp.request(options);
  } catch (err) {
    // DNS failure, no connectivity, TLS error — no HTTP response exists. Surface
    // it the same shape axios uses so the interceptor's `!error.response` branch
    // produces the friendly "Cannot reach the server" message.
    throw new AxiosError(
      err instanceof Error ? err.message : 'Network Error',
      AxiosError.ERR_NETWORK,
      config,
      null,
    );
  }

  const response: AxiosResponse = {
    data: native.data,
    status: native.status,
    statusText: String(native.status),
    headers: native.headers || {},
    config,
    request: null,
  };

  const validate = config.validateStatus;
  if (!validate || validate(response.status)) {
    return response;
  }

  throw new AxiosError(
    `Request failed with status code ${response.status}`,
    response.status >= 400 && response.status < 500
      ? AxiosError.ERR_BAD_REQUEST
      : AxiosError.ERR_BAD_RESPONSE,
    config,
    null,
    response,
  );
};

/** The adapter to hand to axios — `undefined` on web so axios keeps its default. */
export const nativeHttpAdapter: AxiosAdapter | undefined = isNative ? capacitorHttpAdapter : undefined;
