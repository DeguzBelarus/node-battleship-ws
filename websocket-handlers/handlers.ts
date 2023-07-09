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
  IAttackResponse,
  IShipPositionData,
  IFinishResponse,
} from '../types/types';
import { User, Room, Game, ActiveGame, SellCoordinate } from '../schemas/schemas';
import {
  DEFAULT_ID_VALUE,
  KILLED_SHIPS_SELLS_COUNT,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from '../constants/constants';
import { attackHandler, battlefieldMatrixGenerator, lastShotHandler } from './utils';

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
      console.log(`${gameGuest.name}, you have already joined this room`);
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
          killedShips: [],
        },
      ];
      const newActiveGame = new ActiveGame(data.gameId, gamePlayersData, data.indexPlayer);
      this.activeGamesData = [...this.activeGamesData, newActiveGame];
    } else {
      const secondGamePlayerData: IActiveGamePlayerData = {
        indexPlayer: data.indexPlayer,
        ships: data.ships,
        killedShips: [],
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
      foundActiveGame.changeCurrentPlayer(currentPlayerIndex);

      const firstPlayerResponse: IStartGameResponse = {
        id,
        type,
        data: {
          currentPlayerIndex: foundActiveGame.currentPlayer,
          ships: foundActiveGame.gamePlayersData[0].ships,
        },
      };
      firstPlayerResponse.data = JSON.stringify(firstPlayerResponse.data);
      const secondPlayerResponse: IStartGameResponse = {
        id,
        type,
        data: {
          currentPlayerIndex: foundActiveGame.currentPlayer,
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
          currentPlayer: foundActiveGame.currentPlayer,
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
    if (data.indexPlayer !== currentGame?.currentPlayer) return;

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
    if (!attackData) return;

    if (attackData.attackedSell === 'free') {
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

      currentGame.changeCurrentPlayer(attackRecipient.indexPlayer);
      type = 'turn';
      const turnResponse: ITurnResponse = {
        id,
        type,
        data: {
          currentPlayer: currentGame.currentPlayer,
        },
      };
      turnResponse.data = JSON.stringify(turnResponse.data);
      attackerSocket?.send(JSON.stringify(turnResponse));
      attackRecipientSocket?.send(JSON.stringify(turnResponse));
    } else {
      if (!attackData.isKilled) {
        const updatedMatrix = attackData.updatedMatrix as BattlefieldMatrixType;
        this.activeGamesData = this.activeGamesData.map((activeGame) => {
          if (activeGame.gameId !== data.gameId) {
            return activeGame;
          } else {
            activeGame.gamePlayersData = activeGame.gamePlayersData.map((player) => {
              if (player.indexPlayer === attackRecipient.indexPlayer) {
                player.shipsMatrix = updatedMatrix;
              }
              return player;
            });
            return activeGame;
          }
        });

        const responseData: IAttackResponse = {
          id,
          type,
          data: {
            currentPlayer: data.indexPlayer,
            status: 'shot',
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
            currentPlayer: currentGame.currentPlayer,
          },
        };
        turnResponse.data = JSON.stringify(turnResponse.data);
        attackerSocket?.send(JSON.stringify(turnResponse));
        attackRecipientSocket?.send(JSON.stringify(turnResponse));
      } else {
        const updatedMatrix = attackData.updatedMatrix as BattlefieldMatrixType;
        this.activeGamesData = this.activeGamesData.map((activeGame) => {
          if (activeGame.gameId !== data.gameId) {
            return activeGame;
          } else {
            activeGame.gamePlayersData = activeGame.gamePlayersData.map((player) => {
              if (player.indexPlayer === attackRecipient.indexPlayer) {
                player.shipsMatrix = updatedMatrix;
              }
              return player;
            });
            return activeGame;
          }
        });

        const lastShotResults = lastShotHandler(
          updatedMatrix,
          attackRecipient.killedShips,
          data.x,
          data.y
        );
        lastShotResults?.aroundShotsCoords?.forEach((aroundSellCoordinate) => {
          const responseData: IAttackResponse = {
            id,
            type,
            data: {
              currentPlayer: data.indexPlayer,
              status: 'miss',
              position: {
                x: aroundSellCoordinate.x,
                y: aroundSellCoordinate.y,
              },
            },
          };
          responseData.data = JSON.stringify(responseData.data);
          attackerSocket?.send(JSON.stringify(responseData));
          attackRecipientSocket?.send(JSON.stringify(responseData));
        });

        lastShotResults?.killedShipSells.forEach((killedShipSellCoordinate) => {
          const responseData: IAttackResponse = {
            id,
            type,
            data: {
              currentPlayer: data.indexPlayer,
              status: 'killed',
              position: {
                x: killedShipSellCoordinate.x,
                y: killedShipSellCoordinate.y,
              },
            },
          };
          responseData.data = JSON.stringify(responseData.data);
          attackerSocket?.send(JSON.stringify(responseData));
          attackRecipientSocket?.send(JSON.stringify(responseData));
        });

        currentGame?.addPlayerKilledShips(
          lastShotResults?.killedShipSells as Array<IShipPositionData>,
          attackRecipient.indexPlayer
        );

        if (
          attackRecipient.killedShips?.filter((sell) => sell).length === KILLED_SHIPS_SELLS_COUNT
        ) {
          type = 'finish';
          const finishResponse: IFinishResponse = {
            id,
            type,
            data: {
              winPlayer: data.indexPlayer,
            },
          };
          finishResponse.data = JSON.stringify(finishResponse.data);
          attackerSocket?.send(JSON.stringify(finishResponse));
          attackRecipientSocket?.send(JSON.stringify(finishResponse));

          this.activeGamesData = this.activeGamesData.filter(
            (activeGame) => activeGame.gameId !== currentGame.gameId
          );
        } else {
          type = 'turn';
          const turnResponse: ITurnResponse = {
            id,
            type,
            data: {
              currentPlayer: currentGame.currentPlayer,
            },
          };
          turnResponse.data = JSON.stringify(turnResponse.data);
          attackerSocket?.send(JSON.stringify(turnResponse));
          attackRecipientSocket?.send(JSON.stringify(turnResponse));
        }
      }
    }
  }
}

export const messageHandler = new MessageHandler();
