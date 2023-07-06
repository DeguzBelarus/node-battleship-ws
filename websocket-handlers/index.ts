import WebSocket, { WebSocketServer } from 'ws';

import {
  IAddUserToRoomRequestData,
  IRegistrationRequestData,
  IWebsocketMessage,
} from '../types/types';
import { WEBSOCKET_CONFIG } from '../configs/websocketsConfig';
import { messageHandler } from './handlers';

export const websocketsServer = new WebSocketServer(WEBSOCKET_CONFIG);
websocketsServer.on('connection', function connection(ws) {
  console.log(`connection...total online users: ${websocketsServer.clients.size}`);

  ws.on('close', () => {
    console.log(`disconnection...total online users: ${websocketsServer.clients.size}`);
  });

  ws.on('error', console.error);

  ws.on('message', (data: Buffer) => {
    try {
      const messageData = JSON.parse(data.toString()) as IWebsocketMessage;
      switch (messageData.type) {
        case 'reg':
          const registrationData = JSON.parse(
            messageData.data as string
          ) as IRegistrationRequestData;
          const responseRegistrationData = messageHandler.registration(
            registrationData,
            messageData.type,
            messageData.id,
            ws
          );
          responseRegistrationData.data = JSON.stringify(responseRegistrationData.data);
          ws.send(JSON.stringify(responseRegistrationData));
          ws.send(JSON.stringify(messageHandler.getRoomsData(messageData.id)));
          break;
        case 'create_room':
          const responseCreateGameData = messageHandler.createRoom(
            messageData.type,
            messageData.id,
            ws
          );
          responseCreateGameData.data = JSON.stringify(responseCreateGameData.data);
          ws.send(JSON.stringify(responseCreateGameData));
          websocketsServer.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(responseCreateGameData));
            }
          });
          break;
        case 'add_user_to_room':
          const addUserToRoomData = JSON.parse(
            messageData.data as string
          ) as IAddUserToRoomRequestData;
          messageHandler.addUserToRoom(addUserToRoomData, messageData.type, messageData.id, ws);
          ws.send(JSON.stringify(messageHandler.getRoomsData(messageData.id)));
          websocketsServer.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messageHandler.getRoomsData(messageData.id)));
            }
          });
          break;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
      }
    }
  });
});
