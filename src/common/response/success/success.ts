import { PaginationInfo } from 'app/common/types/response.types';

/**
 * Success Response Class
 * Provides standardized success responses following API structure guidelines
 * Implements Builder pattern for fluent API
 */
export class ApiResponse<T = any> {
  public success: boolean;
  public data?: T;
  public message?: string;
  public summary?: object;
  public meta: {
    timestamp: string;
    version: string;
    requestId?: string;
  };

  constructor(success: boolean, data?: T, message?: string, summary?: object) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.summary = summary;
    this.meta = {
      timestamp: new Date().toISOString(),
      version: 'v1',
    };
  }

  /**
   * Create a success response
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  /**
   * Create an error response
   */
  static error(message: string): ApiResponse {
    return new ApiResponse(false, undefined, message);
  }

  /**
   * Add request ID to metadata
   */
  withRequestId(requestId: string): ApiResponse<T> {
    this.meta.requestId = requestId;
    return this;
  }

  /**
   * Convert to JSON object
   */
  toJSON() {
    const response: any = {
      success: this.success,
      meta: this.meta,
    };

    if (this.data !== undefined) {
      response.data = this.data;
    }
    if (this.summary !== undefined) {
      response.summary = this.summary;
    }

    if (this.message) {
      response.message = this.message;
    }

    return response;
  }
}

/**
 * Pagination Response Class
 * Extends ApiResponse for paginated data
 */
export class PaginatedResponse<T> extends ApiResponse<T[]> {
  public pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
    summary?: object,
  ) {
    super(true, data, message, summary);
    const totalPages = Math.ceil(total / limit);

    this.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Create a paginated response
   */
  static from<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
    summary?: object,
  ): PaginatedResponse<T> {
    return new PaginatedResponse(data, page, limit, total, message, summary);
  }

  /**
   * Convert to JSON object
   */
  toJSON() {
    const response = super.toJSON();
    response.pagination = this.pagination as PaginationInfo;
    return response;
  }
}

export default ApiResponse;
