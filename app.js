const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const logger = require('morgan');
const Emitter = require('events');

const indexRouter = require('./routes/index');

module.exports = function () {
    const app = express();
    const emitter = new Emitter();

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.set('layout', 'layout');

    app.use(logger('dev'));
    app.use(expressLayouts);
    app.use('/favicon.ico', express.static(path.join(__dirname, '/public/images/favicon.png')));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', indexRouter);

    // FIX : not working
    app.use(function (req, res, next) {
        next(createError(404));
    });
    // FIX : not working
    app.use(function (err, req, res, next) {
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        res.status(err.status || 500);
        res.render('error');
    });

    return { app: app, eventEmitter: emitter };
};
