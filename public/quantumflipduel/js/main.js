// --- DEBUG ALERTS, REMOVE AFTER TESTING ---
alert('main.js loaded!');

import { 
  initializeStorage, getCoins, setCoins, getSpellOwned, setSpellOwned, 
  saveGame, loadGame, hasSavedGame 
} from './storage.js';
import { 
  SIZE, moveLimit, difficulty, randomEvents, blockRecentMove,
  board, movesLeft, playerTurn, mana, maxMana, spellEffects, 
  canCastSpell, lastMove, recentPlayerMoves, tutorialStep, setGameStateVar 
} from './game-state.js';
import { initializeBoard, renderBoard, isBoardFull, countTiles } from './board.js';
import { makeMove } from './player.js';
import { aiMove } from './ai.js';
import { SPELLS, castSpell, buySpell } from './spells.js';
import { 
  updateUI, hideAllScreens, showMenu, showGame, showEventMessage, showSaveStatus, 
  updateTutorial, initializeShop, updateSpellbar 
} from './ui.js';
import { TUTORIAL_STEPS } from './tutorial.js';

alert('Imports successful!');

function initGame() {
  alert('initGame called!');
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
  alert('endGame called!');
  const { playerCount, aiCount } = countTiles();
  const winner = document.getElementById('winner');
  const finalCount = document.getElementById('final-count');

  if (playerCount > aiCount) {
    alert('Player wins!');
    winner.textContent = "You Win!";
    const earnedCoins = Math.floor(5 + (playerCount - aiCount) / 2);
    setCoins(getCoins() + earnedCoins);
    finalCount.textContent = `Your tiles: ${playerCount} | AI tiles: ${aiCount} | +${earnedCoins} coins earned!`;
  } else if (aiCount > playerCount) {
    alert('AI wins!');
    winner.textContent = "AI Wins!";
    finalCount.textContent = `Your tiles: ${playerCount} | AI tiles: ${aiCount}`;
  } else {
    alert('Tie!');
    winner.textContent = "It's a Tie!";
    setCoins(getCoins() + 2);
    finalCount.textContent = `Your tiles: ${playerCount} | AI tiles: ${aiCount} | +2 coins earned!`;
  }

  hideAllScreens();
  document.getElementById('end').classList.add('show');
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function () {
  alert('DOM fully loaded');

  // Initialize storage
  initializeStorage();
  alert('Storage initialized');

  // Menu buttons
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    alert('playBtn found');
    playBtn.addEventListener('click', () => {
      alert('Play button clicked!');
      initGame();
    });
  } else {
    alert('playBtn NOT found');
  }

  const continueBtn = document.getElementById('continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      alert('Continue button clicked!');
      if (loadGame()) {
        alert('Game loaded!');
        showGame();
      }
    });
  }

  document.getElementById('settings-btn').addEventListener('click', () => {
    alert('Settings button clicked!');
    hideAllScreens();
    document.getElementById('settings').classList.add('show');
  });

  document.getElementById('shop-btn').addEventListener('click', () => {
    alert('Shop button clicked!');
    hideAllScreens();
    document.getElementById('shop').classList.add('show');
    initializeShop();
  });

  document.getElementById('tutorial-btn').addEventListener('click', () => {
    alert('Tutorial button clicked!');
    setGameStateVar('tutorialStep', 0);
    hideAllScreens();
    document.getElementById('tutorial').classList.add('show');
    updateTutorial();
  });

  document.getElementById('settings-back').addEventListener('click', () => {
    alert('Settings back clicked!');
    showMenu();
  });

  document.getElementById('back-menu').addEventListener('click', () => {
    alert('Back to menu clicked!');
    showMenu();
  });

  document.getElementById('play-again').addEventListener('click', () => {
    alert('Play again clicked!');
    initGame();
  });

  document.getElementById('end-menu').addEventListener('click', () => {
    alert('End to menu clicked!');
    showMenu();
  });

  document.getElementById('end-shop').addEventListener('click', () => {
    alert('End shop clicked!');
    hideAllScreens();
    document.getElementById('shop').classList.add('show');
    initializeShop();
  });

  document.getElementById('close-shop').addEventListener('click', () => {
    alert('Close shop clicked!');
    showMenu();
  });

  // Save/load game
  document.getElementById('save-game').addEventListener('click', () => {
    alert('Save game clicked!');
    saveGame();
  });

  document.getElementById('load-game').addEventListener('click', () => {
    alert('Load game clicked!');
    if (loadGame()) {
      alert('Game loaded!');
      showGame();
    }
  });

  // Tutorial navigation
  document.getElementById('tutorial-next').addEventListener('click', () => {
    alert('Tutorial next clicked!');
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setGameStateVar('tutorialStep', tutorialStep + 1);
      updateTutorial();
    }
  });

  document.getElementById('tutorial-prev').addEventListener('click', () => {
    alert('Tutorial prev clicked!');
    if (tutorialStep > 0) {
      setGameStateVar('tutorialStep', tutorialStep - 1);
      updateTutorial();
    }
  });

  document.getElementById('tutorial-close').addEventListener('click', () => {
    alert('Tutorial close clicked!');
    showMenu();
  });

  // Settings
  document.getElementById('move-limit-slider').addEventListener('input', function () {
    alert('Move limit slider changed: ' + this.value);
    setGameStateVar('moveLimit', parseInt(this.value));
    document.getElementById('move-limit-val').textContent = this.value;
  });
  document.getElementById('difficulty').addEventListener('change', function () {
    alert('Difficulty changed: ' + this.value);
    setGameStateVar('difficulty', this.value);
  });
  document.getElementById('board-size-slider').addEventListener('input', function () {
    alert('Board size slider changed: ' + this.value);
    setGameStateVar('SIZE', parseInt(this.value));
    document.getElementById('board-size-val').textContent = this.value;
    document.getElementById('board-size-val2').textContent = this.value;
  });
  document.getElementById('random-events').addEventListener('change', function () {
    alert('Random events checkbox: ' + this.checked);
    setGameStateVar('randomEvents', this.checked);
  });
  document.getElementById('block-recent-move').addEventListener('change', function () {
    alert('Block recent move checkbox: ' + this.checked);
    setGameStateVar('blockRecentMove', this.checked);
  });

  // Initialize menu UI
  alert('UI update and menu show');
  updateUI();
  showMenu();
});

// Export functions for other modules
export { initGame, endGame };
