// events.js - Handles random in-game events

import { SIZE, board, spellEffects, setGameStateVar } from './game-state.js';
import { showEventMessage, updateUI } from './ui.js';
import { animateFlip } from './board.js';

// List of possible events
const EVENT_LIST = [
  // Each event is an object: { name, handler }
  {
    name: "Freeze random tile!",
    handler: () => {
      let unfrozen = [];
      for (let i = 0; i < SIZE; i++)
        for (let j = 0; j < SIZE; j++)
          if (!spellEffects.frozenTiles.some(t => t.row === i && t.col === j && t.duration > 0))
            unfrozen.push({ row: i, col: j });
      if (unfrozen.length === 0) return;
      const pick = unfrozen[Math.floor(Math.random() * unfrozen.length)];
      spellEffects.frozenTiles.push({ ...pick, duration: 2 });
      showEventMessage("A tile is frozen!");
    }
  },
  {
    name: "Fire burst!",
    handler: () => {
      spellEffects.fireBurst = true;
      showEventMessage("Fire burst! Flip all adjacent!");
    }
  },
  {
    name: "Paralyze AI!",
    handler: () => {
      spellEffects.paralyzeAI += 1;
      showEventMessage("AI is paralyzed for a turn!");
    }
  }
];

function triggerRandomEvent() {
  const event = EVENT_LIST[Math.floor(Math.random() * EVENT_LIST.length)];
  event.handler();
  updateUI();
}

export { triggerRandomEvent, EVENT_LIST };
