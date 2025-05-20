console.log("JS loaded!");
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById('play-btn');
  if (btn) {
    btn.addEventListener('click', () => alert('Play button works!'));
  } else {
    alert('No play-btn found in DOM');
  }
});
