/**
 * Client Error Classes (4xx)
 * Exports all client error classes that extend BaseClientError
 */

// Base class
export { BaseClientError } from './base';

// Client error classes
// vi du la khi req body sai format, thieu filed
export { BadRequestError } from './bad-request';

// chua dang nhap hoac token invalid
export { UnauthorizedError } from './unauthorized';

// co dang nhap nhung kh co quyen
export { ForbiddenError } from './forbidden';

// kh tim thay resource
export { NotFoundError } from './not-found';

// resource bi trung
export { ConflictError } from './conflict';

// data hop le ve format nhung vi pham business rule
export { ValidationError } from './unprocessable-entity';

// goi api qua gioi han
export { RateLimitError } from './too-many-requests';
