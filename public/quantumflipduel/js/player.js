// player.js - Handles player move logic

import { 
  playerTurn, movesLeft, spellEffects, mana, maxMana, randomEvents, 
  lastMove, recentPlayerMoves, setGameStateVar 
} from './game-state.js';
import { board } from './game-state.js';
import { hasAdjacentTile, animateFlip, isBoardFull } from './board.js';
import { updateUI } from './ui.js';
import { aiMove } from './ai.js';
import { endGame } from './main.js';
import { showEventMessage } from './ui.js';
import { triggerRandomEvent } from './events.js';

function makeMove(row, col) {
  if (!playerTurn || movesLeft <= 0) return;
  
  // Check if move is valid
  if (!isValidMove(row, col)) return;
  
  // Execute the move
  executeMove(row, col, true);
  
  // Update last move
  setGameStateVar('lastMove', { row, col });
  recentPlayerMoves.unshift({ row, col });
  if (recentPlayerMoves.length > 3) recentPlayerMoves.pop();
  
  // Check for random events
  if (randomEvents && Math.random() < 0.08) {
    triggerRandomEvent();
  }
  
  // Check for game end
  if (movesLeft <= 0 || isBoardFull()) {
    endGame();
    return;
  }
  
  // Switch turns
  setGameStateVar('playerTurn', false);
  updateUI();
  
  // Check if AI is paralyzed
  if (spellEffects.paralyzeAI > 0) {
    spellEffects.paralyzeAI--;
    setGameStateVar('playerTurn', true);
    updateUI();
  } else {
    // AI's turn
    setTimeout(aiMove, 600);
  }
}

function isValidMove(row, col) {
  // Check if cell is empty or can be flipped
  if (board[row][col] === 0) {
    return true; // Can place on empty cell
  } else if (board[row][col] === 2) {
    // Check if there's an adjacent player's tile
    return hasAdjacentTile(row, col, 1);
  }
  return false;
}

function executeMove(row, col, isPlayer) {
  const tileValue = isPlayer ? 1 : 2;
  const opponentValue = isPlayer ? 2 : 1;

  // Check if the tile is frozen
  const isFrozen = spellEffects.frozenTiles.some(tile =>
    tile.row === row && tile.col === col && tile.duration > 0
  );
  if (isFrozen) return false;

  if (board[row][col] === 0) {
    board[row][col] = tileValue;
    animateFlip(row, col);
  } else if (board[row][col] === opponentValue) {
    board[row][col] = tileValue;
    animateFlip(row, col);

    if (isPlayer && spellEffects.fireBurst) {
      flipAdjacentTiles(row, col);
      spellEffects.fireBurst = false;
    }
  }
  
  setGameStateVar('movesLeft', movesLeft - 1);
  
  if (isPlayer) {
    setGameStateVar('mana', Math.min(maxMana, mana + 8));
  }
  
  return true;
}

function flipAdjacentTiles(row, col) {
  // Import SIZE from game-state
  import('./game-state.js').then(({ SIZE }) => {
    for (let i = Math.max(0, row-1); i <= Math.min(SIZE-1, row+1); i++) {
      for (let j = Math.max(0, col-1); j <= Math.min(SIZE-1, col+1); j++) {
        if (board[i][j] === 2) { // If it's an AI tile
          board[i][j] = 1; // Flip to player
          animateFlip(i, j);
          
          // Add fire effect
          const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
          if (cell) {
            const fireEffect = document.createElement('div');
            fireEffect.className = 'fire-effect';
            cell.appendChild(fireEffect);
            
            setTimeout(() => {
              if (fireEffect.parentNode) {
                fireEffect.parentNode.removeChild(fireEffect);
              }
            }, 2000);
          }
        }
      }
    }
    
    // Show fire burst visual effect
    const flashOverlay = document.getElementById('flash-overlay');
    if (flashOverlay) {
      flashOverlay.classList.add('flash-fire');
      setTimeout(() => {
        flashOverlay.classList.remove('flash-fire');
      }, 1000);
    }
  });
}

export { makeMove, isValidMove, executeMove, flipAdjacentTiles };
