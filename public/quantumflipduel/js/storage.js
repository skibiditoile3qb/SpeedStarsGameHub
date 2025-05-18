// storage.js - Manages local storage for game state, settings, and player progress

// --- Persistent Storage ---
function initializeStorage() {
  // If no coins are set, initialize with a starting amount
  if (getCoins() === 0) {
    setCoins(10);
  }

  // Give the free lightning spell to start
  if (!getSpellOwned("lightning")) {
    setSpellOwned("lightning", true);
  }
}

function getCoins() { 
  return parseInt(localStorage.getItem("qf_coins") || "0"); 
}

function setCoins(val) { 
  localStorage.setItem("qf_coins", val); 
}

function getSpellOwned(spell) { 
  return JSON.parse(localStorage.getItem("qf_spell_" + spell) || "false"); 
}

function setSpellOwned(spell, owned) { 
  localStorage.setItem("qf_spell_" + spell, owned ? "true" : "false"); 
}

// --- Save game system ---
async function saveGame() {
  // Import needed game state
  const gameStateModule = await import('./game-state.js');
  const {
    board, movesLeft, playerTurn, mana,
    spellEffects, SIZE, difficulty, moveLimit,
    randomEvents, lastMove
  } = gameStateModule;

  const gameState = {
    board: gameStateModule.board,
    movesLeft: gameStateModule.movesLeft,
    playerTurn: gameStateModule.playerTurn,
    mana: gameStateModule.mana,
    spellEffects: gameStateModule.spellEffects,
    SIZE: gameStateModule.SIZE,
    difficulty: gameStateModule.difficulty,
    moveLimit: gameStateModule.moveLimit,
    randomEvents: gameStateModule.randomEvents,
    lastMove: gameStateModule.lastMove
  };

  localStorage.setItem("qf_saved_game", JSON.stringify(gameState));

  const { showSaveStatus } = await import('./ui.js');
  showSaveStatus("Game saved successfully!");
}

async function loadGame() {
  const savedGame = localStorage.getItem("qf_saved_game");
  if (!savedGame) {
    const { showSaveStatus } = await import('./ui.js');
    showSaveStatus("No saved game found!");
    return false;
  }

  try {
    const gameState = JSON.parse(savedGame);
    const { setGameStateVar } = await import('./game-state.js');

    // Update all game state variables
    setGameStateVar('board', gameState.board);
    setGameStateVar('movesLeft', gameState.movesLeft);
    setGameStateVar('playerTurn', gameState.playerTurn);
    setGameStateVar('mana', gameState.mana);
    setGameStateVar('spellEffects', gameState.spellEffects);
    setGameStateVar('SIZE', gameState.SIZE);
    setGameStateVar('difficulty', gameState.difficulty);
    setGameStateVar('moveLimit', gameState.moveLimit);
    setGameStateVar('randomEvents', gameState.randomEvents);
    setGameStateVar('lastMove', gameState.lastMove);
    setGameStateVar('canCastSpell', true);

    // Update UI elements
    document.getElementById('move-limit-slider').value = gameState.moveLimit;
    document.getElementById('move-limit-val').textContent = gameState.moveLimit;
    document.getElementById('difficulty').value = gameState.difficulty;
    document.getElementById('board-size-slider').value = gameState.SIZE;
    document.getElementById('board-size-val').textContent = gameState.SIZE;
    document.getElementById('board-size-val2').textContent = gameState.SIZE;
    document.getElementById('random-events').checked = gameState.randomEvents;

    const { updateUI, showSaveStatus } = await import('./ui.js');
    updateUI();
    showSaveStatus("Game loaded successfully!");
    return true;
  } catch (e) {
    console.error("Error loading game:", e);
    const { showSaveStatus } = await import('./ui.js');
    showSaveStatus("Error loading game!");
    return false;
  }
}

function hasSavedGame() {
  return localStorage.getItem("qf_saved_game") !== null;
}

export { 
  initializeStorage, 
  getCoins, 
  setCoins, 
  getSpellOwned, 
  setSpellOwned, 
  saveGame, 
  loadGame, 
  hasSavedGame 
};
