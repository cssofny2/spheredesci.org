/* Queues the full briefing after the short intro video ends.
   Without JavaScript both videos are simply on the page, one after the other. */
(function () {
  'use strict';
  var short = document.querySelector('#intro-video video');
  var long = document.getElementById('full-briefing-video');
  var card = document.getElementById('up-next');
  var count = document.getElementById('up-next-count');
  var playBtn = document.getElementById('up-next-play');
  var cancelBtn = document.getElementById('up-next-cancel');
  if (!short || !long || !card || !count || !playBtn || !cancelBtn) return;

  var SECONDS = 5;
  var timer = null;

  function hideCard() {
    if (timer) { clearInterval(timer); timer = null; }
    card.hidden = true;
  }

  function startLong() {
    hideCard();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    long.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    var attempt = long.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () { /* the browser blocked autoplay; the viewer can press play */ });
    }
  }

  short.addEventListener('ended', function () {
    var left = SECONDS;
    count.textContent = String(left);
    card.hidden = false;
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      left -= 1;
      count.textContent = String(left);
      if (left <= 0) startLong();
    }, 1000);
  });

  // Replaying, seeking or pressing play on either video cancels a pending auto-start.
  short.addEventListener('play', hideCard);
  long.addEventListener('play', hideCard);
  playBtn.addEventListener('click', startLong);
  cancelBtn.addEventListener('click', hideCard);
})();
