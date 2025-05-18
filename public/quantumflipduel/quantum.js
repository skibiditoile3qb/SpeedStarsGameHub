// --- Persistent Storage ---
    function getCoins() { return parseInt(localStorage.getItem("qf_coins")||"0"); }
    function setCoins(val) { localStorage.setItem("qf_coins",val); }
    function getSpellOwned(spell) { return JSON.parse(localStorage.getItem("qf_spell_" + spell)||"false"); }
    function setSpellOwned(spell, owned) { localStorage.setItem("qf_spell_" + spell, owned?"true":"false"); }
    
    // --- Save game system ---
    function saveGame() {
      const gameState = {
        board,
        movesLeft,
        playerTurn,
        mana,
        spellEffects,
        SIZE,
        difficulty,
        moveLimit,
        randomEvents,
        lastMove
      };
      localStorage.setItem("qf_saved_game", JSON.stringify(gameState));
      showSaveStatus("Game saved successfully!");
    }
    
    function loadGame() {
      const savedGame = localStorage.getItem("qf_saved_game");
      if (!savedGame) {
        showSaveStatus("No saved game found!");
        return false;
      }
      
      try {
        const gameState = JSON.parse(savedGame);
        board = gameState.board;
        movesLeft = gameState.movesLeft;
        playerTurn = gameState.playerTurn;
        mana = gameState.mana;
        spellEffects = gameState.spellEffects;
        SIZE = gameState.SIZE;
        difficulty = gameState.difficulty;
        moveLimit = gameState.moveLimit;
        randomEvents = gameState.randomEvents;
        lastMove = gameState.lastMove;
        
        // Update UI elements
        document.getElementById('move-limit-slider').value = moveLimit;
        document.getElementById('move-limit-val').textContent = moveLimit;
        document.getElementById('difficulty').value = difficulty;
        document.getElementById('board-size-slider').value = SIZE;
        document.getElementById('board-size-val').textContent = SIZE;
        document.getElementById('board-size-val2').textContent = SIZE;
        document.getElementById('random-events').checked = randomEvents;
        
        canCastSpell = true;
        updateUI();
        showSaveStatus("Game loaded successfully!");
        return true;
      } catch (e) {
        console.error("Error loading game:", e);
        showSaveStatus("Error loading game!");
        return false;
      }
    }
    
    function hasSavedGame() {
      return localStorage.getItem("qf_saved_game") !== null;
    }
    
    function showSaveStatus(message) {
      const statusEl = document.getElementById('save-status');
      statusEl.textContent = message;
      statusEl.style.display = 'block';
      
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 2000);
    }

    // --- Spell definitions ---
    const SPELLS = [
      {
        id: "lightning",
        name: "Lightning",
        desc: "Paralyze AI for 1 move. You move again instantly.",
        coin: 0,  // Free in shop
        mana: 40,
        testonly: true
      },
      {
        id: "frost",
        name: "Frost Wave",
        desc: "Freeze a 3x3 area of the board, making those tiles immune to flipping for 3 turns.",
        coin: 10,
        mana: 30,
        testonly: false
      },
      {
        id: "fire",
        name: "Fire Burst",
        desc: "Convert all adjacent opponent tiles around your most recent flip.",
        coin: 20,
        mana: 45,
        testonly: false
      },
      {
        id: "void",
        name: "Void Rift",
        desc: "Swap the positions of 5 random pairs of tiles on the board.",
        coin: 30,
        mana: 65,
        testonly: false
      },
      {
        id: "amplify",
        name: "Mana Surge",
        desc: "Instantly gain 50 mana points.",
        coin: 15,
        mana: 0,
        testonly: false
      }
    ];

    // --- State ---
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
    // --- Tutorial Content ---
