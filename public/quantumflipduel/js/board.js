// board.js - Handles board operations and display

import { 
  SIZE, board, spellEffects, lastMove 
} from './game-state.js';

// --- Board Operations ---
function initializeBoard() {
  // Clear the board
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      board[i][j] = 0; // 0 = empty, 1 = player, 2 = AI
    }
  }

  // Place initial pieces
  const mid = Math.floor(SIZE / 2);
  board[mid-1][mid-1] = 1; // Player
  board[mid][mid] = 1; // Player
  board[mid-1][mid] = 2; // AI
  board[mid][mid-1] = 2; // AI
}

function renderBoard() {
  const boardElement = document.getElementById('board');
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;

  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.setAttribute('data-row', i);
      cell.setAttribute('data-col', j);

      if (board[i][j] === 1) cell.classList.add('player');
      else if (board[i][j] === 2) cell.classList.add('ai');

      // Check if the tile is frozen
      const isFrozen = spellEffects.frozenTiles.some(tile =>
        tile.row === i && tile.col === j && tile.duration > 0
      );
      
      if (isFrozen) {
        const frostEffect = document.createElement('div');
        frostEffect.className = 'frost-effect';
        cell.appendChild(frostEffect);
      }
      
      if (lastMove && lastMove.row === i && lastMove.col === j) {
        cell.classList.add('recent-move');
      }
      
      // Import makeMove from player.js when needed
      cell.addEventListener('click', () => {
        import('./player.js').then(({ makeMove }) => {
          makeMove(i, j);
        });
      });
      
      boardElement.appendChild(cell);
    }
  }
}

function animateFlip(row, col) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    cell.classList.add('flipping');
    setTimeout(() => {
      cell.classList.remove('flipping');
    }, 400);
  }
}

function hasAdjacentTile(row, col, tileValue) {
  for (let i = Math.max(0, row-1); i <= Math.min(SIZE-1, row+1); i++) {
    for (let j = Math.max(0, col-1); j <= Math.min(SIZE-1, col+1); j++) {
      if (i === row && j === col) continue;
      if (board[i][j] === tileValue) return true;
    }
  }
  return false;
}

function isBoardFull() {
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  return true;
}

function countTiles() {
  let playerCount = 0;
  let aiCount = 0;
  
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === 1) playerCount++;
      else if (board[i][j] === 2) aiCount++;
    }
  }
  
  return { playerCount, aiCount };
}

export { initializeBoard, renderBoard, animateFlip, hasAdjacentTile, isBoardFull, countTiles };
