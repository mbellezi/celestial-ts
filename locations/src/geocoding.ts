import { TIME_ZONE_DATA } from './time-zone-data.ts';

/** A location selected from Open-Meteo's GeoNames search results. */
export interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  label: string;
  countryCode?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
  elevation?: number;
  population?: number;
  featureCode?: string;
  postcodes?: string[];
}

export type CitySearchErrorCode =
  | 'invalid_input'
  | 'network'
  | 'aborted'
  | 'http'
  | 'api'
  | 'invalid_response'
  | 'not_found';

export class CitySearchError extends Error {
  readonly code: CitySearchErrorCode;
  readonly status?: number;

  constructor(code: CitySearchErrorCode, message: string, options: { status?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'CitySearchError';
    this.code = code;
    this.status = options.status;
  }
}

export type CitySearchFetch = (url: URL, init?: RequestInit) => Promise<Response>;

export interface CitySearchClientOptions {
  /** Base URL including /v1/. Use the customer endpoint with a commercial API key. */
  endpoint?: string | URL;
  apiKey?: string;
  fetch?: CitySearchFetch;
  /** Defaults to pt. */
  language?: string;
  /** Defaults to 10; must be between 1 and 100. */
  count?: number;
}

export interface CityRequestOptions {
  language?: string;
  signal?: AbortSignal;
}

export interface CitySearchOptions extends CityRequestOptions {
  count?: number;
  /** Optional ISO 3166-1 alpha-2 country filter. */
  countryCode?: string;
}

export interface CitySearchClient {
  /** Returns every candidate supplied by the API; the caller chooses a city by ID. */
  search(name: string, options?: CitySearchOptions): Promise<City[]>;
  get(id: number, options?: CityRequestOptions): Promise<City>;
}

function invalidInput(message: string): never {
  throw new CitySearchError('invalid_input', message);
}

function invalidResponse(): never {
  throw new CitySearchError('invalid_response', 'Open-Meteo returned an invalid location response.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is number {
  // Open-Meteo's get endpoint accepts a signed 32-bit GeoNames ID.
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2_147_483_647;
}

function language(value: string): string {
  if (typeof value !== 'string' || !/^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(value)) {
    invalidInput('language must be a language code, such as pt or en.');
  }
  return value.toLowerCase();
}

function count(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 100) invalidInput('count must be an integer between 1 and 100.');
  return value;
}

function city(value: unknown): City {
  if (!isRecord(value) || !isId(value.id)
    || typeof value.name !== 'string' || !value.name.trim()
    || typeof value.timezone !== 'string' || !value.timezone.trim()
    || typeof value.latitude !== 'number' || !Number.isFinite(value.latitude) || Math.abs(value.latitude) > 90
    || typeof value.longitude !== 'number' || !Number.isFinite(value.longitude) || Math.abs(value.longitude) > 180) {
    invalidResponse();
  }
  if (!Object.hasOwn(TIME_ZONE_DATA, value.timezone)) invalidResponse();
  const result: City = {
    id: value.id,
    name: value.name,
    latitude: value.latitude,
    longitude: value.longitude,
    timeZone: value.timezone,
    label: value.name,
  };
  for (const key of ['country', 'admin1', 'admin2', 'admin3', 'admin4'] as const) {
    const field = value[key];
    if (field !== undefined) {
      if (typeof field !== 'string') invalidResponse();
      if (field.trim()) result[key] = field;
    }
  }
  for (const [source, destination] of [['country_code', 'countryCode'], ['feature_code', 'featureCode']] as const) {
    const field = value[source];
    if (field !== undefined) {
      if (typeof field !== 'string') invalidResponse();
      if (field.trim()) result[destination] = field;
    }
  }
  if (result.countryCode && !/^[a-z]{2}$/i.test(result.countryCode)) invalidResponse();
  if (result.countryCode) result.countryCode = result.countryCode.toUpperCase();
  for (const key of ['elevation', 'population'] as const) {
    const field = value[key];
    if (field !== undefined) {
      if (typeof field !== 'number' || !Number.isFinite(field)) invalidResponse();
      if (key === 'population' && (!Number.isInteger(field) || field < 0)) invalidResponse();
      result[key] = field;
    }
  }
  if (value.postcodes !== undefined) {
    if (!Array.isArray(value.postcodes) || !value.postcodes.every(item => typeof item === 'string')) invalidResponse();
    result.postcodes = [...value.postcodes];
  }
  result.label = [...new Set([result.name, result.admin2, result.admin1, result.country ?? result.countryCode]
    .filter((part): part is string => Boolean(part)))].join(', ');
  return result;
}

/** Uses native fetch and has no runtime dependencies. No candidate is selected automatically. */
export function createCitySearchClient(options: CitySearchClientOptions = {}): CitySearchClient {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) invalidInput('options must be an object.');
  let endpoint: URL;
  try {
    endpoint = new URL(options.endpoint ?? 'https://geocoding-api.open-meteo.com/v1/');
  } catch {
    invalidInput('endpoint must be an absolute HTTP or HTTPS base URL.');
  }
  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.search || endpoint.hash || endpoint.username || endpoint.password) {
    invalidInput('endpoint must be an HTTP or HTTPS base URL without credentials, a query, or a fragment.');
  }
  if (!endpoint.pathname.endsWith('/')) endpoint.pathname += '/';
  const defaultLanguage = language(options.language ?? 'pt');
  const defaultCount = count(options.count ?? 10);
  const fetcher = options.fetch ?? globalThis.fetch;
  if (typeof fetcher !== 'function') invalidInput('A fetch implementation is required.');
  if (options.apiKey !== undefined && (typeof options.apiKey !== 'string' || !options.apiKey.trim())) {
    invalidInput('apiKey must be a nonempty string.');
  }
  const apiKey = options.apiKey;

  async function request(path: 'search' | 'get', params: Record<string, string>, signal?: AbortSignal): Promise<unknown> {
    const url = new URL(path, endpoint);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set('format', 'json');
    if (apiKey !== undefined) url.searchParams.set('apikey', apiKey);
    if (signal?.aborted) throw new CitySearchError('aborted', 'Location request was aborted.', { cause: signal.reason });
    let response: Response;
    try {
      response = await fetcher(url, { signal, headers: { Accept: 'application/json' } });
    } catch (cause) {
      throw new CitySearchError(signal?.aborted ? 'aborted' : 'network',
        signal?.aborted ? 'Location request was aborted.' : 'Could not reach Open-Meteo.', { cause });
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (cause) {
      if (signal?.aborted) throw new CitySearchError('aborted', 'Location request was aborted.', { cause });
      if (!response.ok) throw new CitySearchError(path === 'get' && response.status === 404 ? 'not_found' : 'http',
        `Open-Meteo returned HTTP ${response.status}.`, { status: response.status });
      throw new CitySearchError('invalid_response', 'Open-Meteo did not return valid JSON.', { cause });
    }
    const apiError = isRecord(payload) && payload.error === true;
    const missingId = isRecord(payload) && payload.error === true && payload.reason === 'Location ID not found.';
    if (path === 'get' && (response.status === 404 || (response.status === 400 && missingId))) {
      throw new CitySearchError('not_found', 'The requested location ID was not found.', { status: response.status });
    }
    if (!response.ok) throw new CitySearchError('http', `Open-Meteo returned HTTP ${response.status}.`, { status: response.status });
    if (apiError) throw new CitySearchError('api', 'Open-Meteo returned an API error.', { status: response.status });
    return payload;
  }

  return {
    async search(name, searchOptions = {}) {
      if (typeof searchOptions !== 'object' || searchOptions === null || Array.isArray(searchOptions)) invalidInput('search options must be an object.');
      if (typeof name !== 'string') invalidInput('name must be a string.');
      const query = name.trim();
      const params: Record<string, string> = {
        name: query,
        language: language(searchOptions.language ?? defaultLanguage),
        count: String(count(searchOptions.count ?? defaultCount)),
      };
      if (searchOptions.countryCode !== undefined) {
        if (typeof searchOptions.countryCode !== 'string' || !/^[a-z]{2}$/i.test(searchOptions.countryCode)) {
          invalidInput('countryCode must be a two-letter country code.');
        }
        params.countryCode = searchOptions.countryCode.toUpperCase();
      }
      // Two characters request an exact match; three or more allow prefix matches.
      // Qualifiers do not count toward the location-name length.
      if ([...query.split(',')[0]!.trim()].length < 2) return [];
      const payload = await request('search', params, searchOptions.signal);
      if (!isRecord(payload)) invalidResponse();
      // The API omits the results field when there are no matches.
      if (payload.results === undefined) return [];
      if (!Array.isArray(payload.results)) invalidResponse();
      return payload.results.map(city);
    },
    async get(id, getOptions = {}) {
      if (typeof getOptions !== 'object' || getOptions === null || Array.isArray(getOptions)) invalidInput('get options must be an object.');
      if (!isId(id)) invalidInput('id must be a positive 32-bit integer from a search result.');
      const payload = await request('get', { id: String(id), language: language(getOptions.language ?? defaultLanguage) }, getOptions.signal);
      const result = city(payload);
      if (result.id !== id) invalidResponse();
      return result;
    },
  };
}