const TUTORIAL_STEPS = [
  {
    title: "Welcome to Quantum Flip Duel",
    content: `<p>Quantum Flip Duel is a strategic board game where you compete against the AI to claim the most tiles.</p>
              <p>The goal is simple: <span class="tutorial-highlight">have more tiles in your color when the game ends</span>.</p>
              <p>The game ends when all moves are used up or when there are no valid moves left.</p>`
  },
  {
    title: "Making Moves",
    content: `<p>Players take turns flipping tiles on the board.</p>
              <p>When you click an empty tile, it becomes yours (white).</p>
              <p>When you click on <span class="tutorial-highlight">any adjacent opponent's tile</span>, it flips to your color!</p>
              <p>This is the key to victory - strategic flipping to convert your opponent's tiles.</p>`
  },
  {
    title: "Spells & Mana",
    content: `<p>As you play, you gain <span class="tutorial-highlight">mana</span> that can be used to cast powerful spells.</p>
              <p>Spells give you special abilities like freezing tiles, converting adjacent opponent tiles, and more.</p>
              <p>You can buy new spells in the shop using coins earned from victories.</p>`
  },
  {
    title: "Strategic Tips",
    content: `<p>To win consistently:</p>
              <ul>
                <li>Focus on <span class="tutorial-highlight">controlling the center</span> of the board</li>
                <li>Try to create patterns that are difficult for the AI to flip</li>
                <li>Save your spells for critical moments</li>
                <li>Watch out for random events when enabled!</li>
              </ul>`
  }
];

// --- Game Initialization ---
function initializeBoard() {
  board = [];
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

      // Use correct variables here:
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
      cell.addEventListener('click', () => makeMove(i, j));
      boardElement.appendChild(cell);
    }
  }
}

// --- Core Game Functions ---
function makeMove(row, col) {
  if (!playerTurn || movesLeft <= 0) return;
  
  // Check if move is valid
  if (!isValidMove(row, col)) return;
  
  // Execute the move
  executeMove(row, col, true);
  
  // Update last move
  lastMove = { row, col };
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
  playerTurn = false;
  updateUI();
  
  // Check if AI is paralyzed
  if (spellEffects.paralyzeAI > 0) {
    spellEffects.paralyzeAI--;
    playerTurn = true;
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

  // Use correct variables here:
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
  movesLeft--;
  if (isPlayer) {
    mana = Math.min(maxMana, mana + 8);
  }
  return true;
}
  
  // Decrement moves
  movesLeft--;
  
  // Gain mana for player
  if (isPlayer) {
    mana = Math.min(maxMana, mana + 8);
  }
  
  return true;
}

function flipAdjacentTiles(row, col) {
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
  flashOverlay.classList.add('flash-fire');
  setTimeout(() => {
    flashOverlay.classList.remove('flash-fire');
  }, 1000);
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

function animateFlip(row, col) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    cell.classList.add('flipping');
    setTimeout(() => {
      cell.classList.remove('flipping');
    }, 400);
  }
}

// --- AI Move Logic ---
function aiMove() {
  if (movesLeft <= 0) {
    endGame();
    return;
  }
  
  let bestMove = findBestMove();
  
  if (bestMove) {
    executeMove(bestMove.row, bestMove.col, false);
    lastMove = bestMove;
    
    // Update frozen tiles durations
    updateFrozenTiles();
    
    // Check for game end
    if (movesLeft <= 0 || isBoardFull()) {
      endGame();
      return;
    }
    
    // Switch turns back to player
    playerTurn = true;
    updateUI();
  } else {
    // No valid moves for AI
    movesLeft = 0;
    endGame();
  }
}

