// tutorial.js - Simple tutorial logic

import { tutorialStep, setGameStateVar } from './game-state.js';
import { updateUI } from './ui.js';

const TUTORIAL_STEPS = [
  "Welcome to Quantum Flip Duel! Click Next to learn.",
  "Flip tiles by clicking. Flipping AI tiles requires adjacency.",
  "Cast spells with mana. Earn mana by playing.",
  "Defeat the AI by controlling more tiles at the end!",
  "Good luck!"
];

function showTutorial() {
  const tutElem = document.getElementById('tutorial-overlay');
  if (!tutElem) return;
  tutElem.innerHTML = `
    <div class="tutorial-content">
      <p>${TUTORIAL_STEPS[tutorialStep]}</p>
      <button id="tutorial-next">${tutorialStep < TUTORIAL_STEPS.length-1 ? "Next" : "Close"}</button>
    </div>
  `;
  document.getElementById('tutorial-next').onclick = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setGameStateVar('tutorialStep', tutorialStep + 1);
      showTutorial();
      updateUI();
    } else {
      setGameStateVar('tutorialStep', 0);
      tutElem.style.display = 'none';
      updateUI();
    }
  };
  tutElem.style.display = 'block';
}

export { showTutorial, TUTORIAL_STEPS };
