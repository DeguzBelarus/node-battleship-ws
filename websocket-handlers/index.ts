import WebSocket, { WebSocketServer } from 'ws';

import {
  IAddUserShipsRequestData,
  IAddUserToRoomRequestData,
  IAttackRequestData,
  IRegistrationRequestData,
  IWebsocketMessage,
} from '../types/types';
import { WEBSOCKET_CONFIG } from '../configs/websocketsConfig';
import { messageHandler } from './handlers';
import { DEFAULT_ID_VALUE } from '../constants/constants';

const websocketsServer = new WebSocketServer(WEBSOCKET_CONFIG);
websocketsServer.on('connection', function connection(ws) {
  console.log(`connection...total online users: ${websocketsServer.clients.size}`);

  ws.on('close', () => {
    console.log(`disconnection...total online users: ${websocketsServer.clients.size}`);
    messageHandler.clearDisconnectedUserRooms(ws, DEFAULT_ID_VALUE, websocketsServer);
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
          messageHandler.registrationOrLogin(
            registrationData,
            messageData.type,
            messageData.id,
            ws
          );
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
          messageHandler.addUserToRoom(
            addUserToRoomData,
            messageData.type,
            messageData.id,
            ws,
            websocketsServer
          );
          break;
        case 'add_ships':
          const addUserShipsData = JSON.parse(
            messageData.data as string
          ) as IAddUserShipsRequestData;
          messageHandler.addUserShips(addUserShipsData, messageData.type, messageData.id);
          break;
        case 'attack':
          const attackData = JSON.parse(messageData.data as string) as IAttackRequestData;
          messageHandler.attack(attackData, messageData.type, messageData.id);
          break;
        case 'randomAttack':
          console.log('randomAttack');
          break;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
      }
    }
  });
});
