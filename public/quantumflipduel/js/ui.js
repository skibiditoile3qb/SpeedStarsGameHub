// ui.js - Handles UI updates, overlays, feedback, and controls

import { SIZE, movesLeft, mana, maxMana, playerTurn, spellEffects, canCastSpell, tutorialStep } from './game-state.js';

function updateUI() {
  // Moves left
  const movesElem = document.getElementById('moves-left');
  if (movesElem) movesElem.textContent = `Moves: ${movesLeft}`;

  // Mana
  const manaElem = document.getElementById('mana-bar');
  if (manaElem) {
    manaElem.style.width = `${(mana / maxMana) * 100}%`;
    manaElem.textContent = `${mana}/${maxMana} Mana`;
  }

  // Player turn indicator
  const turnElem = document.getElementById('turn-indicator');
  if (turnElem) turnElem.textContent = playerTurn ? 'Your Turn' : "AI's Turn";

  // Spell cast button enable/disable
  const spellBtn = document.getElementById('cast-spell');
  if (spellBtn) spellBtn.disabled = !canCastSpell;

  // Tutorial overlay
  const tutElem = document.getElementById('tutorial-overlay');
  if (tutElem) tutElem.style.display = tutorialStep > 0 ? 'block' : 'none';
}

function showEventMessage(text, duration = 1500) {
  const eventElem = document.getElementById('event-msg');
  if (eventElem) {
    eventElem.textContent = text;
    eventElem.style.opacity = 1;
    setTimeout(() => { eventElem.style.opacity = 0; }, duration);
  }
}

export function hideAllScreens() {
  // Hide all game screens, e.g.:
  document.getElementById('menu').classList.remove('show');
  document.getElementById('settings').classList.remove('show');
  document.getElementById('game').classList.remove('show');
  document.getElementById('shop').classList.remove('show');
  document.getElementById('tutorial').classList.remove('show');
  document.getElementById('end').classList.remove('show');
}
export function initializeShop() {
  // Placeholder: fill with actual shop initialization logic later
  // For now, just print to console to verify it works
  console.log("Shop initialized!");
}
function showShop(show = true) {
  const shopElem = document.getElementById('shop');
  if (shopElem) shopElem.style.display = show ? 'block' : 'none';
}

function showEndGame(winner) {
  const endElem = document.getElementById('endgame-msg');
  if (endElem) {
    endElem.textContent = winner ? `${winner} wins!` : "It's a draw!";
    endElem.style.display = 'block';
  }
}

export { updateUI, showEventMessage, showShop, showEndGame };
