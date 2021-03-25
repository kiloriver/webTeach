const log4js = require('log4js');
levels = {
    'trace': log4js.levels.TRACE,
    'debug': log4js.levels.DEBUG,
    'info': log4js.levels.INFO,
    'warn': log4js.levels.WARN,
    'error': log4js.levels.ERROR,
    'fatal': log4js.levels.FATAL
};

function judgePath(pathStr) {
    if (!fs.existsSync(pathStr)) {
        fs.mkdirSync(pathStr);
        console.log('createPath: ' + pathStr);
    }
}
log4js.configure({
    'appenders': {
        file: {
            type : 'file',
            filename: __dirname + '/logs/file/serv.log',
            maxLogSize : 10,
            backups : 3,
            encoding : 'utf-8',
            category : 'log_file',
            numBackups: 5,
            compress: true,
            encoding: 'utf-8',
        },
        dateFile: {
            type: 'dateFile',
            filename: './logs/datafile/somethings.log',
            pattern: 'yyyy-MM-dd-hh',
            compress: true
        },
        out: {
            type: 'stdout'
        }
    },
    'categories': {
        default: { 
            appenders: ['file', 'dateFile', 'out'], 
            level: 'trace' 
        }
    }
});

  exports.logger = function (name) {
    let logger = log4js.getLogger(name);    
    return logger;
};

exports.use = function (app, level) {
    //加载中间件
      app.use(log4js.connectLogger(log4js.getLogger('logInfo'), {
          level: levels[level] || levels['debug'],
        //格式化http相关信息
          format: ':method :url :status'
      }));
  };