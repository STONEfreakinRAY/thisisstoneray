import { useEffect } from 'react';

// Position-derived, reversible motion. No timelines, stagger, clip reveal or image parallax.
export default function usePortfolioMotion() {
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const nodes = Array.from(document.querySelectorAll('.section-heading,.album,.track,.video-card,.finale-labels'));
    const hero = document.querySelector('.home-cover');
    const image = hero.querySelector('img');
    let frame = 0;
    const clamp = value => Math.min(1, Math.max(0, value));
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      nodes.forEach(node => {
        // offsetTop excludes the transform we write, preventing scroll/transform feedback.
        let top = 0, ancestor = node;
        while (ancestor) { top += ancestor.offsetTop; ancestor = ancestor.offsetParent; }
        top -= window.scrollY;
        const enter = clamp((vh - top) / (vh * 0.36));
        const exit = clamp((top + node.offsetHeight) / (vh * 0.24));
        const opacity = Math.min(enter, exit);
        const y = (1 - enter) * 110 - (1 - exit) * 70;
        node.style.transform = preference.matches ? 'none' : `translate3d(0, ${y}px, 0)`;
        node.style.opacity = preference.matches ? '1' : String(opacity);
      });
      const progress = clamp(Math.max(0, -hero.getBoundingClientRect().top) / hero.offsetHeight);
      image.style.opacity = preference.matches ? '1' : String(1-progress*progress*(3-2*progress));
      image.style.transform = 'none';
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.querySelector('main'));
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    preference.addEventListener('change',schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
      preference.removeEventListener('change',schedule);
      nodes.forEach(node => { node.style.transform=''; node.style.opacity=''; });
      image.style.opacity=''; image.style.transform='';
    };
  }, []);
}
