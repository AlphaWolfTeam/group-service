 /**
 * ApplicationError is an Error class.
*/
export class ApplicationError extends Error {
  public code: number;
  public name: string;

  constructor(message?: string, code?: number) {
    super(message);

    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.code = code || 500;
  }

  get status() {
    return this.code;
  }

}

export class ServerError extends ApplicationError {
  constructor(message?: string, code?: number) {
    super(message || 'server side error', code || 500);
  }
}

export class ClientError extends ApplicationError {
  constructor(message?: string, code?: number) {
    super(message || 'client side error', code || 400);
  }
}
