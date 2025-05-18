// main.js - Entry point that initializes the game and sets up event listeners

// Import other modules
import { initializeStorage, getCoins, setCoins, getSpellOwned, setSpellOwned } from './storage.js';
import { 
  SIZE, moveLimit, difficulty, randomEvents, blockRecentMove, 
  board, movesLeft, playerTurn, mana, maxMana, spellEffects,
  canCastSpell, lastMove, recentPlayerMoves, tutorialStep,
  setGameStateVar
} from './game-state.js';
import { initializeBoard, renderBoard, isBoardFull, countTiles } from './board.js';
import { makeMove } from './player.js';
import { aiMove } from './ai.js';
import { SPELLS, castSpell, buySpell } from './spells.js';
import { 
  updateUI, hideAllScreens, showMenu, showGame, showEventMessage, 
  showSaveStatus, updateTutorial, initializeShop, updateSpellbar 
} from './ui.js';
import { TUTORIAL_STEPS } from './tutorial.js';
import { saveGame, loadGame, hasSavedGame } from './storage.js';

function initGame() {
  setGameStateVar('movesLeft', moveLimit);
  setGameStateVar('playerTurn', true);
  setGameStateVar('mana', 50);
  setGameStateVar('spellEffects', { paralyzeAI: 0, frozenTiles: [], fireBurst: false, activePowerups: [] });
  setGameStateVar('lastMove', null);
  setGameStateVar('recentPlayerMoves', []);
  
  initializeBoard();
  updateUI();
  showGame();
}

function endGame() {
  const { playerCount, aiCount } = countTiles();
  const winner = document.getElementById('winner');
  const finalCount = document.getElementById('final-count');
  
  if (playerCount > aiCount) {
    winner.textContent = "You Win!";
    // Award coins
    const earnedCoins = Math.floor(5 + (playerCount - aiCount) / 2);
    setCoins(getCoins() + earnedCoins);
    finalCount.textContent = `Your tiles: ${playerCount} | AI tiles: ${aiCount} | +${earnedCoins} coins earned!`;
  } else if (aiCount > playerCount) {
    winner.textContent = "AI Wins!";
    finalCount.textContent = `Your tiles: ${playerCount} | AI tiles: ${aiCount}`;
  } else {
    winner.textContent = "It's a Tie!";
    // Small coin reward for tie
    setCoins(getCoins() + 2);
    finalCount.textContent = `Your tiles: ${playerCount} | AI tiles: ${aiCount} | +2 coins earned!`;
  }
  
  // Show end screen
  hideAllScreens();
  document.getElementById('end').classList.add('show');
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function() {
  // Initialize storage
  initializeStorage();
  
  // Menu buttons
  document.getElementById('play-btn').addEventListener('click', () => {
    initGame();
  });
  
  document.getElementById('continue-btn').addEventListener('click', () => {
    if (loadGame()) {
      showGame();
    }
  });
  
  document.getElementById('settings-btn').addEventListener('click', () => {
    hideAllScreens();
    document.getElementById('settings').classList.add('show');
  });
  
  document.getElementById('shop-btn').addEventListener('click', () => {
    // Show shop
    hideAllScreens();
    document.getElementById('shop').classList.add('show');
    initializeShop();
  });
  
  document.getElementById('tutorial-btn').addEventListener('click', () => {
    setGameStateVar('tutorialStep', 0);
    hideAllScreens();
    document.getElementById('tutorial').classList.add('show');
    updateTutorial();
  });

  document.getElementById('settings-back').addEventListener('click', showMenu);

  document.getElementById('back-menu').addEventListener('click', showMenu);

  document.getElementById('play-again').addEventListener('click', initGame);

  document.getElementById('end-menu').addEventListener('click', showMenu);

  document.getElementById('end-shop').addEventListener('click', () => {
    hideAllScreens();
    document.getElementById('shop').classList.add('show');
    initializeShop();
  });

  document.getElementById('close-shop').addEventListener('click', showMenu);

  // Save/load game
  document.getElementById('save-game').addEventListener('click', saveGame);
  document.getElementById('load-game').addEventListener('click', () => {
    if (loadGame()) showGame();
  });

  // Tutorial navigation
  document.getElementById('tutorial-next').addEventListener('click', () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setGameStateVar('tutorialStep', tutorialStep + 1);
      updateTutorial();
    }
  });
  
  document.getElementById('tutorial-prev').addEventListener('click', () => {
    if (tutorialStep > 0) {
      setGameStateVar('tutorialStep', tutorialStep - 1);
      updateTutorial();
    }
  });
  
  document.getElementById('tutorial-close').addEventListener('click', showMenu);

  // Settings
  document.getElementById('move-limit-slider').addEventListener('input', function() {
    setGameStateVar('moveLimit', parseInt(this.value));
    document.getElementById('move-limit-val').textContent = this.value;
  });
  
  document.getElementById('difficulty').addEventListener('change', function() {
    setGameStateVar('difficulty', this.value);
  });
  
  document.getElementById('board-size-slider').addEventListener('input', function() {
    setGameStateVar('SIZE', parseInt(this.value));
    document.getElementById('board-size-val').textContent = this.value;
    document.getElementById('board-size-val2').textContent = this.value;
  });
  
  document.getElementById('random-events').addEventListener('change', function() {
    setGameStateVar('randomEvents', this.checked);
  });
  
  document.getElementById('block-recent-move').addEventListener('change', function() {
    setGameStateVar('blockRecentMove', this.checked);
  });

  // Initialize menu UI
  updateUI();
  showMenu();
});

// Export functions for other modules
export { initGame, endGame };
