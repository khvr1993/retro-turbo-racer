export const GRID_COLS = 10;
export const GRID_ROWS = 20;
export const LANE_COUNT = 3;
export const CAR_SIZE = 3;
export const PLAYER_ROW = 16; // Occupies rows 16, 17, 18 (3x3 car at bottom of 20-row grid)
export const TRACK_COL = 9;   // Rightmost column (index 9) acts as scrolling road track marker

export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';
export type CarShape = 'cross' | 'i-shape';
export type EnemyColor = 'rose' | 'amber' | 'cyan';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  label: string;
  speedMultiplier: number; // < 1 means faster (shorter ms interval), > 1 means slower
  minClearanceRows: number; // Minimum empty rows before next spawn wave
  spawnProbability: number; // Chance to spawn on an eligible tick
  doubleSpawnBase: number;  // Base chance for 2-lane wave
  scoreMultiplier: number;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    speedMultiplier: 1.32, // Slower car speeds
    minClearanceRows: 6,   // Wider gap between cars (lower spawn rate)
    spawnProbability: 0.65,
    doubleSpawnBase: 0.05,
    scoreMultiplier: 1,
  },
  medium: {
    label: 'Medium',
    speedMultiplier: 1.0,  // Default balanced speed
    minClearanceRows: 4,   // Standard gap
    spawnProbability: 0.85,
    doubleSpawnBase: 0.18,
    scoreMultiplier: 2,
  },
  hard: {
    label: 'Hard',
    speedMultiplier: 0.72, // Faster car speeds
    minClearanceRows: 3,   // Tighter gap (higher spawn rate)
    spawnProbability: 1.0,
    doubleSpawnBase: 0.42,
    scoreMultiplier: 3,
  },
};

export type CellType =
  | 'empty'
  | 'track-curb'
  | 'player-body'
  | 'player-core'
  | 'player-turbo'
  | 'enemy-rose'
  | 'enemy-amber'
  | 'enemy-cyan'
  | 'crash';

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
}

export interface EnemyCar {
  id: number;
  lane: number; // 0, 1, or 2
  row: number;  // Top row of the 3x3 sprite (can start at -3 and cascade down to 20)
  shape: CarShape;
  color: EnemyColor;
  passed: boolean;
}

export interface GameStateData {
  phase: GamePhase;
  difficulty: Difficulty;
  playerLane: number; // 0, 1, or 2
  playerShape: CarShape;
  enemies: EnemyCar[];
  score: number;
  highScore: number;
  carsPassed: number;
  level: number;
  isTurbo: boolean;
  tickCount: number;
  nextEnemyId: number;
  crashCells: { row: number; col: number }[];
}

export const CAR_PATTERNS: Record<CarShape, readonly (readonly number[])[]> = {
  // Classic '+' cross block car
  cross: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],
  // Classic 'I' axle block car
  'i-shape': [
    [1, 1, 1],
    [0, 1, 0],
    [1, 1, 1],
  ],
};

/**
 * Converts a lane index (0, 1, 2) to the starting column on the 10-column grid.
 * Lane 0 -> cols 0,1,2
 * Lane 1 -> cols 3,4,5
 * Lane 2 -> cols 6,7,8
 * Col 9 is the scrolling track strip.
 */
export function getLaneStartCol(lane: number): number {
  const clamped = Math.max(0, Math.min(LANE_COUNT - 1, Math.floor(lane)));
  return clamped * CAR_SIZE;
}

/**
 * Moves the player lane left (-1) or right (+1) across the 3 distinct vertical lanes.
 */
export function moveLane(currentLane: number, delta: -1 | 1): number {
  return Math.max(0, Math.min(LANE_COUNT - 1, currentLane + delta));
}

/**
 * Returns the occupied grid coordinates for a 3x3 car at (topRow, lane) with the given shape.
 */
