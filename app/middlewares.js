import express from 'express';
import routes from './routes';

export default function middlewares(app, { before, after }) {
    before(app);
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(routes);
    after(app);
}
