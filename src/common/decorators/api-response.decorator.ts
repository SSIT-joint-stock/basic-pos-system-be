import { SetMetadata } from '@nestjs/common';
import { ApiResponseOptions } from 'common/types/response.types';

/**
 * Decorator to automatically wrap controller method responses with ApiResponse.success()
 * @param message - Custom success message for the response
 * @param options - Additional options for the response
 */
export function ApiSuccess(message?: string, options?: ApiResponseOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Set metadata to mark this method for automatic ApiResponse wrapping
    SetMetadata('api:success', { message, options })(
      target,
      propertyKey,
      descriptor,
    );

    // Return the original descriptor
    return descriptor;
  };
}

/**
 * Decorator to bypass automatic ApiResponse wrapping for specific methods
 * Use this when you want to return raw responses or custom ApiResponse instances
 */
export function RawResponse() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Set metadata to bypass ApiResponse wrapping
    SetMetadata('api:raw', true)(target, propertyKey, descriptor);

    return descriptor;
  };
}

/**
 * Decorator for custom API responses with specific status codes
 * @param statusCode - HTTP status code
 * @param message - Response message
 * @param options - Additional options
 */
export function ApiResponse(
  statusCode: number,
  message?: string,
  options?: ApiResponseOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata('api:custom', { statusCode, message, options })(
      target,
      propertyKey,
      descriptor,
    );

    return descriptor;
  };
}

/**
 * Decorator for error responses
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 */
export function ApiError(message?: string, statusCode: number = 400) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata('api:error', { message, statusCode })(
      target,
      propertyKey,
      descriptor,
    );

    return descriptor;
  };
}