export function getCarCells(
  topRow: number,
  lane: number,
  shape: CarShape
): { row: number; col: number; isCenter: boolean }[] {
  const startCol = getLaneStartCol(lane);
  const pattern = CAR_PATTERNS[shape];
  const cells: { row: number; col: number; isCenter: boolean }[] = [];

  for (let r = 0; r < CAR_SIZE; r++) {
    for (let c = 0; c < CAR_SIZE; c++) {
      if (pattern[r][c] === 1) {
        cells.push({
          row: topRow + r,
          col: startCol + c,
          isCenter: r === 1 && c === 1,
        });
      }
    }
  }
  return cells;
}

/**
 * Checks if any enemy car collides with the player car.
 * Returns the colliding enemy and intersecting cells if a collision occurs.
 */
export function checkCollision(
  playerLane: number,
  playerRow: number,
  playerShape: CarShape,
  enemies: EnemyCar[]
): { collided: boolean; enemy: EnemyCar | null; crashCells: { row: number; col: number }[] } {
  const playerCells = getCarCells(playerRow, playerLane, playerShape);

  for (const enemy of enemies) {
    if (enemy.lane !== playerLane) continue;

    // Bounding-box check on rows first
    const enemyBottom = enemy.row + CAR_SIZE - 1;
    const playerBottom = playerRow + CAR_SIZE - 1;
    if (enemyBottom < playerRow || enemy.row > playerBottom) {
      continue;
    }

    // Exact block-level intersection check
    const enemyCells = getCarCells(enemy.row, enemy.lane, enemy.shape);
    const intersecting: { row: number; col: number }[] = [];

    for (const pCell of playerCells) {
      if (enemyCells.some((eCell) => eCell.row === pCell.row && eCell.col === pCell.col)) {
        intersecting.push({ row: pCell.row, col: pCell.col });
      }
    }

    if (intersecting.length > 0) {
      return {
        collided: true,
        enemy,
        crashCells: intersecting,
      };
    }
  }

  return { collided: false, enemy: null, crashCells: [] };
}

/**
 * Calculates the tick interval in milliseconds based on current speed level (1-10),
 * Turbo state, and selected Difficulty ('easy' | 'medium' | 'hard').
 */
export function getTickIntervalMs(
  level: number,
  isTurbo: boolean,
  difficulty: Difficulty = 'medium'
): number {
  const clampedLevel = Math.max(1, Math.min(10, level));
  const diffConfig = DIFFICULTY_SETTINGS[difficulty];
  // Base speed goes from 210ms at level 1 down to 84ms at level 10, scaled by difficulty
  const baseMs = Math.round((210 - (clampedLevel - 1) * 14) * diffConfig.speedMultiplier);
  return isTurbo ? Math.max(32, Math.round(baseMs * 0.45)) : baseMs;
}

/**
 * Calculates the score earned on a survival tick and for passing enemy cars.
 */
export function calculateTickScore(
  level: number,
  isTurbo: boolean,
  newlyPassedCars: number,
  difficulty: Difficulty = 'medium'
): number {
  const mult = DIFFICULTY_SETTINGS[difficulty].scoreMultiplier;
  const survivalPoints = (isTurbo ? 3 : 1) * level * mult;
  const passBonus = newlyPassedCars * (isTurbo ? 50 : 25) * level * mult;
  return survivalPoints + passBonus;
}

/**
 * Calculates the level (1..10) from total cars passed.
 */
export function calculateLevelFromPassed(carsPassed: number): number {
  return Math.min(10, 1 + Math.floor(Math.max(0, carsPassed) / 6));
}

/**
 * Creates a fresh initial game state. Defaults to 'medium' difficulty.
 */
export function createInitialState(
  highScore = 0,
  playerShape: CarShape = 'cross',
  phase: GamePhase = 'title',
  difficulty: Difficulty = 'medium'
): GameStateData {
  return {
    phase,
    difficulty,
    playerLane: 1, // Center lane
    playerShape,
    enemies: [],
    score: 0,
    highScore,
    carsPassed: 0,
    level: 1,
    isTurbo: false,
    tickCount: 0,
    nextEnemyId: 1,
    crashCells: [],
  };
}

const ENEMY_COLORS: EnemyColor[] = ['rose', 'amber', 'cyan'];
const ENEMY_SHAPES: CarShape[] = ['i-shape', 'cross'];

