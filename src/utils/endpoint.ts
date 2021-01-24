import { Request, Response, Router } from 'express';
import * as Joi from 'joi';
import config from '../config';
import { InvalidArgument } from './errors/client.error';
import ValidateRequest from './joi';
import { wrapController } from './wrappers';

export default abstract class Endpoint {

  path: string;
  requestType: HttpRequestType;
  requestSchema: Joi.ObjectSchema;
  validateRequest = ValidateRequest;
  wrapController = wrapController;

  constructor(requestType:HttpRequestType, path: string) {
    this.path = path;
    this.requestType = requestType;
    this.requestSchema = this.createRequestSchema();
  }

  createExpressRouter(): Router {
    const router: Router = Router();
    router[this.requestType](
      this.path,
      this.validateRequest(this.requestSchema),
      this.wrapController(this.requestHandler),
      (req, res) => { console.log('Can you here me?'); },
    );
    return router;
  }

  abstract requestHandler(req: Request, res: Response): Promise<void>;

  abstract createRequestSchema(): Joi.ObjectSchema;

}

export function createFeatureRouter(...endpoints: Endpoint[]): Router {
  const featureRouter: Router = Router();
  endpoints.forEach((endpoint) => {
    featureRouter.use(endpoint.createExpressRouter());
  });
  return featureRouter;
}

export enum HttpRequestType {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

/**
 * Extracts the requester ID from the user header of the express request.
 * @param req - the express request.
 * @returns the user ID that is in the request header.
 * @throws InvalidArgument if the header is empty.
 */
export function getRequesterIdFromRequest(req: Request): string {
  const id = req.header(config.userHeader);

  if (typeof(id) !== 'string') {
    // Should never happen if the function already have a validation on this parameter.
    throw new InvalidArgument(`requester ID should be sent in the ${config.userHeader} header`);
  }

  return id;
}
