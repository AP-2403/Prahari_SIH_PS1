import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, X, MoveHorizontal, CheckCircle2,
  Lightbulb, ShieldCheck, Volume2, VolumeX, RotateCcw,
  Pause, Play
} from 'lucide-react';
import { useDemoTour, TOUR_STEPS } from '../context/DemoTourContext';
import { useLanguage } from '../context/LanguageContext';

// ── Voice Narration Hook ──────────────────────────────────────────────
function useVoiceNarration(stepIndex, isActive) {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load + auto-play new audio whenever step changes
  useEffect(() => {
    if (!isActive) return;

    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const stepNum = String(stepIndex + 1).padStart(2, '0');
    const audio = new Audio();
    const canPlayM4a = audio.canPlayType('audio/mp4') || audio.canPlayType('audio/x-m4a');
    audio.src = canPlayM4a ? `/audio/step-${stepNum}.m4a` : `/audio/step-${stepNum}.mp3`;
    audio.muted = isMuted;
    audioRef.current = audio;

    audio.addEventListener('playing', () => { setIsPlaying(true); setIsSpeaking(true); });
    audio.addEventListener('pause',   () => { setIsPlaying(false); setIsSpeaking(false); });
    audio.addEventListener('ended',   () => { setIsPlaying(false); setIsSpeaking(false); });
    audio.addEventListener('error',   () => {
      // Fallback from m4a to mp3 if needed
      if (audio.src.endsWith('.m4a')) {
        audio.src = `/audio/step-${stepNum}.mp3`;
        audio.play().catch(() => { setIsPlaying(false); setIsSpeaking(false); });
      } else {
        setIsPlaying(false);
        setIsSpeaking(false);
      }
    });

    // Auto-play narration for active step
    audio.play().catch(() => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, isActive]);

  // Mute toggling
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

  const replay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, []);

  const toggleMute = useCallback(() => setIsMuted(m => !m), []);

  return { isMuted, isPlaying, isSpeaking, replay, togglePause, toggleMute };
}

