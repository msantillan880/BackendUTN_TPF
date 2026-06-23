import winston from 'winston';

// Logger simple con salida en texto (no JSON), rotación no incluida
const { combine, timestamp, printf } = winston.format;

const textFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} - ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSS' }),
        textFormat
    ),
    transports: [
        new winston.transports.Console({ level: 'info' }),
        new winston.transports.File({ filename: 'src/logs/registro_logs.log', level: 'info' })
    ],
    exitOnError: false
});

export default logger;
