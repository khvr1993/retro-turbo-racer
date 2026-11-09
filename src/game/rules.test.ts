import { describe, expect, it } from 'vitest';
import {
  GRID_COLS,
  GRID_ROWS,
  LANE_COUNT,
  PLAYER_ROW,
  calculateLevelFromPassed,
  checkCollision,
  createInitialState,
  createRunningState,
  getCarCells,
  getLaneStartCol,
  getTickIntervalMs,
  moveLane,
  spawnEnemiesIfClear,
  advanceGameTick,
  calculateTickScore,
  type EnemyCar,
} from './rules';

describe('grid and lanes', () => {
  it('has a 10x20 grid and 3 distinct non-overlapping lanes', () => {
    expect(GRID_COLS).toBe(10);
    expect(GRID_ROWS).toBe(20);
    expect(LANE_COUNT).toBe(3);
    expect(getLaneStartCol(0)).toBe(0);
    expect(getLaneStartCol(1)).toBe(3);
    expect(getLaneStartCol(2)).toBe(6);

    expect(moveLane(0, -1)).toBe(0);
    expect(moveLane(0, 1)).toBe(1);
    expect(moveLane(1, 1)).toBe(2);
    expect(moveLane(2, 1)).toBe(2);
    expect(moveLane(2, -1)).toBe(1);
  });

  it('generates accurate 3x3 car coordinates', () => {
    const crossCells = getCarCells(16, 1, 'cross');
    expect(crossCells).toHaveLength(5);
    expect(crossCells).toContainEqual({ row: 16, col: 4, isCenter: false });
    expect(crossCells).toContainEqual({ row: 17, col: 3, isCenter: false });
    expect(crossCells).toContainEqual({ row: 17, col: 4, isCenter: true });
    expect(crossCells).toContainEqual({ row: 17, col: 5, isCenter: false });
    expect(crossCells).toContainEqual({ row: 18, col: 4, isCenter: false });

    const iShapeCells = getCarCells(16, 0, 'i-shape');
    expect(iShapeCells).toHaveLength(7);
  });
});

describe('collision detection', () => {
  const safeEnemy: EnemyCar = {
    id: 1,
    lane: 0,
    row: PLAYER_ROW,
    shape: 'cross',
    color: 'rose',
    passed: false,
  };

  it('ignores cars in other lanes', () => {
    expect(checkCollision(1, PLAYER_ROW, 'cross', [safeEnemy]).collided).toBe(false);
  });

  it('ignores cars that are vertically clear', () => {
    expect(
      checkCollision(1, PLAYER_ROW, 'cross', [{ ...safeEnemy, lane: 1, row: 12 }]).collided
    ).toBe(false);
  });

  it('detects an overlapping car in the same lane', () => {
    const result = checkCollision(1, PLAYER_ROW, 'cross', [
      { ...safeEnemy, lane: 1, row: 15 },
    ]);
    expect(result.collided).toBe(true);
    expect(result.crashCells.length).toBeGreaterThan(0);
  });
});

