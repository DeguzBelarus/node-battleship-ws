import {
  BATTLEFIELD_MATRIX_SIZE,
  HUGE_SHIP_LENGTH,
  LARGE_SHIPS_COUNT,
  LARGE_SHIP_LENGTH,
  MEDIUM_SHIPS_COUNT,
  MEDIUM_SHIP_LENGTH,
  SMALL_SHIPS_COUNT,
  SMALL_SHIP_LENGTH,
} from '../constants/constants';
import { SellCoordinate, Ship } from '../schemas/schemas';
import {
  BattlefieldMatrixType,
  IAtackResult,
  IShipData,
  SellType,
  IShipPositionData,
  Nullable,
  iShipKillAttackResult,
  ShipType,
} from '../types/types';

const freeSell: SellType = 'free';
const isVertical = (direction: boolean) => direction;

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

const shipLengthDeterminer = (shipType: ShipType): number => {
  switch (shipType) {
    case 'huge':
      return HUGE_SHIP_LENGTH;
    case 'large':
      return LARGE_SHIP_LENGTH;
    case 'medium':
      return MEDIUM_SHIP_LENGTH;
    default:
      return SMALL_SHIP_LENGTH;
  }
};

const isAroundSellsFree = (shipsMatrix: BattlefieldMatrixType, x: number, y: number): boolean => {
  switch (true) {
    case shipsMatrix?.[y]?.[x - 1] && shipsMatrix?.[y]?.[x - 1] !== 'free':
      return false;
    case shipsMatrix?.[y]?.[x + 1] && shipsMatrix?.[y]?.[x + 1] !== 'free':
      return false;
    case shipsMatrix?.[y - 1]?.[x] && shipsMatrix?.[y - 1]?.[x] !== 'free':
      return false;
    case shipsMatrix?.[y + 1]?.[x] && shipsMatrix?.[y + 1]?.[x] !== 'free':
      return false;
    case shipsMatrix?.[y - 1]?.[x - 1] && shipsMatrix?.[y - 1]?.[x - 1] !== 'free':
      return false;
    case shipsMatrix?.[y + 1]?.[x - 1] && shipsMatrix?.[y + 1]?.[x - 1] !== 'free':
      return false;
    case shipsMatrix?.[y - 1]?.[x + 1] && shipsMatrix?.[y - 1]?.[x + 1] !== 'free':
      return false;
    case shipsMatrix?.[y + 1]?.[x + 1] && shipsMatrix?.[y + 1]?.[x + 1] !== 'free':
      return false;
  }
  return true;
};

const canShipBePlaced = (ship: IShipData, shipsMatrix: BattlefieldMatrixType): boolean => {
  if (ship.direction) {
    for (let i = 0; i < ship.length; i++) {
      if (shipsMatrix?.[ship.position.y + i]?.[ship.position.x] !== 'free') return false;
      if (!isAroundSellsFree(shipsMatrix, ship.position.x, ship.position.y + i)) return false;
    }
  } else {
    for (let i = 0; i < ship.length; i++) {
      if (shipsMatrix?.[ship.position.y]?.[ship.position.x + i] !== 'free') return false;
      if (!isAroundSellsFree(shipsMatrix, ship.position.x + i, ship.position.y)) return false;
    }
  }

  return true;
};

const randomFreeSellGenerator = (shipsMatrix: BattlefieldMatrixType): IShipPositionData => {
  let randomX = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
  let randomY = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));

  while (shipsMatrix?.[randomY]?.[randomX] && !shipsMatrix[randomY][randomX].startsWith('f')) {
    randomX = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
    randomY = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
  }
  return { x: randomX, y: randomY };
};

const randomShipStartPositionGenerator = (
  shipsMatrix: BattlefieldMatrixType,
  shipType: ShipType,
  shipLength: number,
  isVertical: boolean
): IShipPositionData => {
  let randomX = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
  let randomY = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));

  while (
    !canShipBePlaced(
      {
        direction: isVertical,
        length: shipLength,
        type: shipType,
        position: { x: randomX, y: randomY },
      },
      shipsMatrix
    )
  ) {
    const newFreSellCoords = randomFreeSellGenerator(shipsMatrix);
    randomX = newFreSellCoords.x;
    randomY = newFreSellCoords.y;
  }

  return { x: randomX, y: randomY };
};

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
): Nullable<IAtackResult> => {
  const attackedSell: SellType = shipsMatrix?.[y]?.[x];
  if (attackedSell && attackedSell.startsWith('d')) return null;

  if (attackedSell && attackedSell.startsWith('f')) {
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

export const randomAttackGenerator = (shipsMatrix: BattlefieldMatrixType): IShipPositionData => {
  let randomX = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
  let randomY = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));

  while (shipsMatrix?.[randomY]?.[randomX] && shipsMatrix?.[randomY]?.[randomX].startsWith('d')) {
    randomX = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
    randomY = Math.round(Math.random() * (BATTLEFIELD_MATRIX_SIZE - 1));
  }
  return { x: randomX, y: randomY };
};

export const botShipsGenerator = (): Array<IShipData> => {
  const botShips: Array<IShipData> = [];

  const shipType: ShipType = 'huge';
  const length = shipLengthDeterminer(shipType);
  const isVertical = Math.round(Math.random() * 1) ? true : false;
  const shipPosition = randomShipStartPositionGenerator(
    battlefieldMatrixGenerator(botShips),
    shipType,
    length,
    isVertical
  );
  botShips.push(new Ship(shipPosition, isVertical, length, shipType));

  for (let i = 0; i < LARGE_SHIPS_COUNT; i++) {
    const shipType: ShipType = 'large';
    const length = shipLengthDeterminer(shipType);
    const isVertical = Math.round(Math.random() * 1) ? true : false;
    const shipPosition = randomShipStartPositionGenerator(
      battlefieldMatrixGenerator(botShips),
      shipType,
      length,
      isVertical
    );
    botShips.push(new Ship(shipPosition, isVertical, length, shipType));
  }

  for (let i = 0; i < MEDIUM_SHIPS_COUNT; i++) {
    const shipType: ShipType = 'medium';
    const length = shipLengthDeterminer(shipType);
    const isVertical = Math.round(Math.random() * 1) ? true : false;
    const shipPosition = randomShipStartPositionGenerator(
      battlefieldMatrixGenerator(botShips),
      shipType,
      length,
      isVertical
    );
    botShips.push(new Ship(shipPosition, isVertical, length, shipType));
  }

  for (let i = 0; i < SMALL_SHIPS_COUNT; i++) {
    const shipType: ShipType = 'small';
    const length = shipLengthDeterminer(shipType);
    const isVertical = Math.round(Math.random() * 1) ? true : false;
    const shipPosition = randomShipStartPositionGenerator(
      battlefieldMatrixGenerator(botShips),
      shipType,
      length,
      isVertical
    );
    botShips.push(new Ship(shipPosition, isVertical, length, shipType));
  }

  return botShips;
};
