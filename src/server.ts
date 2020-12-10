import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';
import * as logger from 'morgan';

import { once } from 'events';
import errorMiddleware from './utils/errors/error.middleware';
import GroupRouter from './group/utils/group.router';
import { ResourceNotFound } from './utils/errors/client.error';

export default class Server {
  private app: express.Application;
  private http: http.Server | undefined;
  private port: string;

  constructor(port: string) {
    this.port = port;
    this.app = express();

    this.configureMiddleware();
    this.configureApiRoutes();
    this.configureErrorHandlers();
  }

  private configureMiddleware() {
    this.app.use(logger('tiny'));
    this.app.use(helmet());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
  }

  private configureApiRoutes() {
    this.app.use(GroupRouter);
  }

  // configureErrorHandlers
  private configureErrorHandlers() {
    /* handle all non-existing routes - without logging */
    this.app.all('*', (req, res) => {
      const err = new ResourceNotFound(`Route: ${req.originalUrl} not found`);
      return res.status(err.status).json({
        message: err.message,
        name: err.name,
      });
    });

    this.app.use(errorMiddleware);
  }

  public async start() {
    console.log(`About to listen with port: ${this.port}`);
    this.http = this.app.listen(this.port);
    await once(this.http, 'listening');
  }
}
