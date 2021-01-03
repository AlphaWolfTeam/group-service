import express, { Request, Response, NextFunction } from 'express';
import { ApplicationError } from './application.error';

export const errorMiddleware = (error: Error, _req: Request, res: Response) => {
  // TODO: better logging
  console.log(`request failed with error: ${error}`);
  // convert any other error to application error (to hide the real error from the user)
  const err = error instanceof ApplicationError ? error : new ApplicationError('unknownError');
  // send response
  return res.status(err.status).json({
    message: err.message,
    name: err.name,
  });
};
