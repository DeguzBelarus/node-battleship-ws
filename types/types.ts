import WebSocket from 'ws';

export enum RequestMethodsEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export type Undefinable<T> = T | undefined;
export type Nullable<T> = T | null;
export type WebsocketMessageType =
  | 'reg'
  | 'update_winners'
  | 'create_room'
  | 'add_user_to_room'
  | 'create_game'
  | 'update_room'
  | 'add_ships'
  | 'start_game'
  | 'attack'
  | 'randomAttack'
  | 'turn'
  | 'finish';
export type ShipType = 'small' | 'medium' | 'large' | 'huge';
export type SellType = 'free' | 'uh' | 'ul' | 'um' | 'us' | 'dh' | 'dl' | 'dm' | 'ds';
export type BattlefieldMatrixType = Array<Array<SellType>>;
export type AttackResultType = 'miss' | 'killed' | 'shot';

export interface IUserData {
  name: string;
  index: number;
  password?: string;
  ws?: WebSocket;
}

export interface IUsersRoom {
  roomId: number;
  roomUsers: Array<IUserData>;
}

export interface IGameData {
  idGame: number;
  idPlayer: number;
}

export interface IWebsocketMessage {
  type: WebsocketMessageType;
  id: number;
  data: unknown;
}

export interface IRegistrationRequestData {
  name: string;
  password: string;
}

interface IRegistrationResponseData {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface IRegistrationResponse {
  type: WebsocketMessageType;
  id: number;
  data: IRegistrationResponseData | string;
}

export interface ICreateRoomResponse {
  type: WebsocketMessageType;
  id: number;
  data: Array<IUsersRoom> | string;
}

export interface IAddUserToRoomRequestData {
  indexRoom: number;
}

export interface IAddUserToRoomRequest {
  type: WebsocketMessageType;
  id: number;
  data: IAddUserToRoomRequestData | string;
}

interface IShipPositionData {
  x: number;
  y: number;
}

export interface IShipData {
  position: IShipPositionData;
  direction: boolean;
  length: number;
  type: ShipType;
}

export interface IAddUserShipsRequestData {
  gameId: number;
  ships: Array<IShipData>;
  indexPlayer: number;
}

export interface IAddUserShipsRequest {
  type: WebsocketMessageType;
  id: number;
  data: IAddUserShipsRequestData | string;
}

export interface IAttackRequestData {
  x: number;
  y: number;
  gameId: number;
  indexPlayer: number;
}

export interface IAttackRequest {
  type: WebsocketMessageType;
  id: number;
  data: IAttackRequestData | string;
}

export interface IStartGameResponseData {
  ships: Array<IShipData>;
  currentPlayerIndex: number;
}

export interface IStartGameResponse {
  type: WebsocketMessageType;
  id: number;
  data: IStartGameResponseData | string;
}

export interface ITurnResponseData {
  currentPlayer: number;
}

export interface ITurnResponse {
  type: WebsocketMessageType;
  id: number;
  data: ITurnResponseData | string;
}

export interface IActiveGamePlayerData {
  ships: Array<IShipData>;
  indexPlayer: number;
  shipsMatrix?: BattlefieldMatrixType;
}

export interface IActiveGame {
  gameId: number;
  gamePlayersData: Array<IActiveGamePlayerData>;
}
