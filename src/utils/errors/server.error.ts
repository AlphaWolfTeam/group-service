import { ServerError } from './application.error';

export class Unexpected extends ServerError {
  constructor(message?: string) {
    super(message || 'unexpected server error');
  }
}
