/* Shared by the four reviewed campus pages. No submission or analytics changes. */
(() => {
  const root = document.documentElement;
  const bar = document.getElementById('stickyBar');
  function syncViewport() {
    const viewport = window.visualViewport;
    root.style.setProperty('--consult-viewport-height', `${viewport ? viewport.height : innerHeight}px`);
    root.style.setProperty('--consult-viewport-top', `${viewport ? viewport.offsetTop : 0}px`);
    if (bar) root.style.setProperty('--sticky-bar-space', `${bar.offsetHeight + 16}px`);
  }
  syncViewport();
  window.addEventListener('resize', syncViewport, {passive:true});
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewport, {passive:true});
    window.visualViewport.addEventListener('scroll', syncViewport, {passive:true});
  }
  if (bar && typeof ResizeObserver !== 'undefined') new ResizeObserver(syncViewport).observe(bar);
  const overlay = document.getElementById('modalOverlay');
  let returnFocus;
  const open = window.openModal, close = window.closeModal;
  window.openModal = function () {
    returnFocus = document.activeElement;
    open();
    overlay.querySelector('.modal-sheet').scrollTop = 0;
    overlay.querySelector('.modal-close').focus({preventScroll:true});
  };
  window.closeModal = function () {
    close();
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll:true});
  };
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') {event.preventDefault(); window.closeModal(); return;}
    if (event.key !== 'Tab') return;
    const controls = [...overlay.querySelectorAll('button, input, textarea, select, a[href], [tabindex="0"]')]
      .filter(el => !el.disabled && el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  });
  const error = document.getElementById('form-error');
  error.setAttribute('role','alert');
  new MutationObserver(() => {
    if (error.textContent && error.style.display !== 'none') error.scrollIntoView({block:'nearest'});
  }).observe(error,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['style']});
})();
