// shop.js - Handles spell shop and powerup purchase logic

import { mana, setGameStateVar, spellEffects } from './game-state.js';
import { updateUI, showEventMessage } from './ui.js';

const SPELLS = [
  {
    name: "Freeze Tile",
    cost: 40,
    cast: () => {
      // The next clicked tile gets frozen for 2 turns
      setGameStateVar('canCastSpell', false);
      document.getElementById('board').addEventListener('click', freezeHandler, { once: true });
      showEventMessage('Click any tile to freeze it!');
    }
  },
  {
    name: "Paralyze AI",
    cost: 60,
    cast: () => {
      spellEffects.paralyzeAI += 2;
      showEventMessage("AI paralyzed for 2 turns!");
      updateUI();
    }
  },
  {
    name: "Fire Burst",
    cost: 80,
    cast: () => {
      spellEffects.fireBurst = true;
      showEventMessage("Next attack: Fire Burst!");
      updateUI();
    }
  }
];

function freezeHandler(e) {
  const btn = e.target.closest('.cell');
  if (!btn) return;
  const row = parseInt(btn.getAttribute('data-row'));
  const col = parseInt(btn.getAttribute('data-col'));
  spellEffects.frozenTiles.push({ row, col, duration: 2 });
  setGameStateVar('canCastSpell', true);
  showEventMessage('Tile frozen!');
  updateUI();
}

function purchaseSpell(idx) {
  const spell = SPELLS[idx];
  if (mana < spell.cost) {
    showEventMessage("Not enough mana!");
    return;
  }
  setGameStateVar('mana', mana - spell.cost);
  spell.cast();
  updateUI();
}

function renderShop() {
  const shopElem = document.getElementById('shop');
  if (!shopElem) return;
  shopElem.innerHTML = '<h3>Spell Shop</h3>';
  SPELLS.forEach((spell, i) => {
    const btn = document.createElement('button');
    btn.textContent = `${spell.name} (${spell.cost} mana)`;
    btn.onclick = () => purchaseSpell(i);
    shopElem.appendChild(btn);
  });
}

export { renderShop, purchaseSpell, SPELLS };
