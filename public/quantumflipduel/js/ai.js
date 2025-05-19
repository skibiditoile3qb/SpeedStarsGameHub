// ai.js - Handles AI move logic

import { SIZE, board, spellEffects, recentPlayerMoves, blockRecentMove, movesLeft, setGameStateVar } from './game-state.js';
import { isBoardFull, hasAdjacentTile, animateFlip } from './board.js';
import { updateUI } from './ui.js';
import { endGame } from './main.js';
import { executeMove } from './player.js';

function aiMove() {
  if (isBoardFull() || movesLeft <= 0) {
    endGame();
    return;
  }
  // If paralyzed, skip turn
  if (spellEffects.paralyzeAI > 0) {
    spellEffects.paralyzeAI--;
    setGameStateVar('playerTurn', true);
    updateUI();
    return;
  }

  // Build list of valid moves (prioritize flipping, then empty, avoid blocked)
  let candidates = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (
        (board[i][j] === 1 && hasAdjacentTile(i, j, 2)) || // Can flip player tile
        board[i][j] === 0                                 // Or empty
      ) {
        // Block recently played spaces (if enabled)
        if (
          blockRecentMove &&
          recentPlayerMoves.some(({ row, col }) => row === i && col === j)
        ) {
          continue;
        }
        candidates.push({ i, j });
      }
    }
  }

  // If none found, fallback to any empty or flip
  if (candidates.length === 0) {
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE; j++) {
        if (board[i][j] === 0 || (board[i][j] === 1 && hasAdjacentTile(i, j, 2))) {
          candidates.push({ i, j });
        }
      }
    }
  }

  // Pick a move based on difficulty
  let move;
  if (candidates.length > 0) {
    move = candidates[Math.floor(Math.random() * candidates.length)];
    executeMove(move.i, move.j, false); // AI is player 2
    setGameStateVar('playerTurn', true);
    updateUI();
  } else {
    // No move possible
    setGameStateVar('playerTurn', true);
    updateUI();
  }
}

export { aiMove };
