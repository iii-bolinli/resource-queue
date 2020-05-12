import dotenv from 'dotenv';

dotenv.config({path: '.env'});

export interface IConfig {
  port: number
  debugLogging: boolean
  jwtSecret: string
  sessionSecret: string
}

const config: IConfig = {
  port: +process.env.PORT || 3000,
  debugLogging: process.env.NODE_ENV == 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-whatever',
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-whatever',
};

export {config};
