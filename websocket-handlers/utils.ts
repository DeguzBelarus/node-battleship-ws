import { BATTLEFIELD_MATRIX_SIZE } from '../constants/constants';
import { BattlefieldMatrixType, IShipData, SellType } from '../types/types';

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
