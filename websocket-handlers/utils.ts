import {
  BATTLEFIELD_MATRIX_SIZE,
  HUGE_SHIP_LENGTH,
  LARGE_SHIP_LENGTH,
  MEDIUM_SHIP_LENGTH,
} from '../constants/constants';
import { SellCoordinate } from '../schemas/schemas';
import {
  BattlefieldMatrixType,
  IAtackResult,
  IShipData,
  SellType,
  IShipPositionData,
  Nullable,
  iShipKillAttackResult,
} from '../types/types';

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

const isInMatrix = (x: number, y: number): boolean => {
  switch (true) {
    case x < 0:
      return false;
    case x > BATTLEFIELD_MATRIX_SIZE - 1:
      return false;
    case y < 0:
      return false;
    case y > BATTLEFIELD_MATRIX_SIZE - 1:
      return false;
    default:
      return true;
  }
};

export const lastShotHandler = (
  shipsMatrix: BattlefieldMatrixType,
  playerKilledShips: Array<IShipPositionData>,
  lastShotX: number,
  lastShotY: number
): Nullable<iShipKillAttackResult> => {
  try {
    const lastAttackedSell: SellType = shipsMatrix[lastShotY][lastShotX];
    const killedShipSells: Array<IShipPositionData> = [];
    let aroundShotsCoords: Array<IShipPositionData> = [];

    shipsMatrix.forEach((sellsRow, indexY) => {
      sellsRow.forEach((sell, indexX) => {
        if (sell === lastAttackedSell) {
          const killedSellCandidate = new SellCoordinate(indexX, indexY);
          const alreadyAdded = playerKilledShips.find(
            (killedShipCoordinate) =>
              JSON.stringify(killedShipCoordinate) === JSON.stringify(killedSellCandidate)
          );
          !alreadyAdded && killedShipSells.push(killedSellCandidate);
        }
      });
    });

    killedShipSells.forEach((sellCoordinate) => {
      switch (true) {
        case shipsMatrix?.[sellCoordinate.y]?.[sellCoordinate.x - 1] === 'free':
          isInMatrix(sellCoordinate.x - 1, sellCoordinate.y) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x - 1, sellCoordinate.y));
        case shipsMatrix?.[sellCoordinate.y]?.[sellCoordinate.x + 1] === 'free':
          isInMatrix(sellCoordinate.x + 1, sellCoordinate.y) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x + 1, sellCoordinate.y));
        case shipsMatrix?.[sellCoordinate.y - 1]?.[sellCoordinate.x] === 'free':
          isInMatrix(sellCoordinate.x, sellCoordinate.y - 1) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x, sellCoordinate.y - 1));
        case shipsMatrix?.[sellCoordinate.y + 1]?.[sellCoordinate.x] === 'free':
          isInMatrix(sellCoordinate.x, sellCoordinate.y + 1) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x, sellCoordinate.y + 1));
        case shipsMatrix?.[sellCoordinate.y - 1]?.[sellCoordinate.x - 1] === 'free':
          isInMatrix(sellCoordinate.x - 1, sellCoordinate.y - 1) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x - 1, sellCoordinate.y - 1));
        case shipsMatrix?.[sellCoordinate.y + 1]?.[sellCoordinate.x - 1] === 'free':
          isInMatrix(sellCoordinate.x - 1, sellCoordinate.y + 1) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x - 1, sellCoordinate.y + 1));
        case shipsMatrix?.[sellCoordinate.y - 1]?.[sellCoordinate.x + 1] === 'free':
          isInMatrix(sellCoordinate.x + 1, sellCoordinate.y - 1) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x + 1, sellCoordinate.y - 1));
        case shipsMatrix?.[sellCoordinate.y + 1]?.[sellCoordinate.x + 1] === 'free':
          isInMatrix(sellCoordinate.x + 1, sellCoordinate.y + 1) &&
            aroundShotsCoords.push(new SellCoordinate(sellCoordinate.x + 1, sellCoordinate.y + 1));
      }

      aroundShotsCoords = aroundShotsCoords
        .reduce((unique: Array<string>, coord) => {
          if (!unique.includes(JSON.stringify(coord))) {
            unique = [...unique, JSON.stringify(coord)];
          }
          return unique;
        }, [])
        .filter(
          (coordJSON) => !killedShipSells.map((sell) => JSON.stringify(sell)).includes(coordJSON)
        )
        .map((coordJSON) => JSON.parse(coordJSON));
    });
    return { aroundShotsCoords, killedShipSells };
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
    return null;
  }
};