function findBestMove() {
  const validMoves = [];
  
  // Find all valid moves
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (board[i][j] === 0 || (board[i][j] === 1 && hasAdjacentTile(i, j, 2))) {
        // Check if this is a frozen tile
        const isFrozen = spellEffects.frozenTiles.some(tile => 
          tile.row === i && tile.col === j && tile.duration > 0
        );
        
        // Check if this was the player's recent move (if blockRecentMove is enabled)
        const isRecentPlayerMove = blockRecentMove && recentPlayerMoves.some(move => 
          move.row === i && move.col === j
        );
        
        if (!isFrozen && !isRecentPlayerMove) {
          let score = evaluateMove(i, j);
          validMoves.push({ row: i, col: j, score });
        }
      }
    }
  }
  
  if (validMoves.length === 0) return null;
  
  // Sort moves by score
  validMoves.sort((a, b) => b.score - a.score);
  
  // Pick best move based on difficulty
  if (difficulty === "easy") {
    // Random move from top 70%
    const index = Math.floor(Math.random() * Math.max(1, Math.floor(validMoves.length * 0.7)));
    return validMoves[index];
  } else if (difficulty === "medium") {
    // Random move from top 40%
    const index = Math.floor(Math.random() * Math.max(1, Math.floor(validMoves.length * 0.4)));
    return validMoves[index];
  } else {
    // Hard - pick best move (with a tiny chance of mistake)
    if (Math.random() < 0.05) {
      const index = Math.floor(Math.random() * Math.min(3, validMoves.length));
      return validMoves[index];
    }
    return validMoves[0];
  }
}

function evaluateMove(row, col) {
  let score = 0;
  
  // Base score for empty vs occupied
  if (board[row][col] === 0) {
    // Placing on empty tile
    score += 10;
    
    // Prefer center area
    const distFromCenter = Math.abs(row - SIZE/2) + Math.abs(col - SIZE/2);
    score += (SIZE - distFromCenter) * 5;
    
    // Prefer corners
    if ((row === 0 || row === SIZE-1) && (col === 0 || col === SIZE-1)) {
      score += 15;
    }
    
    // Prefer edges
    if (row === 0 || row === SIZE-1 || col === 0 || col === SIZE-1) {
      score += 5;
    }
  } else if (board[row][col] === 1) {
    // Flipping player's tile
    score += 20;
    
    // Count how many adjacent tiles would also flip
    let adjacentPlayerTiles = 0;
    for (let i = Math.max(0, row-1); i <= Math.min(SIZE-1, row+1); i++) {
      for (let j = Math.max(0, col-1); j <= Math.min(SIZE-1, col+1); j++) {
        if (i === row && j === col) continue;
        if (board[i][j] === 1 && hasAdjacentTile(i, j, 2)) {
          adjacentPlayerTiles++;
        }
      }
    }
    score += adjacentPlayerTiles * 15;
  }
  
  return score;
}

// --- Spell Functions ---
function castSpell(spellId) {
  const spell = SPELLS.find(s => s.id === spellId);
  if (!spell || !canCastSpell || mana < spell.mana) return;
  
  // Deduct mana
  mana -= spell.mana;
  canCastSpell = false;
  
  // Visual effect
  const flashOverlay = document.getElementById('flash-overlay');
  
  switch (spellId) {
    case "lightning":
      // Paralyze AI for one turn
      spellEffects.paralyzeAI = 1;
      flashSpellEffect('lightning');
      showEventMessage("Lightning Strike! AI skips next turn!");
      break;
      
    case "frost":
      // Apply frost to a 3x3 area
      applyFrostEffect();
      flashSpellEffect('frost');
      showEventMessage("Frost Wave! 3x3 area frozen for 3 turns!");
      break;
      
    case "fire":
      // Set up fire burst for next move
      spellEffects.fireBurst = true;
      flashSpellEffect('fire');
      showEventMessage("Fire Burst ready! Your next move will convert all adjacent opponent tiles!");
      break;
      
    case "void":
      // Swap random pairs of tiles
      voidSwapEffect();
      flashSpellEffect('void');
      showEventMessage("Void Rift! 5 random pairs of tiles have swapped positions!");
      break;
      
    case "amplify":
      // Gain mana
      mana = Math.min(maxMana, mana + 50);
      flashSpellEffect('amplify');
      showEventMessage("Mana Surge! +50 mana gained!");
      break;
  }
  
  updateUI();
  
  // Re-enable spell casting after a delay
  setTimeout(() => {
    canCastSpell = true;
    updateUI();
  }, 1000);
}

