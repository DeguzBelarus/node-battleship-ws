import http from 'http';
import { readFile } from 'fs';
import { dirname, resolve } from 'path';

export class MainController {
  rootUniversalGetRequest(
    request: http.IncomingMessage,
    response: http.ServerResponse<http.IncomingMessage> & {
      req: http.IncomingMessage;
    }
  ) {
    const __dirname = resolve(dirname(''));
    const file_path =
      __dirname + (request.url === '/' ? '/front/index.html' : '/front' + request.url);

    readFile(file_path, function (err, data) {
      if (err) {
        response.writeHead(404);
        response.end(JSON.stringify(err));
        return;
      }
      response.writeHead(200);
      response.end(data);
    });
  }
}

export const mainController = new MainController();
