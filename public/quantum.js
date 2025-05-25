// Quantum Flip Game - Single File React App (No external dependencies except React)
// Copy-paste into a React project, or run with an online React playground.

import React, { useState, useEffect } from "react";

// Utility
const range = n => Array.from({ length: n }, (_, i) => i);
const deepClone = obj => JSON.parse(JSON.stringify(obj));

// CONSTANTS
const BOARD_SIZE = 10;
const INIT_MANA = 100;
const MANA_REGEN = 8;
const MAX_MOVES = 70;
const SPELLS = [
  {
    name: "Quantum Split",
    desc: `A single move, many futures.\nSplits a piece into 2-3 possible states; opponent sees all, but only one is real—revealed when targeted.`,
    cost: 30,
    mana: 20,
    key: "quantum",
  },
  {
    name: "Waveform Collapse",
    desc: `Everything becomes... definite.\nCollapses all superpositioned pieces on the board to their actual states. Good for revealing enemy tricks or final strikes.`,
    cost: 20,
    mana: 50,
    key: "collapse",
  },
  {
    name: "Fireball",
    desc: `Casts a fireball in a 4x4 area, flipping all squares inside.`,
    cost: 18,
    mana: 40,
    key: "fireball",
  },
  {
    name: "Skip",
    desc: `Skips the enemy's turn, giving you two moves in a row.`,
    cost: 25,
    mana: 35,
    key: "skip",
  },
];
const DIFFICULTY_LEVELS = [
  "Easy",
  "Medium",
  "Hard",
  "Extreme"
];

