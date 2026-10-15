import React, { useEffect, useRef, useState } from 'react';

function Icon({ type }) {
  const paths = {
    play: <path d="m8 5 11 7-11 7Z" fill="currentColor" />,
    pause: <><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" /></>,
    volume: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 8q6 4 0 8M18 5q9 7 0 14" /></>,
    mute: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="m17 9 5 6m0-6-5 6" /></>,
    expand: <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" />,
    collapse: <path d="M4 9h5V4m6 0v5h5M9 20v-5H4m11 5v-5h5" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function InlineVideo({ video }) {
  const media = useRef(null), stage = useRef(null), slot = useRef(null);
  const animation = useRef(null), expandedRef = useRef(false), busy = useRef(false);
  const previousFocus = useRef(null), oldOverflow = useRef('');
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const [progressVisible, setProgressVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const hideTimer = useRef(null), dragging = useRef(false);

  function showProgress() {
    clearTimeout(hideTimer.current);
    setProgressVisible(true);
    if (!dragging.current) hideTimer.current = setTimeout(() => setProgressVisible(false), 2000);
  }

  function togglePlayback() {
    showProgress();
    if (media.current.paused) play();
    else media.current.pause();
  }

  useEffect(() => {
    stage.current.open = true;
    media.current.volume = 0.8;
    return () => {
      animation.current?.cancel();
      clearTimeout(hideTimer.current);
      if (expandedRef.current) document.body.style.overflow = oldOverflow.current;
    };
  }, []);

  async function play() {
    try { await media.current.play(); setError(''); }
    catch { setError('暂时无法播放，请重试。'); }
  }

  function toggleExpanded() {
    if (busy.current) return;
    busy.current = true;
    const el = stage.current;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduce ? 0 : 650;
    if (!expandedRef.current) {
      const from = el.getBoundingClientRect();
      previousFocus.current = document.activeElement;
      oldOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      el.close();
      el.showModal();
      expandedRef.current = true;
      setExpanded(true);
      const to = el.getBoundingClientRect();
      animation.current = el.animate([
        { transform: `translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})` },
        { transform: 'translate(0,0) scale(1,1)' },
      ], { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
      animation.current.onfinish = () => { busy.current = false; };
    } else {
      const from = el.getBoundingClientRect();
      const to = slot.current.getBoundingClientRect();
      el.classList.add('is-closing');
      animation.current = el.animate([
        { transform: 'translate(0,0) scale(1,1)' },
        { transform: `translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width},${to.height/from.height})` },
      ], { duration, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      animation.current.onfinish = () => {
        el.close(); el.open = true;
        animation.current.cancel();
        el.classList.remove('is-closing');
        document.body.style.overflow = oldOverflow.current;
        expandedRef.current = false; setExpanded(false); busy.current = false;
        previousFocus.current?.focus({ preventScroll: true });
      };
    }
  }

  return <article className="video-card">
    <div className="inline-video-slot" ref={slot}>
      <dialog className="inline-video-stage" ref={stage} aria-label={video.title}
        onCancel={event => { event.preventDefault(); if (expandedRef.current) toggleExpanded(); }}
        onClick={event => {
          if (event.target !== stage.current || !expandedRef.current) return;
          const bounds = stage.current.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) toggleExpanded();
        }}>
        <video ref={media} src={video.src} poster={video.cover} preload="none" playsInline
          onPlay={() => { setPlaying(true); showProgress(); }} onPause={() => { setPlaying(false); showProgress(); }} onEnded={() => { setPlaying(false); showProgress(); }}
          onTimeUpdate={() => setCurrentTime(media.current.currentTime)}
          onLoadedMetadata={() => setDuration(media.current.duration)}
          onError={() => setError('视频加载失败，请检查文件或刷新后重试。')}
          onClick={togglePlayback} />
        {error && <p className="inline-video-error" role="status">{error}</p>}
        <div className="inline-video-controls">
          <button aria-label={`${playing ? '暂停' : '播放'}${video.title}`} aria-pressed={playing} onClick={togglePlayback}><Icon type={playing ? 'pause' : 'play'} /></button>
          <div className="volume-control">
            <div className="volume-slider"><input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
              aria-label={`${video.title}音量`} aria-orientation="vertical"
              onChange={event => { const value = Number(event.target.value); setVolume(value); setMuted(value === 0); media.current.volume = value; media.current.muted = value === 0; }} /></div>
            <button aria-label={`${muted ? '取消静音' : '静音'}${video.title}`} aria-pressed={muted}
              onClick={() => { media.current.muted = !muted; setMuted(!muted); }}><Icon type={muted ? 'mute' : 'volume'} /></button>
          </div>
          <button aria-label={`${expanded ? '还原' : '放大'}${video.title}`} aria-expanded={expanded} onClick={toggleExpanded}><Icon type={expanded ? 'collapse' : 'expand'} /></button>
        </div>
        <div className={`video-seek-clip ${progressVisible ? 'seek-visible' : ''}`}>
          <div className="video-seek-bar">
            <input type="range" min="0" max={duration || 1} step="0.05" value={Math.min(currentTime, duration || 1)}
              aria-label={`${video.title}视频进度`} tabIndex={progressVisible ? 0 : -1}
              onPointerDown={event => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); showProgress(); }}
              onPointerUp={() => { dragging.current = false; showProgress(); }}
              onPointerCancel={() => { dragging.current = false; showProgress(); }}
              onKeyDown={showProgress}
              onChange={event => { media.current.currentTime = Number(event.target.value); setCurrentTime(Number(event.target.value)); showProgress(); }} />
          </div>
        </div>
      </dialog>
    </div>
    <div className="video-info"><h3>{video.title}</h3></div>
  </article>;
}