function applyFrostEffect() {
  // If there's a last move, freeze around it
  if (lastMove) {
    const { row, col } = lastMove;
    
    for (let i = Math.max(0, row-1); i <= Math.min(SIZE-1, row+1); i++) {
      for (let j = Math.max(0, col-1); j <= Math.min(SIZE-1, col+1); j++) {
        // Add to frozen tiles with duration of 3 turns
        spellEffects.frozenTiles.push({ row: i, col: j, duration: 3 });
        
        // Add visual frost effect
        const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
        if (cell) {
          const frostEffect = document.createElement('div');
          frostEffect.className = 'frost-effect';
          cell.appendChild(frostEffect);
        }
      }
    }
  }
}

function updateFrozenTiles() {
  // Decrease duration of all frozen tiles
  spellEffects.frozenTiles = spellEffects.frozenTiles
    .map(tile => ({ ...tile, duration: tile.duration - 1 }))
    .filter(tile => tile.duration > 0);
    
  // Update visual effects
  renderBoard();
}

function voidSwapEffect() {
  // Get all tile positions
  const allPositions = [];
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      allPositions.push({ row: i, col: j });
    }
  }
  
  // Shuffle positions
  const shuffled = [...allPositions].sort(() => 0.5 - Math.random());
  
  // Swap 5 pairs (or fewer if board is small)
  const pairsToSwap = Math.min(5, Math.floor(SIZE * SIZE / 4));
  for (let i = 0; i < pairsToSwap; i++) {
    const pos1 = shuffled[i * 2];
    const pos2 = shuffled[i * 2 + 1];
    
    // Swap the tiles
    const temp = board[pos1.row][pos1.col];
    board[pos1.row][pos1.col] = board[pos2.row][pos2.col];
    board[pos2.row][pos2.col] = temp;
    
    // Animate both cells
    animateFlip(pos1.row, pos1.col);
    animateFlip(pos2.row, pos2.col);
  }
}

function flashSpellEffect(type) {
  const flashOverlay = document.getElementById('flash-overlay');
  
  switch (type) {
    case 'frost':
      flashOverlay.classList.add('flash-frost');
      setTimeout(() => flashOverlay.classList.remove('flash-frost'), 1000);
      break;
    case 'fire':
      flashOverlay.classList.add('flash-fire');
      setTimeout(() => flashOverlay.classList.remove('flash-fire'), 1000);
      break;
    case 'void':
      flashOverlay.classList.add('flash-void');
      setTimeout(() => flashOverlay.classList.remove('flash-void'), 1200);
      break;
    default:
      // Generic flash
      flashOverlay.style.background = 'rgba(255, 255, 255, 0.3)';
      flashOverlay.style.opacity = '1';
      setTimeout(() => { 
        flashOverlay.style.opacity = '0';
        flashOverlay.style.background = 'transparent';
      }, 800);
  }
}

// --- UI Update Functions ---
function updateUI() {
  // Update move counter
  document.getElementById('move-counter').textContent = `Moves: ${movesLeft}`;
  
  // Update turn indicator
  document.getElementById('whose-turn').textContent = playerTurn ? "Your Turn" : "AI's Turn";
  
  // Update mana bar
  const manaBar = document.getElementById('mana-bar');
  const manaLabel = document.getElementById('mana-label');
  manaBar.style.width = `${(mana / maxMana) * 100}%`;
  manaLabel.textContent = `Mana: ${mana}/${maxMana}`;
  
  // Update coin display
  const coins = getCoins();
  document.getElementById('menu-coins').textContent = `Coins: ${coins}`;
  document.getElementById('game-coins').textContent = `Coins: ${coins}`;
  document.getElementById('shop-coins').textContent = `Your Coins: ${coins}`;
  
  // Update spellbar
  updateSpellbar();
  
  // Render updated board
  renderBoard();
  
  // Update continue button in menu
  const continueBtn = document.getElementById('continue-btn');
  if (hasSavedGame()) {
    continueBtn.style.display = 'block';
  } else {
    continueBtn.style.display = 'none';
  }
}

