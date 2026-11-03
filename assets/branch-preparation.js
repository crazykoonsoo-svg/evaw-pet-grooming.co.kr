/* Progressive enhancement: original heading text remains in the HTML. */
(() => {
  const section = document.querySelector('.branch-prep');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!section || motion.matches || !('IntersectionObserver' in window)) return;
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null;
  const split = text => segmenter ? Array.from(segmenter.segment(text), item => item.segment) : Array.from(text);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const heading = entry.target;
      observer.unobserve(heading);
      if (motion.matches) continue;
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const length = nodes.reduce((sum, node) => sum + split(node.nodeValue).length, 0);
      const interval = Math.min(24, 640 / Math.max(length - 1, 1));
      let index = 0;
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        split(node.nodeValue).forEach(char => {
          const span = document.createElement('span');
          span.className = 'bp-type-char';
          span.style.setProperty('--bp-type-delay', `${index++ * interval}ms`);
          span.textContent = char;
          fragment.appendChild(span);
        });
        node.replaceWith(fragment);
      });
      // Restore plain text nodes after the visual effect for clean selection.
      window.setTimeout(() => {
        heading.querySelectorAll('.bp-type-char').forEach(span => span.replaceWith(document.createTextNode(span.textContent)));
        heading.normalize();
      }, index * interval + 400);
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -24px 0px' });
  section.querySelectorAll('.bp-eyebrow, h2, h3, h4').forEach(heading => observer.observe(heading));
})();
