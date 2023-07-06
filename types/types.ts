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
