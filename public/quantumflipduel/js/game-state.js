// game-state.js - Central management of game state variables

// --- Game State Variables ---
let SIZE = 6;
let moveLimit = 30;
let difficulty = "hard";
let randomEvents = false;
let blockRecentMove = true;
let board = [];
let movesLeft = moveLimit;
let playerTurn = true; // player = white
let mana = 50, maxMana = 100;
let spellEffects = { 
  paralyzeAI: 0,
  frozenTiles: [], // Stores coordinates and duration of frozen tiles
  fireBurst: false, // Flag for fire burst effect
  activePowerups: [], // Tracks active powerups and their durations
};
let canCastSpell = true;
let lastMove = null; // Track the last move made
let recentPlayerMoves = []; // Track recent player moves for blocking AI
let tutorialStep = 0;

// Allows other modules to update state variables
function setGameStateVar(varName, value) {
  switch(varName) {
    case 'SIZE': SIZE = value; break;
    case 'moveLimit': moveLimit = value; break;
    case 'difficulty': difficulty = value; break;
    case 'randomEvents': randomEvents = value; break;
    case 'blockRecentMove': blockRecentMove = value; break;
    case 'board': board = value; break;
    case 'movesLeft': movesLeft = value; break;
    case 'playerTurn': playerTurn = value; break;
    case 'mana': mana = value; break;
    case 'maxMana': maxMana = value; break;
    case 'spellEffects': spellEffects = value; break;
    case 'canCastSpell': canCastSpell = value; break;
    case 'lastMove': lastMove = value; break;
    case 'recentPlayerMoves': recentPlayerMoves = value; break;
    case 'tutorialStep': tutorialStep = value; break;
    default:
      console.warn(`Unknown game state variable: ${varName}`);
  }
}

export { 
  SIZE, moveLimit, difficulty, randomEvents, blockRecentMove, 
  board, movesLeft, playerTurn, mana, maxMana, spellEffects,
  canCastSpell, lastMove, recentPlayerMoves, tutorialStep,
  setGameStateVar
};
