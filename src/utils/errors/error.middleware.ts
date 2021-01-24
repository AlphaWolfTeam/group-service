import * as express from 'express';
import { ClientError } from './application.error';

export default (error: Error, _req: express.Request,
  res: express.Response, next: express.NextFunction) => {
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

  // TODO: add some logging

  next();
};
