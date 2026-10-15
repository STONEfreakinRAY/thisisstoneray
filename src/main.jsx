import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { albums, tracks, videos, profile } from './content';
import './styles.css';
import './creative-motion.css';
import HeroTitle from './HeroTitle';
import DarkVeil from './DarkVeil';
import usePortfolioMotion from './usePortfolioMotion';
import InlineVideo from './InlineVideo';
import './media-interactions.css';

const Play = ({ paused = true }) => <span aria-hidden="true" className={paused ? 'play-icon' : 'pause-icon'} />;
const time = (seconds) => `${Math.floor((seconds || 0) / 60)}:${String(Math.floor((seconds || 0) % 60)).padStart(2, '0')}`;

function App() {
  usePortfolioMotion();
  const [modal, setModal] = useState(null);
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notice, setNotice] = useState('');
  const audio = useRef(null);
  const dialog = useRef(null);
  const lastFocus = useRef(null);
  const pendingSeek = useRef(null);

  useEffect(() => {
    const exclusivePlayback = event => {
      if (!(event.target instanceof HTMLMediaElement)) return;
      document.querySelectorAll('audio,video').forEach(item => {
        if (item !== event.target) item.pause();
      });
    };
    document.addEventListener('play', exclusivePlayback, true);
    return () => document.removeEventListener('play', exclusivePlayback, true);
  }, []);

  function seekTrack(track, position) {
    if (active !== track.id) {
      audio.current.pause();
      pendingSeek.current = position;
      setActive(track.id);
      setDuration(track.duration);
      audio.current.src = track.src;
      audio.current.load();
    } else if (audio.current.readyState >= 1) {
      audio.current.currentTime = position;
    } else pendingSeek.current = position;
    setProgress(position);
  }


  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!modal) return;
    lastFocus.current = document.activeElement;
    dialog.current.showModal();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.current.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = oldOverflow;
      lastFocus.current?.focus();
    };
  }, [modal]);

  function openModal(data) {
    audio.current?.pause();
    setModal(data);
  }

  async function toggleTrack(track) {
    if (!track.src) {
      setNotice(`${track.title}：音频即将加入，敬请期待。`);
      return;
    }
    if (active === track.id && !audio.current.paused) {
      audio.current.pause();
      return;
    }
    if (active !== track.id) {
      setActive(track.id);
      setProgress(0);
      pendingSeek.current = null;
      setDuration(track.duration);
      audio.current.src = track.src;
    }
    try { await audio.current.play(); }
    catch { setNotice('暂时无法播放这首音乐，请检查音频文件后重试。'); }
  }

  return <>
    <div className="ambient-background" aria-hidden="true"><DarkVeil color="#ff1212" speed={0.35} scale={2.5} flow={1.1} brightness={0.65} sheen={0.15} glow={0.25} grain={0} quality={0.35} dpr={1} mouseInteraction={false} opacity={0.65} /></div>
    <section className="home-cover" id="home" aria-label="STONE RAY">
      <img className="home-cover-image" src={profile.portrait} alt="STONE RAY 红色颗粒背景肖像" fetchPriority="high" />
      <HeroTitle>{profile.name}</HeroTitle>
    </section>

    <main>
      <section className="albums-section section" id="albums"><div className="shell">
        <SectionHeading english="ALBUM" title="已发行专辑" />
        <div className="album-grid">{albums.map(album => <article className="album" key={album.id}>
          <button className="album-cover" onClick={() => openModal({ type: 'album', ...album })} aria-label={`查看${album.title}`}><img src={album.cover} alt={`${album.title} 专辑封面`} loading="lazy" /></button>
          <div className="album-info"><h3>{album.title}</h3></div>
        </article>)}</div>
      </div></section>

      <section className="tracks-section section" id="tracks"><div className="shell tracks-layout"><div className="tracks-intro"><SectionHeading title="音乐节选" english="HIGHLIGHTS" /></div>
        <div className="track-list">{tracks.map(track => <article className={`track ${active === track.id && playing ? 'is-playing' : ''}`} key={track.id}>
          <div className="track-main"><span className="track-number">{track.id}</span><button className="play-button" onClick={() => toggleTrack(track)} aria-label={`${active === track.id && playing ? '暂停' : '播放'}${track.title}`}><Play paused={!(active === track.id && playing)} /></button><div className="track-title"><h3>{track.title}</h3><span className="track-credits">{track.credits}</span></div><span className="track-duration">{active === track.id ? time(duration || track.duration) : time(track.duration)}</span></div>
          <div className="track-progress"><span>{active === track.id ? time(progress) : '0:00'}</span><input aria-label={`${track.title}播放进度`} type="range" min="0" max={active === track.id ? duration || track.duration : track.duration} step="0.1" value={active === track.id ? progress : 0} onChange={event => seekTrack(track, Number(event.target.value))} /><span>{time(active === track.id ? duration || track.duration : track.duration)}</span></div>
        </article>)}</div>
      </div></section>

      <section className="visuals-section section" id="visuals"><div className="shell"><SectionHeading english="VISUALS" title="视觉" />
        <div className="video-grid">{videos.map(video => <InlineVideo video={video} key={video.id} />)}</div>
      </div></section>

      <section className="finale-section" id="about" aria-label="THIS IS STONE RAY"><div className="finale-labels shell"><span>MUSIC</span><span>VISUAL</span></div><HeroTitle finale>THIS IS STONE RAY</HeroTitle></section>
    </main>
    <audio ref={audio} preload="metadata" onLoadedMetadata={() => {
      if (pendingSeek.current !== null) {
        audio.current.currentTime = Math.min(pendingSeek.current, audio.current.duration);
        setProgress(audio.current.currentTime);
        pendingSeek.current = null;
      }
    }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={() => setProgress(audio.current.currentTime)} onDurationChange={() => setDuration(Number.isFinite(audio.current.duration) ? audio.current.duration : 0)} onEnded={() => setPlaying(false)} onError={() => { setPlaying(false); setNotice('音频加载失败，请检查文件地址或格式。'); }} />
    <div className={`toast ${notice ? 'visible' : ''}`} role="status">{notice}</div>
    {modal && <dialog ref={dialog} className="media-dialog" aria-labelledby="dialog-title" onCancel={() => setModal(null)} onClick={event => { if (event.target === dialog.current) setModal(null); }}><div className="dialog-body"><div className="dialog-heading"><span className="eyebrow">{modal.type === 'album' ? 'ORIGINAL ALBUM' : 'MUSIC & VISUALS'}</span><button autoFocus className="close-button" onClick={() => setModal(null)} aria-label="关闭弹窗">×</button></div><h2 id="dialog-title">{modal.title}</h2>
      <div className="album-dialog-content"><img src={modal.cover} alt={modal.title} /><div><a className="solid-link" href={modal.neteaseUrl} target="_blank" rel="noopener noreferrer">在网易云音乐收听 ↗</a></div></div>
    </div></dialog>}
  </>;
}

function SectionHeading({ english, title }) { return <div className="section-heading"><div className="heading-reveal"><h2>{title}</h2></div><p>{english}</p></div>; }

createRoot(document.getElementById('root')).render(<App />);
