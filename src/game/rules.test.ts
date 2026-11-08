import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_COLS,
  GRID_ROWS,
  PLAYER_ROW,
  moveLane,
  getLaneStartCol,
  getCarCells,
  checkCollision,
  getTickIntervalMs,
  calculateTickScore,
  createInitialState,
  advanceGameTick,
  spawnEnemiesIfClear,
  buildGridMatrix,
} from './rules';

test('10x20 grid dimensions and 3 distinct non-overlapping lanes', () => {
  assert.equal(GRID_COLS, 10);
  assert.equal(GRID_ROWS, 20);
  assert.equal(getLaneStartCol(0), 0);
  assert.equal(getLaneStartCol(1), 3);
  assert.equal(getLaneStartCol(2), 6);

  // Clamping lane movement across 3 lanes (0, 1, 2)
  assert.equal(moveLane(0, -1), 0);
  assert.equal(moveLane(0, 1), 1);
  assert.equal(moveLane(1, 1), 2);
  assert.equal(moveLane(2, 1), 2);
  assert.equal(moveLane(2, -1), 1);
});

test('3x3 car shapes generate accurate grid coordinates', () => {
  const crossCells = getCarCells(16, 1, 'cross');
  // Cross (+) has 5 occupied blocks
  assert.equal(crossCells.length, 5);
  assert.ok(crossCells.some((c) => c.row === 16 && c.col === 4)); // Top nose
  assert.ok(crossCells.some((c) => c.row === 17 && c.col === 3)); // Left wing
  assert.ok(crossCells.some((c) => c.row === 17 && c.col === 4 && c.isCenter)); // Center cockpit
  assert.ok(crossCells.some((c) => c.row === 17 && c.col === 5)); // Right wing
  assert.ok(crossCells.some((c) => c.row === 18 && c.col === 4)); // Bottom tail

  const iShapeCells = getCarCells(16, 0, 'i-shape');
  // I-shape has 7 occupied blocks (3 top, 1 middle, 3 bottom)
  assert.equal(iShapeCells.length, 7);
});

test('collision detection triggers only when lane and vertical span intersect', () => {
  const safeEnemy = {
    id: 1,
    lane: 0,
    row: PLAYER_ROW,
    shape: 'cross' as const,
    color: 'rose' as const,
    passed: false,
  };
  // Player is in lane 1, enemy is in lane 0 -> no collision
  const resSafeLane = checkCollision(1, PLAYER_ROW, 'cross', [safeEnemy]);
  assert.equal(resSafeLane.collided, false);

  // Enemy in same lane (1) but above player at row 12 (occupies 12,13,14 vs player 16,17,18) -> no collision
  const resSafeRow = checkCollision(1, PLAYER_ROW, 'cross', [
    { ...safeEnemy, lane: 1, row: 12 },
  ]);
  assert.equal(resSafeRow.collided, false);

  // Enemy in same lane (1) overlapping player at row 15 (occupies 15,16,17 vs player 16,17,18) -> collision!
  const resCrash = checkCollision(1, PLAYER_ROW, 'cross', [
    { ...safeEnemy, lane: 1, row: 15 },
  ]);
  assert.equal(resCrash.collided, true);
  assert.ok(resCrash.crashCells.length > 0);
});

test('turbo accelerates tick interval and awards extra survival points', () => {
  const normalInterval = getTickIntervalMs(1, false);
  const turboInterval = getTickIntervalMs(1, true);
  assert.ok(turboInterval < normalInterval);

  const normalScore = calculateTickScore(2, false, 1);
  const turboScore = calculateTickScore(2, true, 1);
  assert.ok(turboScore > normalScore);
});

test('spawning never blocks all 3 lanes simultaneously', () => {
  for (let i = 0; i < 30; i++) {
    const { spawned } = spawnEnemiesIfClear([], 10, 1, () => (i * 0.17) % 1);
    assert.ok(spawned.length >= 1 && spawned.length <= 2);
    if (spawned.length === 2) {
      assert.notEqual(spawned[0].lane, spawned[1].lane);
    }
  }
});

test('advanceGameTick increments score, cascades enemies downward, and triggers gameover on collision', () => {
  let state = createInitialState(0, 'cross', 'playing');
  state.enemies = [
    {
      id: 1,
      lane: 1, // Same lane as player
      row: PLAYER_ROW - 2, // At row 14 (occupies 14,15,16 -> already touching row 16 after 0 or 1 tick)
      shape: 'cross',
      color: 'rose',
      passed: false,
    },
  ];

  const step = advanceGameTick(state, () => 0.5);
  assert.equal(step.justCrashed, true);
  assert.equal(step.nextState.phase, 'gameover');

  const matrix = buildGridMatrix(step.nextState);
  assert.equal(matrix.length, 20);
  assert.equal(matrix[0].length, 10);
});

test('difficulty levels: Medium is default, Easy has slower speed & lower spawn rate, Hard has faster speed & higher spawn rate', () => {
  const defaultState = createInitialState();
  assert.equal(defaultState.difficulty, 'medium');

  const easyMs = getTickIntervalMs(1, false, 'easy');
  const mediumMs = getTickIntervalMs(1, false, 'medium');
  const hardMs = getTickIntervalMs(1, false, 'hard');

  // Easy has slower car speeds (larger interval ms) than Medium, and Hard is faster (smaller interval ms)
  assert.ok(easyMs > mediumMs, `Expected easyMs (${easyMs}) > mediumMs (${mediumMs})`);
  assert.ok(hardMs < mediumMs, `Expected hardMs (${hardMs}) < mediumMs (${mediumMs})`);

  // Spawn clearance: with an existing enemy at row 3, Easy & Medium wait, while Hard already spawns!
  const existingAtRow3 = [
    {
      id: 1,
      lane: 0,
      row: 3,
      shape: 'cross' as const,
      color: 'rose' as const,
      passed: false,
    },
  ];
  const easySpawn = spawnEnemiesIfClear(existingAtRow3, 1, 2, () => 0.2, 'easy');
  const mediumSpawn = spawnEnemiesIfClear(existingAtRow3, 1, 2, () => 0.2, 'medium');
  const hardSpawn = spawnEnemiesIfClear(existingAtRow3, 1, 2, () => 0.2, 'hard');

  assert.equal(easySpawn.spawned.length, 0);
  assert.equal(mediumSpawn.spawned.length, 0);
  assert.ok(hardSpawn.spawned.length >= 1);

  // At row 4, Medium spawns while Easy still waits until row 6
  const existingAtRow4 = [{ ...existingAtRow3[0], row: 4 }];
  const easySpawnAt4 = spawnEnemiesIfClear(existingAtRow4, 1, 2, () => 0.2, 'easy');
  const mediumSpawnAt4 = spawnEnemiesIfClear(existingAtRow4, 1, 2, () => 0.2, 'medium');
  assert.equal(easySpawnAt4.spawned.length, 0);
  assert.ok(mediumSpawnAt4.spawned.length >= 1);
});

