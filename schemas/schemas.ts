import WebSocket from 'ws';

import {
  IUserData,
  IUsersRoom,
  IGameData,
  IActiveGame,
  IActiveGamePlayerData,
  IShipPositionData,
} from '../types/types';

export class User implements IUserData {
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

export class Room implements IUsersRoom {
  roomId: number;
  roomUsers: Array<IUserData>;
  constructor(roomId: number, roomUsers: Array<IUserData>) {
    this.roomId = roomId;
    this.roomUsers = roomUsers;
  }
}

export class Game implements IGameData {
  idGame: number;
  idPlayer: number;
  constructor(idGame: number, idPlayer: number) {
    this.idGame = idGame;
    this.idPlayer = idPlayer;
  }
}

export class ActiveGame implements IActiveGame {
  gameId: number;
  gamePlayersData: Array<IActiveGamePlayerData>;
  currentPlayer: number;
  constructor(
    gameId: number,
    gamePlayersData: Array<IActiveGamePlayerData>,
    currentPlayer: number
  ) {
    this.gameId = gameId;
    this.gamePlayersData = gamePlayersData;
    this.currentPlayer = currentPlayer;
  }

  addPlayerKilledShips(killedShipCoords: Array<IShipPositionData>, playerIndex: number) {
    this.gamePlayersData.map((playerData) => {
      if (playerData.indexPlayer === playerIndex && playerData.killedShips) {
        playerData.killedShips = [...playerData.killedShips, ...killedShipCoords];
      }
      return playerData;
    });
  }

  changeCurrentPlayer(currentPlayerIndex: number) {
    this.currentPlayer = currentPlayerIndex;
  }
}

export class SellCoordinate implements IShipPositionData {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
