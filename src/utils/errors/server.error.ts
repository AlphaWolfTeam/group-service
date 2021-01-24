import { ServerError } from './application.error';

export default class Unexpected extends ServerError {
  constructor(message?: string) {
    super(message || 'unexpected server error');
  }
}
