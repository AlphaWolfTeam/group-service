import * as apm from 'elastic-apm-node';
import { Request } from 'express';
import config from '../config';

export function extractTraceparent(req: Request): string | undefined {
  const traceparent = req.header(config.apm.traceParentHeader);
  return traceparent;
}

export function startApmTransaction(req: Request, functionName: string) {
  const traceparent = extractTraceparent(req);
  const transactionOptions = traceparent ? { childOf: traceparent } : {};
  return apm.startTransaction(functionName, transactionOptions);
}
