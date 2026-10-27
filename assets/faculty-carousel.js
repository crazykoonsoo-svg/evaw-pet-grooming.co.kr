(() => {
  const root = document.querySelector('.faculty-carousel');
  if (!root) return;
  const viewport = root.querySelector('.faculty-viewport');
  const track = root.querySelector('.faculty-track');
  const originals = [...track.children];
  const pause = root.querySelector('[data-faculty-pause]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let stopped = reduced.matches, hovering = false, focused = false, touching = false, visible = false, last = 0, manualUntil = 0;
  originals.forEach(card => { const copy = card.cloneNode(true); copy.setAttribute('aria-hidden','true'); track.append(copy); });
  const span = () => originals[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  const cycle = () => span() * originals.length;
  function updateButton() { pause.setAttribute('aria-pressed',String(stopped)); pause.textContent = stopped ? '자동 넘김 재생' : '자동 넘김 정지'; }
  pause.addEventListener('click',() => { stopped = !stopped; updateButton(); });
  reduced.addEventListener('change',e => { stopped=e.matches;updateButton(); });
  updateButton();
  root.addEventListener('mouseenter',() => hovering=true);
  root.addEventListener('mouseleave',() => hovering=false);
  root.addEventListener('focusin',() => focused=true);
  root.addEventListener('focusout',e => { focused=root.contains(e.relatedTarget); });
  viewport.addEventListener('pointerdown',() => { touching=true; });
  window.addEventListener('pointerup',() => { if(touching) manualUntil=performance.now()+3000;touching=false; });
  window.addEventListener('pointercancel',() => touching=false);
  viewport.addEventListener('wheel',() => manualUntil=performance.now()+3000,{passive:true});
  function move(dir) { manualUntil=performance.now()+3000; if(dir<0 && viewport.scrollLeft<span()) viewport.scrollLeft+=cycle(); viewport.scrollBy({left:dir*span(),behavior:reduced.matches?'instant':'smooth'}); }
  root.querySelector('[data-faculty-prev]').addEventListener('click',() => move(-1));
  root.querySelector('[data-faculty-next]').addEventListener('click',() => move(1));
  viewport.addEventListener('keydown',e => { if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);} });
  new IntersectionObserver(entries => { visible=entries[0].isIntersecting; }).observe(root);
  function tick(now) {
    const delta=Math.min(now-last,50); last=now;
    if(visible && !document.hidden && !stopped && !hovering && !focused && !touching && now> manualUntil) viewport.scrollLeft+=delta*.06;
    if(!touching && now>manualUntil && viewport.scrollLeft>=cycle()) viewport.scrollLeft-=cycle();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
