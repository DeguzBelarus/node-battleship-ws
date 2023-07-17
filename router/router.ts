import http from 'http';

import { RequestMethodsEnum } from '../types/types';
import { mainController } from '../controllers/user-controller';

export const router = (
  request: http.IncomingMessage,
  response: http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage;
  }
) => {
  const method = request.method;
  switch (method) {
    case RequestMethodsEnum.GET:
      mainController.rootUniversalGetRequest(request, response);
      break;
    default:
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ message: "This route doesn't exist" }));
      response.end();
  }
};
