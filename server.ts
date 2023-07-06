import { createServer } from 'http';
import dotenv from 'dotenv';

import { router } from './router/router';
import './websocket-handlers';

dotenv.config();
const PORT = process.env.PORT || 8181;
export const httpServer = createServer(router);

(function () {
  try {
    httpServer.listen(PORT, () => {
      console.log(`Server has been started on port ${PORT}...`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
  }
})();
