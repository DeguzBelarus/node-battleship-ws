import {
  BATTLEFIELD_MATRIX_SIZE,
  HUGE_SHIP_LENGTH,
  LARGE_SHIP_LENGTH,
  MEDIUM_SHIP_LENGTH,
} from '../constants/constants';
import { BattlefieldMatrixType, IAtackResult, IShipData, SellType } from '../types/types';

const freeSell: SellType = 'free';
const isVertical = (direction: boolean) => direction;

export const battlefieldMatrixGenerator = (ships: Array<IShipData>): BattlefieldMatrixType => {
  const matrix: BattlefieldMatrixType = [];

  for (let i = 0; i < BATTLEFIELD_MATRIX_SIZE; i++) {
    matrix.push(new Array(BATTLEFIELD_MATRIX_SIZE).fill(freeSell));
  }

  ships.forEach((ship) => {
    switch (ship.type) {
      case 'huge':
        matrix[ship.position.y][ship.position.x] = 'uh';
        break;
      case 'large':
        matrix[ship.position.y][ship.position.x] = 'ul';
        break;
      case 'medium':
        matrix[ship.position.y][ship.position.x] = 'um';
        break;
      case 'small':
        matrix[ship.position.y][ship.position.x] = 'us';
    }
    if (isVertical(ship.direction)) {
      switch (ship.type) {
        case 'huge':
          matrix[ship.position.y + 1][ship.position.x] = 'uh';
          matrix[ship.position.y + 2][ship.position.x] = 'uh';
          matrix[ship.position.y + 3][ship.position.x] = 'uh';
          break;
        case 'large':
          matrix[ship.position.y + 1][ship.position.x] = 'ul';
          matrix[ship.position.y + 2][ship.position.x] = 'ul';
          break;
        case 'medium':
          matrix[ship.position.y + 1][ship.position.x] = 'um';
          break;
      }
    } else {
      switch (ship.type) {
        case 'huge':
          matrix[ship.position.y][ship.position.x + 1] = 'uh';
          matrix[ship.position.y][ship.position.x + 2] = 'uh';
          matrix[ship.position.y][ship.position.x + 3] = 'uh';
          break;
        case 'large':
          matrix[ship.position.y][ship.position.x + 1] = 'ul';
          matrix[ship.position.y][ship.position.x + 2] = 'ul';
          break;
        case 'medium':
          matrix[ship.position.y][ship.position.x + 1] = 'um';
          break;
      }
    }
  });
  return matrix;
};

export const attackHandler = (
  shipsMatrix: BattlefieldMatrixType,
  x: number,
  y: number
): IAtackResult => {
  const attackedSell: SellType = shipsMatrix[y][x];
  if (attackedSell.startsWith('f')) {
    return { attackedSell, updatedMatrix: null, isKilled: false };
  } else {
    switch (attackedSell) {
      case 'uh':
        shipsMatrix[y][x] = 'dh';
        const isKilledHuge =
          shipsMatrix.flat().filter((sell) => sell === 'dh').length === HUGE_SHIP_LENGTH;
        return { attackedSell, updatedMatrix: shipsMatrix, isKilled: isKilledHuge };
      case 'ul':
        shipsMatrix[y][x] = 'dl';
        const isKilledLarge =
          shipsMatrix.flat().filter((sell) => sell === 'dl').length % LARGE_SHIP_LENGTH
            ? false
            : true;
        return { attackedSell, updatedMatrix: shipsMatrix, isKilled: isKilledLarge };
      case 'um':
        shipsMatrix[y][x] = 'dm';
        const isKilledMedium =
          shipsMatrix.flat().filter((sell) => sell === 'dm').length % MEDIUM_SHIP_LENGTH
            ? false
            : true;
        return { attackedSell, updatedMatrix: shipsMatrix, isKilled: isKilledMedium };
      case 'us':
        shipsMatrix[y][x] = 'ds';
        return { attackedSell, updatedMatrix: shipsMatrix, isKilled: true };
      default:
        return { attackedSell, updatedMatrix: null, isKilled: false };
    }
  }
};
