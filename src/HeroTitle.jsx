import React, { useEffect, useRef, useState } from 'react';
import FuzzyText from './FuzzyText';

export default function HeroTitle({ children, finale = false }) {
  const titleRef = useRef(null);
  const [fontSize, setFontSize] = useState(120);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const title = titleRef.current;
    const hero = title.closest('section');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const update = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const distance = Math.max(0, -bounds.top);
      const progress = Math.min(1, distance / (bounds.height * 0.65));
      // The finale must fade while the ENTIRE title is already inside the viewport.
      // Cancel its normal document movement, then scrub from 82% to 50% of the
      // viewport over the last 50vh of scrolling. Derive every frame from scroll
      // position so reversing direction immediately reverses both properties.
      const viewport = window.innerHeight;
      const end = Math.max(0, document.documentElement.scrollHeight - viewport);
      const travel = Math.min(viewport * 0.5, end);
      const reveal = travel > 0 ? Math.max(0, Math.min(1, (window.scrollY - end + travel) / travel)) : 1;
      const opacity = finale ? reveal * reveal * (3 - 2 * reveal) : 1 - progress;
      const offset = finale
        ? (viewport - bounds.height) / 2 - bounds.top + (1 - reveal) * viewport * 0.32
        : distance * 1.35;
      title.style.transform = preference.matches ? 'none' : `translate3d(0, ${offset}px, 0)`;
      title.style.opacity = preference.matches ? '1' : String(opacity);
      title.style.visibility = !preference.matches && opacity <= 0 ? 'hidden' : 'visible';
      setActive(!document.hidden && bounds.bottom > 0 && bounds.top < window.innerHeight && opacity > 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = () => {
      setFontSize(parseFloat(getComputedStyle(title).fontSize));
      schedule();
    };
    const motionChange = () => {
      setReducedMotion(preference.matches);
      schedule();
    };
    resize();
    motionChange();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', schedule);
    preference.addEventListener('change', motionChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', schedule);
      preference.removeEventListener('change', motionChange);
    };
  }, [finale]);

  const Heading = finale ? 'h2' : 'h1';

  return <Heading className={`home-cover-title${finale ? ' finale-title' : ''}`} ref={titleRef} aria-label={children}>
    {reducedMotion ? children : <FuzzyText
      fontSize={fontSize}
      fontWeight={900}
      color="#fff"
      baseIntensity={0.13}
      hoverIntensity={0.18}
      enableHover
      active={active}
      fps={30}
      letterSpacing={fontSize * -0.02}
      className="hero-fuzzy-text"
    >{children}</FuzzyText>}
  </Heading>;
}