function updateSpellbar() {
  const spellbar = document.getElementById('spellbar');
  spellbar.innerHTML = '';
  
  // Only show owned spells
  SPELLS.forEach(spell => {
    if (getSpellOwned(spell.id)) {
      const button = document.createElement('button');
      button.className = 'spellbutton';
      button.textContent = spell.name;
      button.disabled = !canCastSpell || mana < spell.mana;
      
      // Add mana cost
      const manaSpan = document.createElement('span');
      manaSpan.className = 'spell-mana';
      manaSpan.textContent = `${spell.mana}⧫`;
      button.appendChild(manaSpan);
      
      // Add spell cast handler
      button.addEventListener('click', () => castSpell(spell.id));
      
      spellbar.appendChild(button);
    }
  });
}

function showEventMessage(message) {
  const eventMsg = document.getElementById('event-msg');
  eventMsg.textContent = message;
  eventMsg.style.display = 'block';
  
  // Clear after 4 seconds
  setTimeout(() => {
    eventMsg.style.display = 'none';
  }, 4000);
}

function triggerRandomEvent() {
  // Random event effects
  const eventTypes = [
    { name: "Quantum Flip", action: randomQuantumFlip },
    { name: "Meteor Strike", action: meteorStrike },
    { name: "Mana Surge", action: manaSurge }
  ];
  
  // Pick a random event
  const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  randomEvent.action();
  showEventMessage(`Random Event: ${randomEvent.name}!`);
}

function randomQuantumFlip() {
  // Randomly flip 3-5 tiles
  const flipsCount = Math.floor(Math.random() * 3) + 3;
  
  let flipped = 0;
  let attempts = 0;
  while (flipped < flipsCount && attempts < 20) {
    attempts++;
    
    const row = Math.floor(Math.random() * SIZE);
    const col = Math.floor(Math.random() * SIZE);
    
    if (board[row][col] !== 0) {
      board[row][col] = board[row][col] === 1 ? 2 : 1;
      animateFlip(row, col);
      
      const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cell) cell.classList.add('event');
      flipped++;
      
      setTimeout(() => {
        const cells = document.querySelectorAll('.cell.event');
        cells.forEach(c => c.classList.remove('event'));
      }, 1500);
    }
  }
}

function meteorStrike() {
  // Clear a random 2x2 area
  const startRow = Math.floor(Math.random() * (SIZE - 1));
  const startCol = Math.floor(Math.random() * (SIZE - 1));
  
  for (let i = startRow; i < startRow + 2; i++) {
    for (let j = startCol; j < startCol + 2; j++) {
      board[i][j] = 0;
      
      const cell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
      if (cell) {
        cell.classList.add('meteor');
        animateFlip(i, j);
      }
    }
  }
  
  setTimeout(() => {
    const cells = document.querySelectorAll('.cell.meteor');
    cells.forEach(c => c.classList.remove('meteor'));
  }, 1500);
}

function manaSurge() {
  // Bonus mana
  const bonusMana = Math.floor(Math.random() * 30) + 20;
  mana = Math.min(maxMana, mana + bonusMana);
  showEventMessage(`Mana Surge! +${bonusMana} mana gained!`);
}

// --- Game End Logic ---
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

// --- Shop Functions ---
function initializeShop() {
  const shopSpellsList = document.getElementById('shop-spells');
  shopSpellsList.innerHTML = '';
  
  SPELLS.forEach(spell => {
    if (!spell.testonly) { // Skip test-only spells
      const spellEl = document.createElement('div');
      spellEl.className = 'shop-spell';
      
      const owned = getSpellOwned(spell.id);
      
      spellEl.innerHTML = `
        <div>
          <div class="shop-spell-name">${spell.name}</div>
          <div class="shop-spell-desc">${spell.desc}</div>
          <div><span class="shop-spell-mana">Mana: ${spell.mana}</span> 
               ${owned ? '<span class="shop-spell-owned">Owned</span>' : '<span class="shop-spell-cost">Cost: ${spell.coin} coins</span>'}
          </div>
        </div>
      `;
      
      if (!owned) {
        const buyBtn = document.createElement('button');
        buyBtn.className = 'shop-buy-btn';
        buyBtn.textContent = 'Buy';
        buyBtn.disabled = getCoins() < spell.coin;
        buyBtn.addEventListener('click', () => {
          buySpell(spell.id);
        });
        spellEl.appendChild(buyBtn);
      }
      
      shopSpellsList.appendChild(spellEl);
    }
  });
}

