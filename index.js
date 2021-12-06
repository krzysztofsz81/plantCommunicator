import http from 'http';
import express from 'express';
import config from 'config';
import initWebSocketServer from './app/websocket';
import errorReporting from './app/errorReporting';
import middlewares from './app/middlewares';

const app = express();
const { middlewares: errorMiddlewares } = errorReporting(app);

middlewares(app, { before: errorMiddlewares.before, after: errorMiddlewares.after });

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(config.Port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is listening on port ${config.Port}`);
});