/**
 * Spawns new enemy car(s) at the top of the grid if there is sufficient vertical clearance.
 * Guarantees at least 1 open lane so every wave is 100% passable.
 * Spawn rate and double-car wave density scale with Difficulty ('easy' | 'medium' | 'hard').
 */
export function spawnEnemiesIfClear(
  enemies: EnemyCar[],
  level: number,
  nextId: number,
  rng: () => number = Math.random,
  difficulty: Difficulty = 'medium'
): { spawned: EnemyCar[]; nextId: number } {
  const diffConfig = DIFFICULTY_SETTINGS[difficulty];
  const minClearanceRow =
    level >= 7 ? Math.max(3, diffConfig.minClearanceRows - 1) : diffConfig.minClearanceRows;

  const highestEnemy = enemies.reduce(
    (minRow, e) => Math.min(minRow, e.row),
    Infinity
  );

  if (highestEnemy < minClearanceRow) {
    return { spawned: [], nextId };
  }

  // If there are already enemies on screen, apply difficulty spawn probability
  if (enemies.length > 0 && rng() > diffConfig.spawnProbability) {
    return { spawned: [], nextId };
  }

  const availableLanes = [0, 1, 2];
  // Pick primary lane
  const firstIdx = Math.floor(rng() * availableLanes.length);
  const firstLane = availableLanes.splice(firstIdx, 1)[0];

  const spawned: EnemyCar[] = [
    {
      id: nextId++,
      lane: firstLane,
      row: -CAR_SIZE, // Starts just above row 0 and enters smoothly
      shape: ENEMY_SHAPES[Math.floor(rng() * ENEMY_SHAPES.length)],
      color: ENEMY_COLORS[Math.floor(rng() * ENEMY_COLORS.length)],
      passed: false,
    },
  ];

  // Double-lane wave chance scales by difficulty and level (never 3, so 1 lane is ALWAYS open!)
  const doubleSpawnChance = Math.min(
    0.65,
    diffConfig.doubleSpawnBase + (level - 1) * 0.04
  );
  const allowDoubleAtLevel = difficulty === 'hard' ? 1 : 2;
  if (level >= allowDoubleAtLevel && rng() < doubleSpawnChance) {
    const hasNearbyCar = enemies.some((e) => e.row < 5);
    if (!hasNearbyCar) {
      const secondIdx = Math.floor(rng() * availableLanes.length);
      const secondLane = availableLanes[secondIdx];
      spawned.push({
        id: nextId++,
        lane: secondLane,
        row: -CAR_SIZE,
        shape: ENEMY_SHAPES[Math.floor(rng() * ENEMY_SHAPES.length)],
        color: ENEMY_COLORS[(Math.floor(rng() * ENEMY_COLORS.length) + 1) % ENEMY_COLORS.length],
        passed: false,
      });
    }
  }

  return { spawned, nextId };
}

/**
 * Advances the game state by one vertical scroll tick.
 */
