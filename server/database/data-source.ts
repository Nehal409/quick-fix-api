import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const isCompiled = __dirname.includes('dist');

const entitiesPath = isCompiled
    ? path.join(__dirname, '../src/modules/**/entities/*.entity.js')
    : path.join(__dirname, '../src/modules/**/entities/*.entity.ts');

const migrationsPath = isCompiled
    ? path.join(__dirname, 'migrations/*.js')
    : path.join(__dirname, 'migrations/*.ts');

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    username: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    entities: [entitiesPath],
    migrations: [migrationsPath],
    synchronize: false,
    logging: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
