import WebSocket from 'ws';

import {
  IAddUserToRoomRequestData,
  ICreateRoomResponse,
  IRegistrationRequestData,
  IRegistrationResponse,
  IUserData,
  IUsersRoom,
  WebsocketMessageType,
  IGameData,
} from '../types/types';

class User implements IUserData {
  name: string;
  index: number;
  password?: string;
  ws: WebSocket;
  constructor(name: string, index: number, password: string, ws: WebSocket) {
    this.name = name;
    this.index = index;
    this.password = password;
    this.ws = ws;
  }
}

class Room implements IUsersRoom {
  roomId: number;
  roomUsers: Array<IUserData>;
  constructor(roomId: number, roomUsers: Array<IUserData>) {
    this.roomId = roomId;
    this.roomUsers = roomUsers;
  }
}

class Game implements IGameData {
  idGame: number;
  idPlayer: number;
  constructor(idGame: number, idPlayer: number) {
    this.idGame = idGame;
    this.idPlayer = idPlayer;
  }
}

class MessageHandler {
  users: Array<IUserData> = [];
  roomsData: Array<IUsersRoom> = [];
  gamesData: Array<IGameData> = [];
  roomCounter = 0;
  gameCounter = 0;
  playerCounter = 0;

  getRoomsData(id: number) {
    const type: WebsocketMessageType = 'update_room';
    return {
      type,
      id,
      data: JSON.stringify(this.roomsData),
    };
  }

  registration(
    data: IRegistrationRequestData,
    type: WebsocketMessageType,
    id: number,
    ws: WebSocket
  ): IRegistrationResponse {
    if (data.name?.length < 5) {
      return {
        type,
        id,
        data: {
          name: '',
          index: 0,
          error: true,
          errorText: 'Minimum username length is 5 symbols',
        },
      };
    }
    if (data.password?.length < 5) {
      return {
        type,
        id,
        data: {
          name: '',
          index: 0,
          error: true,
          errorText: 'Minimum password length is 5 symbols',
        },
      };
    }

    const existedUser = this.users.find((user) => user.name === data.name);
    if (existedUser) {
      if (existedUser.password === data.password) {
        this.users = this.users.map((user) => {
          if (user.name === existedUser.name) {
            user.ws = ws;
            return user;
          } else {
            return user;
          }
        });
        return {
          type,
          id,
          data: {
            name: existedUser.name,
            index: existedUser.index,
            error: false,
            errorText: '',
          },
        };
      } else {
        return {
          type,
          id,
          data: {
            name: '',
            index: 0,
            error: true,
            errorText: 'Wrong password',
          },
        };
      }
    }

    const newUser = new User(data.name, this.users.length, data.password, ws);
    this.users = [...this.users, newUser];
    return {
      type,
      id,
      data: {
        name: newUser.name,
        index: newUser.index,
        error: false,
        errorText: '',
      },
    };
  }

  createRoom(type: WebsocketMessageType, id: number, ws: WebSocket): ICreateRoomResponse {
    type = 'update_room';
    this.roomCounter++;
    const roomOwner = this.users.find((user) => user.ws === ws) as IUserData;
    this.roomsData = [...this.roomsData, new Room(this.roomCounter, [roomOwner])];
    return {
      type,
      id,
      data: this.roomsData,
    };
  }

  addUserToRoom(
    data: IAddUserToRoomRequestData,
    type: WebsocketMessageType,
    id: number,
    ws: WebSocket
  ) {
    type = 'create_game';
    this.gameCounter++;
    this.playerCounter++;

    const gameOwner = this.roomsData.find((room) => room.roomId === data.indexRoom)
      ?.roomUsers[0] as IUserData;
    const ownerGameData = new Game(this.gameCounter, this.playerCounter);
    this.playerCounter++;
    const guestGameData = new Game(this.gameCounter, this.playerCounter);

    gameOwner.ws?.send(
      JSON.stringify({
        type,
        id,
        data: JSON.stringify(ownerGameData),
      })
    );
    ws.send(
      JSON.stringify({
        type,
        id,
        data: JSON.stringify(guestGameData),
      })
    );

    this.roomsData = this.roomsData.filter((room) => room.roomId !== data.indexRoom);
  }
}

export const messageHandler = new MessageHandler();
