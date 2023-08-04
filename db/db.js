import { config } from 'dotenv';

config();

const isProd = process.env.NODE_ENV === 'production';

export const getDbUrl = () => isProd ? process.env.PROD_DB_URI || process.env.LOCAL_DB_URI : process.env.LOCAL_DB_URI;