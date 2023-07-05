import { httpServer } from './src/http_server/index';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT || 8181;

console.log(`Server has been started on port ${PORT}...`);
httpServer.listen(PORT);