function buySpell(spellId) {
  const spell = SPELLS.find(s => s.id === spellId);
  if (!spell) return;
  
  const currentCoins = getCoins();
  if (currentCoins >= spell.coin) {
    setCoins(currentCoins - spell.coin);
    setSpellOwned(spellId, true);
    showSaveStatus(`${spell.name} purchased!`);
    initializeShop();
    updateUI();
  }
}

// --- Tutorial Functions ---
function updateTutorial() {
  const content = document.getElementById('tutorial-content');
  const prevBtn = document.getElementById('tutorial-prev');
  const nextBtn = document.getElementById('tutorial-next');
  const closeBtn = document.getElementById('tutorial-close');
  
  const step = TUTORIAL_STEPS[tutorialStep];
  
  content.innerHTML = `
    <div class="tutorial-step">
      <h3>${step.title}</h3>
      <div class="tutorial-content">${step.content}</div>
    </div>
  `;
  
  // Update navigation buttons
  prevBtn.style.display = tutorialStep > 0 ? 'block' : 'none';
  nextBtn.style.display = tutorialStep < TUTORIAL_STEPS.length - 1 ? 'block' : 'none';
  closeBtn.style.display = tutorialStep === TUTORIAL_STEPS.length - 1 ? 'block' : 'none';
}

// --- UI Screen Functions ---
function hideAllScreens() {
  document.getElementById('menu').classList.remove('show');
  document.getElementById('settings').classList.remove('show');
  document.getElementById('game').classList.remove('show');
  document.getElementById('end').classList.remove('show');
  document.getElementById('shop').classList.remove('show');
  document.getElementById('tutorial').classList.remove('show');
}

function showMenu() {
  hideAllScreens();
  document.getElementById('menu').classList.add('show');
  updateUI();
}

function showGame() {
  hideAllScreens();
  document.getElementById('game').classList.add('show');
}

function initGame() {
  movesLeft = moveLimit;
  playerTurn = true;
  mana = 50;
  spellEffects = { paralyzeAI: 0, frozenTiles: [], fireBurst: false, activePowerups: [] };
  lastMove = null;
  recentPlayerMoves = [];
  
  initializeBoard();
  updateUI();
  showGame();
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', function() {
  // If no coins are set, initialize with a starting amount
  if (getCoins() === 0) {
    setCoins(10);
  }
  
  // Give the free lightning spell to start
  if (!getSpellOwned("lightning")) {
    setSpellOwned("lightning", true);
  }
  
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
  tutorialStep = 0;
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
    tutorialStep++;
    updateTutorial();
  }
});
document.getElementById('tutorial-prev').addEventListener('click', () => {
  if (tutorialStep > 0) {
    tutorialStep--;
    updateTutorial();
  }
});
document.getElementById('tutorial-close').addEventListener('click', showMenu);

// Settings
document.getElementById('move-limit-slider').addEventListener('input', function() {
  moveLimit = parseInt(this.value);
  document.getElementById('move-limit-val').textContent = this.value;
});
document.getElementById('difficulty').addEventListener('change', function() {
  difficulty = this.value;
});
document.getElementById('board-size-slider').addEventListener('input', function() {
  SIZE = parseInt(this.value);
  document.getElementById('board-size-val').textContent = this.value;
  document.getElementById('board-size-val2').textContent = this.value;
});
document.getElementById('random-events').addEventListener('change', function() {
  randomEvents = this.checked;
});
document.getElementById('block-recent-move').addEventListener('change', function() {
  blockRecentMove = this.checked;
});

// Initialize menu UI
updateUI();
showMenu();
});
