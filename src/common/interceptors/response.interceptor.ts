import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from 'common/response/success';
import { isRawResponse } from 'common/types/response.types';
import {
  ApiSuccessMetadata,
  ApiCustomMetadata,
  ApiErrorMetadata,
} from 'common/types/response.types';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    // Check for decorator metadata
    const successMetadata = this.reflector.get<ApiSuccessMetadata>(
      'api:success',
      context.getHandler(),
    );
    const customMetadata = this.reflector.get<ApiCustomMetadata>(
      'api:custom',
      context.getHandler(),
    );
    const errorMetadata = this.reflector.get<ApiErrorMetadata>(
      'api:error',
      context.getHandler(),
    );
    const rawResponse = this.reflector.get<boolean>(
      'api:raw',
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // Allow controllers to bypass wrapping by returning ApiResponse directly
        if (data instanceof ApiResponse) {
          return data.toJSON();
        }

        // Allow controllers to bypass wrapping by returning { __raw: true, data: ... }
        if (isRawResponse(data)) {
          return data.data;
        }

        // Check for @RawResponse decorator
        if (rawResponse) {
          return data;
        }

        // Handle @ApiError decorator
        if (errorMetadata) {
          const errorResponse = ApiResponse.error(
            errorMetadata.message || 'An error occurred',
          );

          if (req.id) {
            errorResponse.withRequestId(req.id);
          }

          if (res) {
            res.status(errorMetadata.statusCode);
          }

          return errorResponse.toJSON();
        }

        // Handle @ApiResponse (custom) decorator
        if (customMetadata) {
          const isError = customMetadata.statusCode >= 400;
          const customResponse = new ApiResponse(
            !isError,
            isError ? undefined : data,
            customMetadata.message || (isError ? 'Error' : 'Success'),
          );

          if (req.id) {
            customResponse.withRequestId(req.id);
          }

          if (res && customMetadata.statusCode) {
            res.status(customMetadata.statusCode);
          }

          return customResponse.toJSON();
        }

        // Handle @ApiSuccess decorator
        if (successMetadata) {
          const successResponse = ApiResponse.success(
            data,
            successMetadata.message || 'Success',
          );

          if (
            req.id &&
            (!successMetadata.options ||
              successMetadata.options.includeRequestId !== false)
          ) {
            successResponse.withRequestId(req.id);
          }

          // Apply additional options if provided
          if (successMetadata.options) {
            if (successMetadata.options.metadata) {
              Object.assign(successResponse, successMetadata.options.metadata);
            }

            if (successMetadata.options.statusCode && res) {
              res.status(successMetadata.options.statusCode);
            }

            if (successMetadata.options.headers && res) {
              Object.entries(successMetadata.options.headers).forEach(
                ([key, value]) => {
                  res.setHeader(key, value);
                },
              );
            }

            if (successMetadata.options.transform) {
              const transformed = successMetadata.options.transform(
                successResponse.toJSON(),
              );
              return transformed;
            }
          }

          return successResponse.toJSON();
        }

        // Create standard success response (default behavior)
        const defaultResponse = ApiResponse.success(data);

        // Add request ID if available
        if (req.id) {
          defaultResponse.withRequestId(req.id);
        }

        return defaultResponse.toJSON();
      }),
    );
  }
}
