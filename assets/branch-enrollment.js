/* 지점 페이지: 비용·일정 카드를 화살표로 한 장씩 넘기기 (메인 페이지와 동일 동작) */
(() => {
  const cards = [...document.querySelectorAll('.enrollment-card')];
  const prev = document.getElementById('enrollment-prev');
  const next = document.getElementById('enrollment-next');
  if (!cards.length || !prev || !next) return;
  const mobile = window.matchMedia('(max-width:600px)');
  const tablet = window.matchMedia('(max-width:900px)');
  let start = 0;
  function render() {
    const count = mobile.matches ? 1 : tablet.matches ? 2 : 3;
    start = Math.max(0, Math.min(start, cards.length - count));
    cards.forEach((card, i) => { card.hidden = i < start || i >= start + count; });
    prev.disabled = start === 0;
    next.disabled = start >= cards.length - count;
  }
  prev.addEventListener('click', () => { start--; render(); });
  next.addEventListener('click', () => { start++; render(); });
  mobile.addEventListener('change', render);
  tablet.addEventListener('change', render);
  render();
})();
