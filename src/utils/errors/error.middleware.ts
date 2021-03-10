import * as express from 'express';
import * as apm from 'elastic-apm-node';
import { ClientError } from './application.error';

export default (error: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const transaction  = apm.currentTransaction;

  // send error to apm
  apm.captureError(error);
  if (transaction) {
    transaction.result = 'error';
    transaction.end();
  }

  if (error.name === 'ValidationError') {
    res.status(400).send({
      type: error.name,
      message: error.message,
    });
  } else if (error instanceof ClientError) {
    res.status(error.code).send({
      type: error.name,
      message: error.message,
    });
  } else {
    console.log(error);
    res.status(500).send({
      type: error.name,
      message: error.message,
    });
  }

  next();
};
