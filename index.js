'use strict';
const { createServer,stopServer } = require('./lib/server') ;
var logger = require('./lib/logger.js').logger('webLive');
const config = require('./config/serv.json');
const isHttps = true;

process.on('unhandledRejection', (reason, p) => {
    logger.fatal('Unhandled Rejection at:', p, 'reason:', reason);
});

let port = isHttps?config.https_port:config.http_port;
createServer(isHttps).then(
    app =>
        app.listen(port, () => {
            logger.debug(`Server listening on ${port} `);
            app.once('close', () => {
                stopServer();
              });
        }),
    err => {
        logger.error('Error while starting up server', err);
        process.exit(1);
    }
);