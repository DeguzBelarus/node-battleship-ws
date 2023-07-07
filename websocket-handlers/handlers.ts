import WebSocket from 'ws';
import { IncomingMessage } from 'http';

import {
  IAddUserToRoomRequestData,
  ICreateRoomResponse,
  IRegistrationRequestData,
  IUserData,
  IUsersRoom,
  WebsocketMessageType,
  IGameData,
  IAddUserShipsRequestData,
  IActiveGame,
  IActiveGamePlayerData,
  IStartGameResponse,
  ITurnResponse,
  IAttackRequestData,
  BattlefieldMatrixType,
  SellType,
  IAttackResponse,
} from '../types/types';
import { User, Room, Game, ActiveGame } from '../schemas/schemas';
import { DEFAULT_ID_VALUE, MIN_PASSWORD_LENGTH, MIN_USERNAME_LENGTH } from '../constants/constants';
import { attackHandler, battlefieldMatrixGenerator } from './utils';

class MessageHandler {
  users: Array<IUserData> = [];
  roomsData: Array<IUsersRoom> = [];
  playersData: Array<IGameData> = [];
  activeGamesData: Array<IActiveGame> = [];
  usersLoggedIn: Array<string> = [];
  roomCounter = 0;
  gameCounter = 0;

  clearDisconnectedUserRooms(
    ws: WebSocket,
    id: number,
    websocketsServer: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>
  ) {
    const disconnectedUser = this.users.find((user) => user.ws === ws);
    if (disconnectedUser) {
      this.usersLoggedIn = this.usersLoggedIn.filter(
        (userOnline) => userOnline !== disconnectedUser.name
      );
      console.log(`${disconnectedUser?.name} disconnected`);
      console.log(`users online: ${this.usersLoggedIn}`);
    }

    this.roomsData = this.roomsData.filter((room) => room.roomUsers[0]?.ws !== ws);
    const type: WebsocketMessageType = 'update_room';
    const roomsData = JSON.stringify({
      type,
      id,
      data: JSON.stringify(this.roomsData),
    });

    websocketsServer.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(roomsData);
      }
    });
  }

  getRoomsData(id: number) {
    const type: WebsocketMessageType = 'update_room';
    return {
      type,
      id,
      data: JSON.stringify(this.roomsData),
    };
  }

  registrationOrLogin(
    data: IRegistrationRequestData,
    type: WebsocketMessageType,
    id: number,
    ws: WebSocket
  ) {
    if (data.name?.length < MIN_USERNAME_LENGTH) {
      ws.send(
        JSON.stringify({
          type,
          id,
          data: JSON.stringify({
            name: '',
            index: DEFAULT_ID_VALUE,
            error: true,
            errorText: 'Minimum username length is 5 symbols',
          }),
        })
      );
      return;
    }
    if (data.password?.length < MIN_PASSWORD_LENGTH) {
      ws.send(
        JSON.stringify({
          type,
          id,
          data: JSON.stringify({
            name: '',
            index: 0,
            error: true,
            errorText: 'Minimum password length is 5 symbols',
          }),
        })
      );
      return;
    }

    const existedUser = this.users.find((user) => user.name === data.name);
    if (existedUser) {
      if (existedUser.password === data.password) {
        if (this.usersLoggedIn.includes(existedUser.name)) {
          ws.send(
            JSON.stringify({
              type,
              id,
              data: JSON.stringify({
                name: '',
                index: 0,
                error: true,
                errorText: 'You have already logged in via other device',
              }),
            })
          );
          return;
        }
        this.users = this.users.map((user) => {
          if (user.name === existedUser.name) {
            user.ws = ws;
            return user;
          } else {
            return user;
          }
        });
        ws.send(
          JSON.stringify({
            type,
            id,
            data: JSON.stringify({
              name: existedUser.name,
              index: existedUser.index,
              error: false,
              errorText: '',
            }),
          })
        );
        this.usersLoggedIn.push(existedUser.name);
        console.log(`${existedUser.name} has logged in`);
        console.log(`users online: ${this.usersLoggedIn}`);
      } else {
        ws.send(
          JSON.stringify({
            type,
            id,
            data: JSON.stringify({
              name: '',
              index: 0,
              error: true,
              errorText: 'Wrong password',
            }),
          })
        );
      }
      return;
    }

    const newUser = new User(data.name, this.users.length, data.password, ws);
    this.users = [...this.users, newUser];
    ws.send(
      JSON.stringify({
        type,
        id,
        data: JSON.stringify({
          name: newUser.name,
          index: newUser.index,
          error: false,
          errorText: '',
        }),
      })
    );
    this.usersLoggedIn.push(newUser.name);
    console.log(`${newUser.name} has logged in`);
    console.log(`users online: ${this.usersLoggedIn}`);
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
    ws: WebSocket,
    websocketsServer: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>
  ) {
    type = 'create_game';
    this.gameCounter++;

    const gameOwner = this.roomsData.find((room) => room.roomId === data.indexRoom)
      ?.roomUsers[0] as IUserData;
    const gameGuest = this.users.find((user) => user.ws === ws) as IUserData;
    if (gameGuest.name === gameOwner.name) {
      console.log(`${gameGuest.name}, you cannot join your own room`);
      return;
    }
    const ownerGameData = new Game(this.gameCounter, gameOwner.index);
    const guestGameData = new Game(this.gameCounter, gameGuest.index);

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
    this.roomsData = this.roomsData.filter((room) => room.roomUsers[0]?.name !== gameGuest.name);
    this.roomsData = this.roomsData.filter((room) => room.roomUsers[0]?.name !== gameOwner.name);

    type = 'update_room';
    const roomsData = JSON.stringify({
      type,
      id,
      data: JSON.stringify(this.roomsData),
    });
    ws.send(roomsData);
    websocketsServer.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(roomsData);
      }
    });
  }

  addUserShips(data: IAddUserShipsRequestData, type: WebsocketMessageType, id: number) {
    type = 'start_game';
    const foundActiveGame = this.activeGamesData.find(
      (activeGame) => activeGame.gameId === data.gameId
    );

    if (!foundActiveGame) {
      const gamePlayersData: Array<IActiveGamePlayerData> = [
        {
          indexPlayer: data.indexPlayer,
          ships: data.ships,
        },
      ];
      const newActiveGame = new ActiveGame(data.gameId, gamePlayersData);
      this.activeGamesData = [...this.activeGamesData, newActiveGame];
    } else {
      const secondGamePlayerData: IActiveGamePlayerData = {
        indexPlayer: data.indexPlayer,
        ships: data.ships,
      };
      this.activeGamesData = this.activeGamesData.map((activeGame) => {
        if (activeGame.gameId !== data.gameId) {
          return activeGame;
        } else {
          activeGame.gamePlayersData = [...activeGame.gamePlayersData, secondGamePlayerData];
          return activeGame;
        }
      });

      const firstPlayer = this.users.find(
        (user) => user.index === foundActiveGame.gamePlayersData[0].indexPlayer
      ) as IUserData;
      const secondPlayer = this.users.find(
        (user) => user.index === foundActiveGame.gamePlayersData[1].indexPlayer
      ) as IUserData;

      const currentPlayerIndex = Math.random() * 1 <= 0.5 ? firstPlayer.index : secondPlayer.index;
      const firstPlayerResponse: IStartGameResponse = {
        id,
        type,
        data: {
          currentPlayerIndex,
          ships: foundActiveGame.gamePlayersData[0].ships,
        },
      };
      firstPlayerResponse.data = JSON.stringify(firstPlayerResponse.data);
      const secondPlayerResponse: IStartGameResponse = {
        id,
        type,
        data: {
          currentPlayerIndex,
          ships: foundActiveGame.gamePlayersData[1].ships,
        },
      };
      secondPlayerResponse.data = JSON.stringify(secondPlayerResponse.data);

      firstPlayer.ws?.send(JSON.stringify(firstPlayerResponse));
      secondPlayer.ws?.send(JSON.stringify(firstPlayerResponse));

      const firstPlayerBattlefield = battlefieldMatrixGenerator(
        foundActiveGame.gamePlayersData[0].ships
      );
      const secondPlayerBattlefield = battlefieldMatrixGenerator(
        foundActiveGame.gamePlayersData[1].ships
      );
      this.activeGamesData = this.activeGamesData.map((activeGame) => {
        if (activeGame.gameId !== data.gameId) {
          return activeGame;
        } else {
          activeGame.gamePlayersData[0].shipsMatrix = firstPlayerBattlefield;
          activeGame.gamePlayersData[1].shipsMatrix = secondPlayerBattlefield;
          return activeGame;
        }
      });

      type = 'turn';
      const turnResponse: ITurnResponse = {
        id,
        type,
        data: {
          currentPlayer: currentPlayerIndex,
        },
      };
      turnResponse.data = JSON.stringify(turnResponse.data);

      firstPlayer.ws?.send(JSON.stringify(turnResponse));
      secondPlayer.ws?.send(JSON.stringify(turnResponse));
    }
  }

  attack(data: IAttackRequestData, type: WebsocketMessageType, id: number) {
    const currentGame = this.activeGamesData.find(
      (activeGame) => activeGame.gameId === data.gameId
    );
    const attackRecipient = currentGame?.gamePlayersData.filter(
      (playerData) => playerData.indexPlayer !== data.indexPlayer
    )[0] as IActiveGamePlayerData;
    const attackRecipientSocket = this.users.find(
      (user) => user.index === attackRecipient.indexPlayer
    )?.ws;
    const attackerSocket = this.users.find((user) => user.index === data.indexPlayer)?.ws;

    const attackData = attackHandler(
      attackRecipient.shipsMatrix as BattlefieldMatrixType,
      data.x,
      data.y
    );

    if (attackData.attackedSell.startsWith('f')) {
      const responseData: IAttackResponse = {
        id,
        type,
        data: {
          currentPlayer: data.indexPlayer,
          status: 'miss',
          position: {
            x: data.x,
            y: data.y,
          },
        },
      };
      responseData.data = JSON.stringify(responseData.data);
      attackerSocket?.send(JSON.stringify(responseData));
      attackRecipientSocket?.send(JSON.stringify(responseData));

      type = 'turn';
      const turnResponse: ITurnResponse = {
        id,
        type,
        data: {
          currentPlayer: attackRecipient.indexPlayer,
        },
      };
      turnResponse.data = JSON.stringify(turnResponse.data);
      attackerSocket?.send(JSON.stringify(turnResponse));
      attackRecipientSocket?.send(JSON.stringify(turnResponse));
    }
    console.log(attackData);
    console.log(this.activeGamesData);
  }
}

export const messageHandler = new MessageHandler();
