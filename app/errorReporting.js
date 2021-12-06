import config from 'config';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

const trackError = (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    Sentry.captureException(e);
};

export default function errorReporting(app) {
    Sentry.init({
        dsn: config.Sentry.Dsn,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Express.js middleware tracing
            new Tracing.Integrations.Express({ app }),
        ],

        // We recommend adjusting this value in production, or using tracesSampler
        // for finer control
        tracesSampleRate: 1.0,
    });

    return {
        middlewares: {
            before: () => {
                // RequestHandler creates a separate execution context using domains, so that every
                // transaction/span/breadcrumb is attached to its own Hub instance
                app.use(Sentry.Handlers.requestHandler());
                // TracingHandler creates a trace for every incoming request
                app.use(Sentry.Handlers.tracingHandler());
            },
            after: () => {
                // The error handler must be before any other error middleware and after all controllers
                app.use(Sentry.Handlers.errorHandler());
            },
        },
    };
}

export { trackError };