// Main App
export default function QuantumFlipGame() {
  // "menu", "play", "tutorial", "shop", "settings"
  const [screen, setScreen] = useState("menu");
  // Settings
  const [difficulty, setDifficulty] = useState(0);
  // Economy
  const [coins, setCoins] = useState(0);
  // Spells owned
  const [spellsOwned, setSpellsOwned] = useState([]);
  // Board, Mana, Turn info
  const [gameState, setGameState] = useState(null);
  // Shop animation
  const [shopAnim, setShopAnim] = useState("");
  // Used for spell selection
  const [selectedSpell, setSelectedSpell] = useState(null);

  // --- UI Navigation ---
  function goHome() {
    setScreen("menu");
    setGameState(null);
    setSelectedSpell(null);
  }

  // --- SETTINGS ---
  function Settings() {
    return (
      <div className="panel">
        <h2>Settings</h2>
        <div>
          <b>AI Difficulty:</b>
          <select
            value={difficulty}
            onChange={e => setDifficulty(+e.target.value)}
          >
            {DIFFICULTY_LEVELS.map((lvl, i) => (
              <option key={lvl} value={i}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
        <button onClick={goHome} style={{ marginTop: 30 }}>
          Back
        </button>
      </div>
    );
  }

  // --- SHOP ---
  function Shop() {
    return (
      <div className="panel">
        <div style={{ marginBottom: 8 }}>
          <b>Coins:</b> <span className="coin">{coins} 🪙</span>
        </div>
        <h2>Shop</h2>
        {SPELLS.map((spell, i) => (
          <div
            key={spell.key}
            style={{
              border: "1px solid #888",
              borderRadius: 6,
              margin: "12px 0",
              padding: 8,
              background: spellsOwned.includes(spell.key) ? "#eaffea" : "#f8f8f8",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: 16 }}>{spell.name}</div>
            <div style={{ whiteSpace: "pre-line", fontSize: 13, color: "#444" }}>
              {spell.desc}
            </div>
            <div>
              <span className="coin">{spell.cost} 🪙</span>
              <span style={{ marginLeft: 12, color: "#555" }}>
                Use: {spell.mana} mana
              </span>
            </div>
            <button
              disabled={spellsOwned.includes(spell.key) || coins < spell.cost}
              onClick={() => {
                if (spellsOwned.includes(spell.key)) return;
                if (coins < spell.cost) return;
                setCoins(coins - spell.cost);
                setSpellsOwned([...spellsOwned, spell.key]);
                setShopAnim(spell.key);
                setTimeout(() => setShopAnim(""), 800);
              }}
              style={{
                marginTop: 6,
                background: spellsOwned.includes(spell.key) ? "#aaa" : "#c6f",
                color: "#fff",
                cursor: spellsOwned.includes(spell.key) ? "not-allowed" : "pointer",
                transition: "transform 0.1s",
                transform: shopAnim === spell.key ? "scale(1.12)" : "scale(1)",
              }}
            >
              {spellsOwned.includes(spell.key) ? "Owned" : "Buy"}
            </button>
          </div>
        ))}
        <button onClick={goHome}>Back</button>
      </div>
    );
  }

  // --- TUTORIAL ---
  function Tutorial() {
    return (
      <div className="panel" style={{ textAlign: "left", maxWidth: 600 }}>
        <h2>Tutorial</h2>
        <ol>
          <li>
            <b>The Goal:</b> Flip as many tiles to your color (white) as possible before the 70-move countdown ends.
          </li>
          <li>
            <b>Turns:</b> You and the AI take turns. Each turn, click any <b>black</b> square; it and all adjacent squares (not corners) flip.
          </li>
          <li>
            <b>Mana:</b> Each turn you regenerate 8 mana. Spells cost mana to cast.
          </li>
          <li>
            <b>Spells:</b> Buy spells in the Shop, then select a spell in-game to use its effect!
          </li>
          <li>
            <b>End:</b> When moves run out, whoever has more squares of their color wins and gets 10 coins!
          </li>
          <li>
            <b>AI:</b> The higher the difficulty, the smarter the AI's moves.
          </li>
        </ol>
        <button onClick={goHome}>Back</button>
      </div>
    );
  }

  // --- MENU ---
  function Menu() {
    return (
      <div className="panel">
        <h1>Quantum Flip</h1>
        <div style={{ margin: "15px 0 40px 0" }}>
          <span className="coin" style={{ fontSize: 22 }}>
            Coins: {coins} 🪙
          </span>
        </div>
        <MenuButton text="Play" onClick={() => startNewGame()} />
        <MenuButton text="Tutorial" onClick={() => setScreen("tutorial")} />
        <MenuButton text="Shop" onClick={() => setScreen("shop")} />
        <MenuButton text="Settings" onClick={() => setScreen("settings")} />
        <div style={{ marginTop: 20, fontSize: 12, color: "#888" }}>
          by copilot | single-file demo
        </div>
      </div>
    );
  }
  function MenuButton({ text, onClick }) {
    return (
      <button
        style={{
          display: "block",
          width: 220,
          margin: "10px auto",
          padding: "12px 0",
          fontSize: 18,
          background: "#b4e",
          color: "#fff",
          borderRadius: 8,
          border: "none",
          boxShadow: "0 2px 8px #0001",
          cursor: "pointer",
        }}
        onClick={onClick}
      >
        {text}
      </button>
    );
  }

  // --- GAME LOGIC ---

  function startNewGame() {
    // Board: 0 = white (player), 1 = black (AI), {quantum: true, ...} for quantum
    let board = range(BOARD_SIZE).map(() =>
      range(BOARD_SIZE).map(() => 1)
    );
    // Center 4x4 to player for a bit of advantage
    for (let r = 3; r < 7; ++r)
      for (let c = 3; c < 7; ++c) board[r][c] = 0;
    setGameState({
      board,
      mana: INIT_MANA,
      aiMana: INIT_MANA,
      turn: 0, // 0=player, 1=ai
      movesLeft: MAX_MOVES,
      winner: null,
      skip: false,
      quantumPieces: [], // [{r,c,states:[0,1], trueState: 0 or 1, visible:bool}]
      spellOn: null, // key of spell selected for use
      showOverlay: null, // for spell
      spellTarget: null,
      usedSkip: false,
    });
    setScreen("play");
    setSelectedSpell(null);
  }

  // BOARD UTILS
  function isQuantum(cell) {
    return typeof cell === "object" && cell.quantum;
  }
  function countBoard(board, val) {
    let n = 0;
    for (let r = 0; r < BOARD_SIZE; ++r)
      for (let c = 0; c < BOARD_SIZE; ++c)
        if (
          (board[r][c] === val) ||
          (isQuantum(board[r][c]) && board[r][c].visible && board[r][c].states.includes(val))
        )
          n++;
    return n;
  }

  // --- GAME UI ---
  function Play() {
    const { board, mana, aiMana, turn, movesLeft, winner, quantumPieces, spellOn, spellTarget, showOverlay, usedSkip } =
      gameState;

    // Scores
    const whiteCount = countBoard(board, 0);
    const blackCount = countBoard(board, 1);

    // For overlay messages
    function overlay(msg, cb) {
      setGameState(gs => ({ ...gs, showOverlay: { msg, cb } }));
    }
    // End game
    function endGame(playerWon) {
      setGameState(gs => ({
        ...gs,
        winner: playerWon ? "You win!" : playerWon === null ? "Draw!" : "AI wins!",
        mana: gs.mana + MANA_REGEN, // Regen on last move
      }));
      if (playerWon)
        setCoins(coins => coins + 10);
    }

    // --- Move Logic ---
    function flip(board, r, c, color) {
      // Standard flip logic: flip (r,c) and N/S/E/W (no corners)
      const dirs = [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      let b = deepClone(board);
      for (let [dr, dc] of dirs) {
        let nr = r + dr,
          nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          // Collapse quantum if present
          if (isQuantum(b[nr][nc])) {
            // Reveal true state
            b[nr][nc] = b[nr][nc].trueState;
          } else {
            b[nr][nc] = color;
          }
        }
      }
      return b;
    }

    // --- Spells ---
    function canUseSpell(spellKey) {
      const spell = SPELLS.find(s => s.key === spellKey);
      if (!spell) return false;
      if (!spellsOwned.includes(spellKey)) return false;
      if (mana < spell.mana) return false;
      if (spellKey === "skip" && usedSkip) return false;
      return true;
    }

    function handleSpellClick(spellKey) {
      if (!canUseSpell(spellKey)) return;
      setGameState(gs => ({ ...gs, spellOn: spellKey, spellTarget: null }));
    }

    // --- Player move ---
    function handleCellClick(r, c) {
      if (winner) return;
      if (turn !== 0) return;
      let cell = board[r][c];
      if (isQuantum(cell)) {
        if (!cell.visible) return; // can't interact with hidden quantum
        cell = cell.states[0]; // random
      }
      if (cell !== 1) return; // Can only flip AI (black) squares

      // Handle spell use
      if (gameState.spellOn) {
        let spellKey = gameState.spellOn;
        if (!canUseSpell(spellKey)) return;
        let gs = deepClone(gameState);
        if (spellKey === "quantum") {
          // Place quantum split
          let states = [0, 1];
          if (Math.random() < 0.5) states.push(1);
          const trueState = states[Math.floor(Math.random() * states.length)];
          gs.board[r][c] = {
            quantum: true,
            states,
            trueState,
            visible: false,
          };
          gs.mana -= SPELLS.find(s => s.key === spellKey).mana;
          gs.spellOn = null;
          gs.movesLeft -= 1;
          gs.turn = 1;
          gs.spellTarget = null;
          gs.quantumPieces.push({ r, c });
          setGameState(gs);
          setTimeout(() => aiMove(gs), 800);
          return;
        } else if (spellKey === "fireball") {
          // Fireball: area flip 4x4
          let b = deepClone(board);
          for (let dr = 0; dr < 4; ++dr)
            for (let dc = 0; dc < 4; ++dc) {
              let nr = r + dr - 1,
                nc = c + dc - 1;
              if (
                nr >= 0 &&
                nr < BOARD_SIZE &&
                nc >= 0 &&
                nc < BOARD_SIZE
              ) {
                if (isQuantum(b[nr][nc])) b[nr][nc] = b[nr][nc].trueState;
                else b[nr][nc] = 0;
              }
            }
          gs.board = b;
          gs.mana -= SPELLS.find(s => s.key === spellKey).mana;
          gs.spellOn = null;
          gs.movesLeft -= 1;
          gs.turn = 1;
          setGameState(gs);
          setTimeout(() => aiMove(gs), 800);
          return;
        }
        // Other spells work on non-board
      }
      // Standard flip
      let b = flip(board, r, c, 0);
      let gs = deepClone(gameState);
      gs.board = b;
      gs.movesLeft -= 1;
      gs.turn = 1;
      gs.mana += MANA_REGEN;
      if (gs.movesLeft <= 0) {
        const w = countBoard(b, 0),
          bl = countBoard(b, 1);
        endGame(w > bl ? 1 : w < bl ? 0 : null);
        return;
      }
      setGameState(gs);
      setTimeout(() => aiMove(gs), 800);
    }

    // --- AI MOVE ---
    function aiMove(gs) {
      if (gs.winner) return;
      let { board, aiMana, skip, movesLeft } = gs;
      // Skip if player cast skip
      if (skip) {
        setGameState({
          ...gs,
          skip: false,
          turn: 0,
          usedSkip: true,
        });
        return;
      }
      // AI chooses spell?
      // Only use collapse if many quantum
      let quantumCount = 0;
      for (let r = 0; r < BOARD_SIZE; ++r)
        for (let c = 0; c < BOARD_SIZE; ++c)
          if (isQuantum(board[r][c])) quantumCount++;
      let aiUsedSpell = false;
      // 20% chance to use collapse if there are 2+ quantum and has mana
      if (
        spellsOwned.includes("collapse") &&
        aiMana >= SPELLS.find(s => s.key === "collapse").mana &&
        quantumCount >= 2 &&
        Math.random() < 0.2
      ) {
        board = collapseAllQuantum(board);
        aiMana -= SPELLS.find(s => s.key === "collapse").mana;
        aiUsedSpell = true;
      }
      // AI move selection logic
      const moves = [];
      for (let r = 0; r < BOARD_SIZE; ++r)
        for (let c = 0; c < BOARD_SIZE; ++c)
          if (board[r][c] === 0) {
            // skip player squares
          } else {
            // simulate flip
            let b2 = flip(board, r, c, 1);
            let gain =
              countBoard(b2, 1) - countBoard(board, 1); // how many more AI squares
            moves.push({ r, c, gain, b2 });
          }
      // Difficulty logic
      let sortedMoves = [...moves].sort((a, b) => b.gain - a.gain);
      let move = null;
      if (difficulty === 0) {
        // Easy: pick random from top 25
        let top = sortedMoves.slice(0, 25);
        move = top[Math.floor(Math.random() * top.length)];
      } else if (difficulty === 1) {
        let top = sortedMoves.slice(0, 15);
        move = top[Math.floor(Math.random() * top.length)];
      } else if (difficulty === 2) {
        let top = sortedMoves.slice(0, 3);
        move = top[Math.floor(Math.random() * top.length)];
      } else if (difficulty === 3) {
        // Extreme: depth 2, pick best
        let best = -Infinity;
        for (let m of sortedMoves.slice(0, 6)) {
          // Simulate player reply (greedy)
          let bestReply = -Infinity;
          for (let rr = 0; rr < BOARD_SIZE; ++rr)
            for (let cc = 0; cc < BOARD_SIZE; ++cc)
              if (m.b2[rr][cc] === 0) {
                let b3 = flip(m.b2, rr, cc, 0);
                let v =
                  countBoard(b3, 1) - countBoard(m.b2, 1);
                if (v > bestReply) bestReply = v;
              }
          let value = m.gain - (bestReply || 0);
          if (value > best) {
            best = value;
            move = m;
          }
        }
      }
      // Do move
      if (!move) move = sortedMoves[0];
      let newBoard = move.b2;
      // Collapse quantum if landed
      newBoard = deepClone(newBoard);
      for (let r = 0; r < BOARD_SIZE; ++r)
        for (let c = 0; c < BOARD_SIZE; ++c)
          if (isQuantum(newBoard[r][c]) && !newBoard[r][c].visible)
            newBoard[r][c].visible = true;
      let newMovesLeft = gs.movesLeft - 1;
      let newTurn = 0;
      if (newMovesLeft <= 0) {
        const w = countBoard(newBoard, 0),
          bl = countBoard(newBoard, 1);
        endGame(w > bl ? 1 : w < bl ? 0 : null);
        return;
      }
      setGameState({
        ...gs,
        board: newBoard,
        aiMana: aiMana + MANA_REGEN,
        turn: newTurn,
        movesLeft: newMovesLeft,
        spellOn: null,
        spellTarget: null,
      });
    }

    // --- Spell Actions ---
    function collapseAllQuantum(board) {
      let b = deepClone(board);
      for (let r = 0; r < BOARD_SIZE; ++r)
        for (let c = 0; c < BOARD_SIZE; ++c)
          if (isQuantum(b[r][c])) b[r][c] = b[r][c].trueState;
      return b;
    }
    function handleCollapseSpell() {
      if (!canUseSpell("collapse")) return;
      let b = collapseAllQuantum(board);
      setGameState(gs => ({
        ...gs,
        board: b,
        mana: gs.mana - SPELLS.find(s => s.key === "collapse").mana,
        spellOn: null,
        spellTarget: null,
        movesLeft: gs.movesLeft - 1,
        turn: 1,
      }));
      setTimeout(() => aiMove({ ...gameState, board: b, mana: gameState.mana - SPELLS.find(s => s.key === "collapse").mana, turn: 1, movesLeft: gameState.movesLeft - 1 }), 700);
    }
    function handleSkipSpell() {
      if (!canUseSpell("skip")) return;
      setGameState(gs => ({
        ...gs,
        mana: gs.mana - SPELLS.find(s => s.key === "skip").mana,
        skip: true,
        usedSkip: true,
        spellOn: null,
        spellTarget: null,
        movesLeft: gs.movesLeft - 1,
        turn: 1,
      }));
      setTimeout(() => aiMove({ ...gameState, skip: true, mana: gameState.mana - SPELLS.find(s => s.key === "skip").mana, usedSkip: true, movesLeft: gameState.movesLeft - 1, turn: 1 }), 700);
    }

    // --- Board Render ---
    return (
      <div className="panel" style={{ maxWidth: 800 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={goHome} style={{ marginBottom: 8 }}>
            Home
          </button>
          {winner && (
            <div style={{ fontSize: 22, fontWeight: "bold" }}>
              {winner}
            </div>
          )}
          <div>
            <b>Moves Left:</b> {movesLeft}
          </div>
        </div>
        <div style={{ margin: "6px 0" }}>
          <span style={{ marginRight: 12 }}>
            <b>Mana:</b> {mana} <span style={{ color: "#6cf" }}>💠</span>
          </span>
          <span style={{ marginRight: 12 }}>
            <b>Your:</b> {whiteCount} <span style={{ color: "#fff" }}>⬜</span>
          </span>
          <span>
            <b>AI:</b> {blackCount} <span style={{ color: "#222" }}>⬛</span>
          </span>
        </div>
        {/* Board */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${BOARD_SIZE},32px)`,
            gridTemplateColumns: `repeat(${BOARD_SIZE},32px)`,
            gap: "2px",
            margin: "12px auto",
            background: "#444",
            border: "2px solid #222",
            width: 34 * BOARD_SIZE,
          }}
        >
          {range(BOARD_SIZE * BOARD_SIZE).map(i => {
            const r = Math.floor(i / BOARD_SIZE),
              c = i % BOARD_SIZE;
            let cell = board[r][c];
            let cellColor =
              cell === 0
                ? "#fff"
                : cell === 1
                ? "#222"
                : isQuantum(cell)
                ? "#aaf"
                : "#fff";
            let border =
              isQuantum(cell) && !cell.visible ? "2px dashed #66f" : "1px solid #888";
            // Spell highlights
            let highlight = "";
            if (
              gameState.spellOn === "fireball" &&
              gameState.spellTarget &&
              Math.abs(r - gameState.spellTarget.r) < 2 &&
              Math.abs(c - gameState.spellTarget.c) < 2
            ) {
              highlight = "rgba(255,0,0,0.18)";
            }
            return (
              <div
                key={i}
                onClick={() => handleCellClick(r, c)}
                style={{
                  background: cellColor,
                  border,
                  width: 32,
                  height: 32,
                  boxSizing: "border-box",
                  cursor:
                    winner || turn !== 0 || (cell !== 1 && !isQuantum(cell))
                      ? "not-allowed"
                      : "pointer",
                  position: "relative",
                  transition: "background 0.2s, border 0.2s",
                  outline: highlight ? "2px solid red" : "",
                  backgroundImage:
                    isQuantum(cell) && cell.visible
                      ? "repeating-linear-gradient(45deg,#aaf 0 4px,#fff 4px 8px)"
                      : "",
                }}
              >
                {/* Quantum piece marker */}
                {isQuantum(cell) && (
                  <span
                    style={{
                      position: "absolute",
                      left: 2,
                      top: 2,
                      fontSize: 17,
                      color: "#66f",
                      fontWeight: "bold",
                    }}
                  >
                    Q
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* Spells UI */}
        <div style={{ margin: "10px 0" }}>
          {SPELLS.map(spell => (
            <button
              key={spell.key}
              disabled={!canUseSpell(spell.key)}
              onClick={() => {
                if (spell.key === "collapse") handleCollapseSpell();
                else if (spell.key === "skip") handleSkipSpell();
                else handleSpellClick(spell.key);
              }}
              style={{
                margin: 3,
                padding: "6px 10px",
                background: spellsOwned.includes(spell.key)
                  ? "#95f"
                  : "#ccc",
                color: "#fff",
                border: "none",
                borderRadius: 5,
                fontWeight: "bold",
                opacity: canUseSpell(spell.key) ? 1 : 0.45,
                outline:
                  (gameState.spellOn === spell.key && spell.key !== "collapse" && spell.key !== "skip")
                    ? "2px solid #fc0"
                    : "",
              }}
              title={spell.desc}
            >
              {spell.name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
          (Select a spell to use it on your next move.)
        </div>
        {/* Overlay */}
        {showOverlay && (
          <div
            style={{
              position: "absolute",
              background: "#000c",
              left: 0,
              top: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
            onClick={() => {
              setGameState(gs => ({ ...gs, showOverlay: null }));
              showOverlay.cb && showOverlay.cb();
            }}
          >
            <div
              style={{
                background: "#222",
                borderRadius: 10,
                padding: 32,
                fontSize: 20,
                minWidth: 300,
                textAlign: "center",
                boxShadow: "0 8px 30px #0007",
              }}
            >
              {showOverlay.msg}
              <div style={{ fontSize: 15, marginTop: 20 }}>
                (Click to continue)
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div
      style={{
        fontFamily: "system-ui, Arial, sans-serif",
        minHeight: "100vh",
        background: "#eee",
        color: "#222",
        padding: 0,
        margin: 0,
        minWidth: 360,
      }}
    >
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1 }}>
          {screen === "menu" && <Menu />}
          {screen === "settings" && <Settings />}
          {screen === "shop" && <Shop />}
          {screen === "tutorial" && <Tutorial />}
          {screen === "play" && gameState && <Play />}
        </div>
      </div>
      {/* Simple style */}
      <style>{`
        .panel {
          background: #fff;
          border-radius: 12px;
          max-width: 410px;
          margin: 24px auto;
          padding: 28px 28px 34px 28px;
          box-shadow: 0 4px 24px #0003;
          text-align: center;
          min-height: 300px;
          position: relative;
        }
        .coin {
          color: #fb0;
          font-weight: bold;
        }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        ::selection { background: #b4e; color: #fff; }
      `}</style>
    </div>
  );
}