// ── Animated Sound-Wave Bars ──────────────────────────────────────────
function SoundWave({ active }) {
  const bars = [0.5, 1, 0.7, 0.9, 0.6, 1, 0.4, 0.8, 0.5];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 2, height: 18,
    }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: active ? '#0D9488' : '#CBD5E1',
            height: active ? `${Math.round(h * 18)}px` : '4px',
            transition: 'height 0.15s ease',
            animation: active ? `voiceBar${i % 3} ${0.5 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function InteractiveDemoTour() {
  const {
    isActive,
    currentStepIndex,
    currentStep,
    overrideSide,
    isCompleted,
    nextStep,
    prevStep,
    endTour,
    flipSide,
    jumpToStep,
    totalSteps
  } = useDemoTour();

  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [targetRect, setTargetRect] = useState(null);
  const [targetFound, setTargetFound] = useState(false);
  const retryTimerRef = useRef(null);

  // Voice narration
  const { isMuted, isPlaying, isSpeaking, replay, togglePause, toggleMute } =
    useVoiceNarration(currentStepIndex, isActive);

  // Update target rect with padding
  const updateBoundingRect = useCallback(() => {
    if (!currentStep || currentStep.preferredSide === 'center') {
      setTargetRect(null);
      setTargetFound(true);
      return;
    }

    const selector = currentStep.targetSelector;
    const fallback = currentStep.fallbackSelector;
    let el = selector ? document.querySelector(selector) : null;
    if (!el && fallback) {
      el = document.querySelector(fallback);
    }

    if (el) {
      setTargetFound(true);
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetFound(false);
      setTargetRect(null);
    }
  }, [currentStep]);

  // Immediately clear stale target rect when changing step
  useEffect(() => {
    setTargetRect(null);
    setTargetFound(false);
  }, [currentStepIndex]);

  // Poll for element and scroll into view smoothly with proper clearances
  useEffect(() => {
    if (!isActive || !currentStep) return;

    let attempts = 0;
    const maxAttempts = 20;

    function findAndScroll() {
      const selector = currentStep.targetSelector;
      const fallback = currentStep.fallbackSelector;
      let el = selector ? document.querySelector(selector) : null;
      if (!el && fallback) {
        el = document.querySelector(fallback);
      }

      if (el) {
        const vw = window.innerWidth;
        const rect = el.getBoundingClientRect();
        const isWide = rect.width > vw * 0.45;
        const intendedSide = overrideSide || currentStep.preferredSide || (isWide ? 'bottom' : 'left');

        if (intendedSide === 'top') {
          el.style.scrollMarginBottom = '50px';
          el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
          el.style.scrollMarginTop = '78px';
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateBoundingRect();
        const t1 = setTimeout(updateBoundingRect, 100);
        const t2 = setTimeout(updateBoundingRect, 250);
        const t3 = setTimeout(updateBoundingRect, 500);
        const t4 = setTimeout(updateBoundingRect, 800);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      } else if (attempts < maxAttempts) {
        attempts++;
        retryTimerRef.current = setTimeout(findAndScroll, 120);
      }
    }

    findAndScroll();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [isActive, currentStep, overrideSide, updateBoundingRect]);

  // Listen for window resize, scroll, and content changes
  useEffect(() => {
    if (!isActive) return;

    window.addEventListener('resize', updateBoundingRect);
    window.addEventListener('scroll', updateBoundingRect, true);

    const observer = new MutationObserver(updateBoundingRect);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updateBoundingRect);
      window.removeEventListener('scroll', updateBoundingRect, true);
      observer.disconnect();
    };
  }, [isActive, updateBoundingRect]);

  if (!isActive || !currentStep) return null;

  // ── Final Celebration / Recording Cut Screen (Step 19) ────────────────────
  if (isCompleted || currentStep.preferredSide === 'center') {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 24, 38, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '36px 32px',
          maxWidth: 620,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5)',
          border: '2px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Decorative background glow */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(155, 255, 238, 0.4) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Celebration badge */}
          <div style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 10px 30px rgba(13, 148, 136, 0.4)'
          }}>
            <CheckCircle2 size={38} color="#FFFFFF" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px' }}>
            {currentStep.title[lang] || currentStep.title.en}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 16px', lineHeight: 1.5 }}>
            {currentStep.details[lang] || currentStep.details.en}
          </p>

          {/* Data Flow Complete Summary Box */}
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            textAlign: 'left',
            marginBottom: 20,
            fontSize: '0.78rem',
            color: 'var(--navy)',
            lineHeight: 1.45
          }}>
            <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} color="#0D9488" />
              <span>{lang === 'hi' ? 'पूर्ण डेटा जीवनचक्र सत्यापित:' : 'Full Data Lifecycle Verified:'}</span>
            </div>
            <div>
              {currentStep.dataFlow[lang] || currentStep.dataFlow.en}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => jumpToStep(0)}
              className="btn btn-ghost"
              style={{ padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}
            >
              🔄 {lang === 'hi' ? 'पुनः प्रारंभ करें' : 'Replay Tour'}
            </button>
            <button
              onClick={endTour}
              className="btn btn-primary"
              style={{ padding: '10px 24px', borderRadius: 10, fontWeight: 700, background: 'var(--navy)' }}
            >
              ✓ {lang === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Return to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Calculate 4-Quadrant Curtain Coordinates ──
  const PAD = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_WIDTH = Math.min(390, vw - 32);

  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;
  let width = 0;
  let height = 0;

  if (targetRect) {
    top = Math.max(0, targetRect.top - PAD);
    bottom = Math.min(vh, targetRect.bottom + PAD);
    left = Math.max(0, targetRect.left - PAD);
    right = Math.min(vw, targetRect.right + PAD);
    width = Math.max(0, right - left);
    height = Math.max(0, bottom - top);
  }

  // Available space around target element
  const spaceTop = top;
  const spaceBottom = vh - bottom;
  const spaceLeft = left;
  const spaceRight = vw - right;

  // Minimum clearance needed to safely dock on left or right without colliding
  // Adapts down to 300px so cards can dock alongside panels on laptops & desktop screens
  const canFitLeft = spaceLeft >= 300;
  const canFitRight = spaceRight >= 300;

  // Determine computedSide
  let computedSide = currentStep.preferredSide || 'bottom';

  if (overrideSide) {
    if (overrideSide === 'left' && !canFitLeft) {
      computedSide = spaceBottom >= 260 ? 'bottom' : (canFitRight ? 'right' : 'top');
    } else if (overrideSide === 'right' && !canFitRight) {
      computedSide = spaceBottom >= 260 ? 'bottom' : (canFitLeft ? 'left' : 'top');
    } else {
      computedSide = overrideSide;
    }
  } else if (targetRect) {
    if (currentStep.preferredSide === 'right' && canFitRight) {
      computedSide = 'right';
    } else if (currentStep.preferredSide === 'left' && canFitLeft) {
      computedSide = 'left';
    } else if (currentStep.preferredSide === 'top' && (spaceTop >= 220 || spaceTop > spaceBottom)) {
      computedSide = 'top';
    } else if (currentStep.preferredSide === 'bottom' && spaceBottom >= 260) {
      computedSide = 'bottom';
    } else {
      // Automatic fallback if preferred side doesn't have sufficient room
      if (canFitRight && (!canFitLeft || spaceRight >= spaceLeft)) {
        computedSide = 'right';
      } else if (canFitLeft) {
        computedSide = 'left';
      } else if (spaceTop >= 240 || spaceTop > spaceBottom) {
        computedSide = 'top';
      } else {
        computedSide = 'bottom';
      }
    }
  }

  // ── Compute Collision-Free Docking Coordinates (Strict Mathematical Zero-Overlap Guarantee) ──
  let cardStyle = {
    position: 'fixed',
    zIndex: 9999,
    width: `${CARD_WIDTH}px`,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (targetRect) {
    if (computedSide === 'bottom') {
      // Strictly outside and beneath target spotlight box: bottom + 12px
      cardStyle.top = `${bottom + 12}px`;
      cardStyle.bottom = 'auto';
      const availableH = Math.max(180, vh - bottom - 24);
      cardStyle.maxHeight = `${availableH}px`;
      const desiredLeft = Math.max(16, Math.min(left, vw - CARD_WIDTH - 20));
      cardStyle.left = `${desiredLeft}px`;
      cardStyle.right = 'auto';

    } else if (computedSide === 'top') {
      // Strictly outside and above target spotlight box: top - 12px
      cardStyle.bottom = `${vh - top + 12}px`;
      cardStyle.top = 'auto';
      const availableH = Math.max(180, top - 24);
      cardStyle.maxHeight = `${availableH}px`;
      const desiredLeft = Math.max(16, Math.min(left, vw - CARD_WIDTH - 20));
      cardStyle.left = `${desiredLeft}px`;
      cardStyle.right = 'auto';

    } else if (computedSide === 'right') {
      // Strictly to the right of target spotlight box: right + 12px
      cardStyle.left = `${right + 12}px`;
      cardStyle.right = 'auto';
      const availableW = Math.max(280, Math.min(CARD_WIDTH, vw - right - 24));
      cardStyle.width = `${availableW}px`;
      cardStyle.maxWidth = `${availableW}px`;
      const maxCardH = Math.min(560, vh - 96);
      const idealTop = Math.max(78, Math.min(top, vh - maxCardH - 16));
      cardStyle.top = `${idealTop}px`;
      cardStyle.bottom = 'auto';
      cardStyle.maxHeight = `${vh - idealTop - 16}px`;

    } else { // 'left'
      // Strictly to the left of target spotlight box: left - 12px
      cardStyle.right = `${vw - left + 12}px`;
      cardStyle.left = 'auto';
      const availableW = Math.max(280, Math.min(CARD_WIDTH, left - 24));
      cardStyle.width = `${availableW}px`;
      cardStyle.maxWidth = `${availableW}px`;
      const maxCardH = Math.min(560, vh - 96);
      const idealTop = Math.max(78, Math.min(top, vh - maxCardH - 16));
      cardStyle.top = `${idealTop}px`;
      cardStyle.bottom = 'auto';
      cardStyle.maxHeight = `${vh - idealTop - 16}px`;
    }
  } else {
    // Fallback if element not rendered yet
    cardStyle.right = '24px';
    cardStyle.left = 'auto';
    cardStyle.top = '76px';
    cardStyle.bottom = 'auto';
    cardStyle.maxHeight = `${vh - 96}px`;
  }

  return (
    <>
      {/* ── 4 Distinct Backdrop Curtains (Center hole is 100% uncovered & interactive) ── */}
      {targetRect && (
        <>
          {/* Top Curtain */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: `${top}px`,
              background: 'rgba(0, 24, 38, 0.78)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 9990,
              pointerEvents: 'auto',
            }}
          />

          {/* Bottom Curtain */}
          <div
            style={{
              position: 'fixed',
              top: `${bottom}px`,
              left: 0,
              width: '100vw',
              height: `${Math.max(0, vh - bottom)}px`,
              background: 'rgba(0, 24, 38, 0.78)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 9990,
              pointerEvents: 'auto',
            }}
          />

          {/* Left Curtain */}
          <div
            style={{
              position: 'fixed',
              top: `${top}px`,
              left: 0,
              width: `${left}px`,
              height: `${height}px`,
              background: 'rgba(0, 24, 38, 0.78)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 9990,
              pointerEvents: 'auto',
            }}
          />

          {/* Right Curtain */}
          <div
            style={{
              position: 'fixed',
              top: `${top}px`,
              left: `${right}px`,
              width: `${Math.max(0, vw - right)}px`,
              height: `${height}px`,
              background: 'rgba(0, 24, 38, 0.78)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 9990,
              pointerEvents: 'auto',
            }}
          />

          {/* ── Illuminated Glowing Pulse Border — pulses brighter while voice is playing ── */}
          <div
            style={{
              position: 'fixed',
              top: `${top}px`,
              left: `${left}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: isSpeaking ? '2.5px solid #0D9488' : '2.5px solid #F59E0B',
              borderRadius: '14px',
              boxShadow: isSpeaking
                ? '0 0 0 4px rgba(13, 148, 136, 0.3), 0 0 45px rgba(13, 148, 136, 0.7), inset 0 0 24px rgba(13, 148, 136, 0.12)'
                : '0 0 0 3px rgba(245, 158, 11, 0.25), 0 0 35px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.1)',
              zIndex: 9992,
              pointerEvents: 'none',
              transition: 'all 0.3s ease-out'
            }}
          >
            {/* Focus pill — shows voice status when playing, spotlight label otherwise */}
            <div style={{
              position: 'absolute',
              top: '-16px',
              left: '16px',
              background: isSpeaking
                ? 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)'
                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isSpeaking
                ? '0 2px 10px rgba(13, 148, 136, 0.6)'
                : '0 2px 10px rgba(245, 158, 11, 0.5)',
              transition: 'background 0.3s ease'
            }}>
              {isSpeaking ? (
                <>
                  <SoundWave active={true} />
                  <span>NARRATING</span>
                </>
              ) : (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF', animation: 'ping 1.2s infinite' }} />
                  <span>LIVE SPOTLIGHT · INTERACTIVE</span>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Collision-Free Tour Guidance Card (Guaranteed Viewport Containment) ── */}
      <div style={cardStyle}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(155, 222, 255, 0.75)',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0, 24, 38, 0.4)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: cardStyle.maxHeight,
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          {/* ── 1. Fixed Card Header ── */}
          <div style={{
            padding: '12px 18px 9px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
            background: '#FFFFFF',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  background: 'linear-gradient(135deg, var(--navy) 0%, #004566 100%)',
                  color: 'var(--secondary)',
                  padding: '2px 8px',
                  borderRadius: 14,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}>
                  STEP {currentStep.step} / {totalSteps}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {currentStep.route}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Voice: Replay */}
                <button
                  type="button"
                  onClick={replay}
                  title="Replay narration"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--navy)', padding: 3, display: 'flex',
                    alignItems: 'center', borderRadius: 6
                  }}
                >
                  <RotateCcw size={13} />
                </button>

                {/* Voice: Play/Pause */}
                <button
                  type="button"
                  onClick={togglePause}
                  title={isPlaying ? 'Pause narration' : 'Play narration'}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: isPlaying ? '#0D9488' : 'var(--navy)', padding: 3,
                    display: 'flex', alignItems: 'center', borderRadius: 6
                  }}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>

                {/* Voice: Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute narration' : 'Mute narration'}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: isMuted ? '#EF4444' : 'var(--navy)', padding: 3,
                    display: 'flex', alignItems: 'center', borderRadius: 6
                  }}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>

                {/* Flip Side */}
                <button
                  type="button"
                  onClick={flipSide}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: 6, gap: 3, color: 'var(--navy)' }}
                  title="Flip card docking position (F)"
                >
                  <MoveHorizontal size={12} />
                  <span>{lang === 'hi' ? 'पक्ष' : 'Flip'}</span>
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={endTour}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 3,
                    display: 'flex', alignItems: 'center', borderRadius: 6
                  }}
                  title="Exit Demo Tour (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Title row with animated sound wave */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--navy)',
                lineHeight: 1.25,
                flex: 1
              }}>
                {currentStep.title[lang] || currentStep.title.en}
              </h3>
              <SoundWave active={isSpeaking && !isMuted} />
            </div>
          </div>

          {/* ── 2. Scrollable Body with Slim Scrollbar ── */}
          <div style={{
            padding: '12px 18px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {/* Action Callout Box */}
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1px solid #FCD34D',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              flexShrink: 0
            }}>
              <Lightbulb size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', lineHeight: 1.35 }}>
                {currentStep.action[lang] || currentStep.action.en}
              </div>
            </div>

            {/* Data Flow Pipeline Box */}
            {currentStep.dataFlow && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 48, 71, 0.04) 0%, rgba(155, 222, 255, 0.12) 100%)',
                border: '1px solid rgba(155, 222, 255, 0.75)',
                borderRadius: 8,
                padding: '8px 12px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <span style={{
                    background: 'var(--navy)',
                    color: 'var(--secondary)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    {lang === 'hi' ? 'डेटा प्रवाह' : 'DATA FLOW'}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--navy)' }}>
                    {lang === 'hi' ? 'जीवनचक्र एवं इंजन' : 'Lifecycle & Processing Engine'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {currentStep.dataFlow[lang] || currentStep.dataFlow.en}
                </div>
              </div>
            )}

            {/* Metric / Graph Meaning Box */}
            {currentStep.metricExplanation && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(20, 184, 166, 0.09) 100%)',
                border: '1px solid rgba(20, 184, 166, 0.35)',
                borderRadius: 8,
                padding: '8px 12px',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <span style={{
                    background: '#0D9488',
                    color: '#FFFFFF',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em'
                  }}>
                    {lang === 'hi' ? 'ग्राफ एवं संकेतक' : 'GRAPH & METRIC MEANING'}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0F766E' }}>
                    {lang === 'hi' ? 'संख्या एवं चार्ट' : 'Values & Visual Interpretation'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#134E4A', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {currentStep.metricExplanation[lang] || currentStep.metricExplanation.en}
                </div>
              </div>
            )}

            {/* Additional Details */}
            {currentStep.details && (
              <p style={{
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.45,
                flexShrink: 0
              }}>
                {currentStep.details[lang] || currentStep.details.en}
              </p>
            )}

            {/* Live Action Trigger Button */}
            {currentStep.liveAction && (
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => currentStep.liveAction.execute(navigate)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 750,
                    boxShadow: '0 2px 8px rgba(155, 255, 238, 0.4)'
                  }}
                >
                  {currentStep.liveAction.label[lang] || currentStep.liveAction.label.en}
                </button>
              </div>
            )}
          </div>

          {/* ── 3. Fixed Card Footer (ALWAYS ON SCREEN, NEVER CUT OFF!) ── */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--border-subtle)',
            flexShrink: 0,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>[← / →]</span> {lang === 'hi' ? 'नेविगेट' : 'Navigate'}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  opacity: currentStepIndex === 0 ? 0.4 : 1,
                  fontSize: '0.78rem'
                }}
              >
                <ArrowLeft size={13} />
                <span>{lang === 'hi' ? 'पिछला' : 'Back'}</span>
              </button>

              <button
                type="button"
                onClick={nextStep}
                className="btn btn-primary btn-sm"
                style={{
                  padding: '5px 16px',
                  borderRadius: 6,
                  background: 'var(--navy)',
                  color: 'var(--secondary)',
                  fontWeight: 700,
                  fontSize: '0.78rem'
                }}
              >
                <span>{currentStepIndex === totalSteps - 1 ? (lang === 'hi' ? 'पूर्ण करें' : 'Finish') : (lang === 'hi' ? 'अगला' : 'Next')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
