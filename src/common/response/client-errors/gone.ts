import { BaseClientError } from './base';

/**
 * Gone Error Class
 * Represents 410 Gone errors for expired resources
 */
export class GoneError extends BaseClientError {
  constructor(
    message: string = 'Resource has expired',
    code: string = 'GONE',
    details: Record<string, unknown> = {},
  ) {
    super(message, 410, code, details);
  }
}

export default GoneError;
