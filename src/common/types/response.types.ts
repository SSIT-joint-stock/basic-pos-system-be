/**
 * Base response interface for all API responses
 */
export interface BaseResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Metadata about the response */
  meta: {
    /** Timestamp of the response */
    timestamp: string;
    /** API version */
    version: string;
    /** Optional request ID for tracking */
    requestId?: string;
  };
}

/**
 * Success response interface
 */
export interface SuccessResponse<T = unknown> extends BaseResponse {
  success: true;
  /** Response data */
  data: T;
  /** Optional success message */
  message?: string;
}

/**
 * Error response interface
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  /** Error details */
  error: {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Optional additional error details */
    details?: unknown;
  };
}

/**
 * Pagination information interface
 */
export interface PaginationInfo {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/**
 * Paginated response interface
 */
export interface PaginatedSuccessResponse<T = unknown>
  extends SuccessResponse<T[]> {
  /** Pagination information */
  pagination: PaginationInfo;
}

/**
 * Raw response wrapper to bypass the response interceptor
 */
export interface RawResponse<T = unknown> {
  __raw: true;
  data: T;
}

/**
 * Helper function to create a raw response that bypasses the interceptor
 */
export function createRawResponse<T = unknown>(data: T): RawResponse<T> {
  return {
    __raw: true,
    data,
  };
}

/**
 * Type guard to check if a response is a raw response
 */
export function isRawResponse(data: RawResponse): data is RawResponse {
  return data && typeof data === 'object' && data.__raw === true;
}

/**
 * ============================================================================
 * API RESPONSE DECORATOR TYPES
 * ============================================================================
 */

/**
 * Options for API response configuration
 */
export interface ApiResponseOptions {
  /** Custom status code for the response */
  statusCode?: number;

  /** Additional metadata to include in the response */
  metadata?: Record<string, any>;

  /** Custom headers to set on the response */
  headers?: Record<string, string>;

  /** Whether to include request ID in the response */
  includeRequestId?: boolean;

  /** Custom response transformation function */
  transform?: (data: any) => any;
}

/**
 * Metadata stored by API response decorators
 */
export interface ApiSuccessMetadata {
  message?: string;
  options?: ApiResponseOptions;
}

export interface ApiCustomMetadata {
  statusCode: number;
  message?: string;
  options?: ApiResponseOptions;
}

export interface ApiErrorMetadata {
  message?: string;
  statusCode: number;
}

/**
 * Union type for all API response metadata
 */
export type ApiResponseMetadata =
  | { type: 'success'; data: ApiSuccessMetadata }
  | { type: 'custom'; data: ApiCustomMetadata }
  | { type: 'error'; data: ApiErrorMetadata }
  | { type: 'raw'; data: boolean };
