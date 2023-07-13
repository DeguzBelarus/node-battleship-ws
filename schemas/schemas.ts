import WebSocket from 'ws';

import {
  IUserData,
  IUsersRoom,
  IGameData,
  IActiveGame,
  IActiveGamePlayerData,
  IShipPositionData,
  IWinnerData,
  IShipData,
  BattlefieldMatrixType,
  ShipType,
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

export class Ship implements IShipData {
  position: IShipPositionData;
  direction: boolean;
  length: number;
  type: ShipType;
  constructor(position: IShipPositionData, direction: boolean, length: number, type: ShipType) {
    this.position = position;
    this.direction = direction;
    this.length = length;
    this.type = type;
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

export class ActiveGamePlayer implements IActiveGamePlayerData {
  ships: Array<IShipData>;
  indexPlayer: number;
  shipsMatrix?: BattlefieldMatrixType;
  killedShips: Array<IShipPositionData>;
  constructor(
    ships: Array<IShipData>,
    indexPlayer: number,
    killedShips: Array<IShipPositionData>,
    shipsMatrix?: BattlefieldMatrixType
  ) {
    this.ships = ships;
    this.indexPlayer = indexPlayer;
    this.killedShips = killedShips;
    this.shipsMatrix = shipsMatrix;
  }

  updateShipsMatrix(shipsMatrix: BattlefieldMatrixType) {
    this.shipsMatrix = shipsMatrix;
  }

  updateKilledShips(killedShips: Array<IShipPositionData>) {
    this.killedShips = killedShips;
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

  addNewUser(newUser: IActiveGamePlayerData) {
    this.gamePlayersData = [...this.gamePlayersData, newUser];
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

export class Winner implements IWinnerData {
  name: string;
  wins: number;
  constructor(name: string, wins: number) {
    this.name = name;
    this.wins = wins;
  }

  addOneWin() {
    this.wins += 1;
  }
}
