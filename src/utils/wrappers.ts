import * as apm from 'elastic-apm-node';
import { NextFunction, Request, Response } from 'express';
import { startApmTransaction } from './apm';

export const wrapMiddleware = (func: (req: Request, res?: Response) => Promise<void>, functionName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    startApmTransaction(req, functionName);
    func(req, res)
      .then(() => next())
      .catch(next);
  };
};

export const wrapValidator = wrapMiddleware;

export const wrapController = (func: (req: Request, res: Response, next?: NextFunction) => Promise<void>, functionName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let transaction  = apm.currentTransaction;
    if (!transaction) transaction = startApmTransaction(req, functionName);
    func(req, res, next)
    .then(handleRequestSuccess(transaction))
    .catch(next);
  };
};

const handleRequestSuccess = (transaction: any) => {
  return () => {
    if (transaction) {
      transaction.result = 'success';
      transaction.end();
    }
  };
};