describe('speed and scoring', () => {
  it('turbo accelerates the tick interval and awards extra survival points', () => {
    const normalInterval = getTickIntervalMs(1, false);
    const turboInterval = getTickIntervalMs(1, true);
    expect(turboInterval).toBeLessThan(normalInterval);

    const normalScore = calculateTickScore(2, false, 1);
    const turboScore = calculateTickScore(2, true, 1);
    expect(turboScore).toBeGreaterThan(normalScore);
  });

  it('caps the speed level at 10', () => {
    expect(calculateLevelFromPassed(0)).toBe(1);
    expect(calculateLevelFromPassed(6)).toBe(2);
    expect(calculateLevelFromPassed(10_000)).toBe(10);
  });

  it('orders difficulty by speed and spawn clearance', () => {
    const defaultState = createInitialState();
    expect(defaultState.difficulty).toBe('medium');

    const easyMs = getTickIntervalMs(1, false, 'easy');
    const mediumMs = getTickIntervalMs(1, false, 'medium');
    const hardMs = getTickIntervalMs(1, false, 'hard');

    expect(easyMs).toBeGreaterThan(mediumMs);
    expect(hardMs).toBeLessThan(mediumMs);

    const existingAtRow3: EnemyCar[] = [
      { id: 1, lane: 0, row: 3, shape: 'cross', color: 'rose', passed: false },
    ];
    expect(spawnEnemiesIfClear(existingAtRow3, 1, 2, () => 0.2, 'easy').spawned).toHaveLength(0);
    expect(spawnEnemiesIfClear(existingAtRow3, 1, 2, () => 0.2, 'medium').spawned).toHaveLength(0);
    expect(
      spawnEnemiesIfClear(existingAtRow3, 1, 2, () => 0.2, 'hard').spawned.length
    ).toBeGreaterThanOrEqual(1);

    const existingAtRow4: EnemyCar[] = [{ ...existingAtRow3[0]!, row: 4 }];
    expect(spawnEnemiesIfClear(existingAtRow4, 1, 2, () => 0.2, 'easy').spawned).toHaveLength(0);
    expect(
      spawnEnemiesIfClear(existingAtRow4, 1, 2, () => 0.2, 'medium').spawned.length
    ).toBeGreaterThanOrEqual(1);
  });
});

describe('spawning', () => {
  it('never blocks all three lanes simultaneously', () => {
    for (let i = 0; i < 30; i++) {
      const { spawned } = spawnEnemiesIfClear([], 10, 1, () => (i * 0.17) % 1);
      expect(spawned.length).toBeGreaterThanOrEqual(1);
      expect(spawned.length).toBeLessThanOrEqual(2);
      if (spawned.length === 2) {
        expect(spawned[0]!.lane).not.toBe(spawned[1]!.lane);
      }
    }
  });

  it('starts a run in the playing phase with an opening wave', () => {
    const state = createRunningState(120, 'i-shape', 'hard', () => 0.5);
    expect(state.phase).toBe('playing');
    expect(state.highScore).toBe(120);
    expect(state.playerShape).toBe('i-shape');
    expect(state.difficulty).toBe('hard');
    expect(state.enemies.length).toBeGreaterThanOrEqual(1);
    expect(state.enemies.length).toBeLessThanOrEqual(2);
    expect(state.nextEnemyId).toBeGreaterThan(1);
  });
});

describe('advanceGameTick', () => {
  it('cascades enemies downward, scores, and crashes on collision', () => {
    const state = createInitialState(0, 'cross', 'playing');
    state.enemies = [
      {
        id: 1,
        lane: 1,
        row: PLAYER_ROW - 2,
        shape: 'cross',
        color: 'rose',
        passed: false,
      },
    ];

    const step = advanceGameTick(state, () => 0.5);
    expect(step.justCrashed).toBe(true);
    expect(step.nextState.phase).toBe('gameover');
    expect(step.nextState.isTurbo).toBe(false);
    expect(step.nextState.crashCells.length).toBeGreaterThan(0);
  });

  it('scores a safe tick and keeps the game running', () => {
    const state = createInitialState(0, 'cross', 'playing');
    state.enemies = [
      {
        id: 1,
        lane: 0,
        row: 2,
        shape: 'cross',
        color: 'rose',
        passed: false,
      },
    ];

    const step = advanceGameTick(state, () => 0.99);
    expect(step.justCrashed).toBe(false);
    expect(step.nextState.phase).toBe('playing');
    expect(step.nextState.score).toBeGreaterThan(0);
    expect(step.nextState.enemies.find((enemy) => enemy.id === 1)?.row).toBe(3);
  });

  it('drops an enemy once it has fully left the grid', () => {
    const state = createInitialState(0, 'cross', 'playing');
    state.nextEnemyId = 2;
    state.enemies = [
      {
        id: 1,
        lane: 0,
        row: GRID_ROWS - 1,
        shape: 'cross',
        color: 'rose',
        passed: true,
      },
    ];

    const step = advanceGameTick(state, () => 0.99);
    expect(step.nextState.enemies.some((enemy) => enemy.id === 1)).toBe(false);
  });
});