export function advanceGameTick(
  state: GameStateData,
  rng: () => number = Math.random
): {
  nextState: GameStateData;
  justCrashed: boolean;
  newlyPassedCount: number;
  spawnedCount: number;
  leveledUp: boolean;
} {
  if (state.phase !== 'playing') {
    return {
      nextState: state,
      justCrashed: false,
      newlyPassedCount: 0,
      spawnedCount: 0,
      leveledUp: false,
    };
  }

  const nextTick = state.tickCount + 1;

  // Move all existing enemies down by 1 row
  let newlyPassedCount = 0;
  const movedEnemies: EnemyCar[] = [];

  for (const enemy of state.enemies) {
    const nextRow = enemy.row + 1;
    // Check if the enemy car has just completely passed the player's nose
    const nowPassed = enemy.passed || nextRow > PLAYER_ROW + CAR_SIZE - 1;
    if (nowPassed && !enemy.passed) {
      newlyPassedCount++;
    }
    // Keep enemy while any part of its 3x3 grid is still on screen (row <= 19)
    if (nextRow <= GRID_ROWS) {
      movedEnemies.push({
        ...enemy,
        row: nextRow,
        passed: nowPassed,
      });
    }
  }

  // Check collision after moving enemies downward
  const collision = checkCollision(
    state.playerLane,
    PLAYER_ROW,
    state.playerShape,
    movedEnemies
  );

  if (collision.collided) {
    const finalHighScore = Math.max(state.highScore, state.score);
    return {
      nextState: {
        ...state,
        phase: 'gameover',
        enemies: movedEnemies,
        highScore: finalHighScore,
        isTurbo: false,
        tickCount: nextTick,
        crashCells: collision.crashCells,
      },
      justCrashed: true,
      newlyPassedCount: 0,
      spawnedCount: 0,
      leveledUp: false,
    };
  }

  // Update score, passed count, and speed level
  const nextCarsPassed = state.carsPassed + newlyPassedCount;
  const nextLevel = calculateLevelFromPassed(nextCarsPassed);
  const leveledUp = nextLevel > state.level;
  const scoreDelta = calculateTickScore(
    state.level,
    state.isTurbo,
    newlyPassedCount,
    state.difficulty
  );
  const nextScore = state.score + scoreDelta;
  const nextHighScore = Math.max(state.highScore, nextScore);

  // Spawn new wave if clear
  const { spawned, nextId } = spawnEnemiesIfClear(
    movedEnemies,
    nextLevel,
    state.nextEnemyId,
    rng,
    state.difficulty
  );

  return {
    nextState: {
      ...state,
      enemies: [...movedEnemies, ...spawned],
      score: nextScore,
      highScore: nextHighScore,
      carsPassed: nextCarsPassed,
      level: nextLevel,
      tickCount: nextTick,
      nextEnemyId: nextId,
    },
    justCrashed: false,
    newlyPassedCount,
    spawnedCount: spawned.length,
    leveledUp,
  };
}

/**
 * Builds the complete 10x20 grid matrix for rendering the handheld screen.
 */
export function buildGridMatrix(state: GameStateData): GridCell[][] {
  const matrix: GridCell[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const rowCells: GridCell[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      let type: CellType = 'empty';
      // Column 9 is the scrolling track strip (2 lit blocks, 2 unlit blocks scrolling down)
      if (c === TRACK_COL) {
        const scrollOffset = ((r - state.tickCount) % 4 + 4) % 4;
        if (scrollOffset < 2) {
          type = 'track-curb';
        }
      }
      rowCells.push({ row: r, col: c, type });
    }
    matrix.push(rowCells);
  }

  // Paint enemy cars
  for (const enemy of state.enemies) {
    const cells = getCarCells(enemy.row, enemy.lane, enemy.shape);
    const cellType: CellType =
      enemy.color === 'rose'
        ? 'enemy-rose'
        : enemy.color === 'amber'
          ? 'enemy-amber'
          : 'enemy-cyan';

    for (const cell of cells) {
      if (
        cell.row >= 0 &&
        cell.row < GRID_ROWS &&
        cell.col >= 0 &&
        cell.col < GRID_COLS
      ) {
        matrix[cell.row][cell.col].type = cellType;
      }
    }
  }

  // Paint player 3x3 car at bottom
  const playerCells = getCarCells(PLAYER_ROW, state.playerLane, state.playerShape);
  for (const cell of playerCells) {
    if (
      cell.row >= 0 &&
      cell.row < GRID_ROWS &&
      cell.col >= 0 &&
      cell.col < GRID_COLS
    ) {
      if (cell.isCenter) {
        matrix[cell.row][cell.col].type = 'player-core';
      } else if (state.isTurbo) {
        matrix[cell.row][cell.col].type = 'player-turbo';
      } else {
        matrix[cell.row][cell.col].type = 'player-body';
      }
    }
  }

  // Paint crash impact cells on top if in gameover state
  if (state.phase === 'gameover') {
    for (const crash of state.crashCells) {
      if (
        crash.row >= 0 &&
        crash.row < GRID_ROWS &&
        crash.col >= 0 &&
        crash.col < GRID_COLS
      ) {
        matrix[crash.row][crash.col].type = 'crash';
      }
    }
  }

  return matrix;
}
