/**
 * WalkthroughOverlay v4 — pointer-events: none on parent, clicks pass through to target
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useWalkthrough } from '../contexts/WalkthroughContext'
import { useAuth } from '../contexts/AuthContext'
import { X, Sparkles, Rocket, ArrowRight } from 'lucide-react'

const WalkthroughOverlay = () => {
  const { active, currentStep, stepIndex, totalSteps, next, back, skip } = useWalkthrough()
  const { user } = useAuth()
  const [targetRect, setTargetRect] = useState(null)
  const [visible, setVisible] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const firstName = (user?.name || 'there').split(' ')[0]

  const measureTarget = useCallback(() => {
    if (!currentStep?.target) { setTargetRect(null); return }
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => setTargetRect(el.getBoundingClientRect()), 400)
        }
      } else { setTargetRect(null) }
    }, 600)
    return () => clearTimeout(timer)
  }, [currentStep])

  useEffect(() => { const c = measureTarget(); return c }, [measureTarget, stepIndex])
  useEffect(() => { setTaskDone(false); setTransitioning(true); const t = setTimeout(() => setTransitioning(false), 350); return () => clearTimeout(t) }, [stepIndex])

  // Listen for clicks ANYWHERE on page — check if it was inside target area
  useEffect(() => {
    if (!active || !currentStep?.interactive || taskDone) return
    const handler = (e) => {
      if (!targetRect) return
      const x = e.clientX, y = e.clientY
      const pad = 12
      if (x >= targetRect.left - pad && x <= targetRect.right + pad &&
          y >= targetRect.top - pad && y <= targetRect.bottom + pad) {
        setTaskDone(true)
        setTimeout(() => next(), 1000)
      }
    }
    const t = setTimeout(() => window.addEventListener('click', handler), 300)
    return () => { clearTimeout(t); window.removeEventListener('click', handler) }
  }, [active, currentStep, targetRect, taskDone, next])

  useEffect(() => { if (active) setTimeout(() => setVisible(true), 50); else setVisible(false) }, [active])
  useEffect(() => { const h = () => measureTarget(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [measureTarget])

  if (!active || !currentStep) return null

  const isModal = currentStep.type === 'modal'
  const isComplete = currentStep.id === 'complete'
  const isWelcome = currentStep.id === 'welcome'
  const isInteractive = currentStep.interactive && !taskDone
  const bodyText = (currentStep.body || '').replace(/\{firstName\}/g, firstName)
  const taskText = (currentStep.task || '').replace(/\{firstName\}/g, firstName)

  // Bubble position
  const getBubblePos = () => {
    if (!targetRect || isModal) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    const bw = 460
    const pos = currentStep.position || 'bottom'
    let top, left
    if (pos === 'bottom') { top = targetRect.bottom + 24; left = targetRect.left + targetRect.width / 2 - bw / 2 }
    else if (pos === 'top') { top = targetRect.top - 320; left = targetRect.left + targetRect.width / 2 - bw / 2 }
    else if (pos === 'right') { top = targetRect.top; left = targetRect.right + 24 }
    else { top = targetRect.top; left = targetRect.left - bw - 24 }
    left = Math.max(16, Math.min(left, window.innerWidth - bw - 16))
    top = Math.max(16, Math.min(top, window.innerHeight - 350))
    return { top: `${top}px`, left: `${left}px`, transform: 'none' }
  }

  // Hand pointer position
  const getPointerPos = () => {
    if (!targetRect || isModal) return null
    return {
      position: 'fixed',
      left: targetRect.left + targetRect.width / 2 + 30,
      top: targetRect.top + targetRect.height / 2 - 30,
      zIndex: 10001,
      pointerEvents: 'none',
      animation: 'pointer-bounce 1.2s ease-in-out infinite',
    }
  }

  return (
    <>
      {/* 
        CRITICAL: This entire overlay uses pointer-events: none on the parent.
        Only the backdrop panels, bubble, and skip button have pointer-events: auto.
        This means clicks pass THROUGH to the real page elements underneath.
      */}
      <div className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ pointerEvents: 'none' }}>

        {/* Backdrop — 4 panels that DON'T cover the target */}
        {targetRect && !isModal ? (
          <>
            <div style={{ pointerEvents: 'auto', position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, targetRect.top - 10), background: 'rgba(0,0,0,0.6)' }} />
            <div style={{ pointerEvents: 'auto', position: 'fixed', top: targetRect.bottom + 10, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)' }} />
            <div style={{ pointerEvents: 'auto', position: 'fixed', top: targetRect.top - 10, left: 0, width: Math.max(0, targetRect.left - 10), height: targetRect.height + 20, background: 'rgba(0,0,0,0.6)' }} />
            <div style={{ pointerEvents: 'auto', position: 'fixed', top: targetRect.top - 10, left: targetRect.right + 10, right: 0, height: targetRect.height + 20, background: 'rgba(0,0,0,0.6)' }} />
          </>
        ) : (
          <div style={{ pointerEvents: 'auto', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
        )}

        {/* Gold border ring around target */}
        {targetRect && !isModal && (
          <div style={{
            position: 'fixed', pointerEvents: 'none',
            top: targetRect.top - 12, left: targetRect.left - 12,
            width: targetRect.width + 24, height: targetRect.height + 24,
            border: '3px solid #C9A84C', borderRadius: 16,
            boxShadow: '0 0 40px rgba(201,168,76,0.35)',
            animation: 'pulse-border 2s ease-in-out infinite',
            zIndex: 10000,
          }} />
        )}

        {/* Hand pointer cursor */}
        {getPointerPos() && (
          <div style={getPointerPos()}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <g filter="url(#ptr-glow)">
                <path d="M16 6L16 40L24 32L32 48L38 45L30 29L40 29Z" fill="#C9A84C" stroke="#111" strokeWidth="2" strokeLinejoin="round"/>
              </g>
              <defs>
                <filter id="ptr-glow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#C9A84C" floodOpacity="0.6"/>
                </filter>
              </defs>
            </svg>
          </div>
        )}

        {/* Skip Tour */}
        {!isComplete && (
          <button onClick={skip} style={{ pointerEvents: 'auto', position: 'fixed', top: 16, right: 16, zIndex: 10002, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'Figtree, sans-serif' }}>
            <X size={14} /> Skip Tour
          </button>
        )}

        {/* Task done checkmark */}
        {taskDone && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10003, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'pop-in 0.5s ease-out forwards' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
          </div>
        )}

        {/* Speech bubble */}
        <div style={{ pointerEvents: 'auto', position: 'fixed', zIndex: 10001, transition: 'all 300ms', opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(8px)' : 'translateY(0)', ...getBubblePos() }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 12px 48px rgba(0,0,0,0.15)', border: '1px solid #E8E0D4', width: isModal ? 500 : 460, maxWidth: '92vw', padding: isModal ? 32 : 24, fontFamily: 'Figtree, sans-serif' }}>

            {/* Modal icon */}
            {isModal && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isComplete ? '#F0FDF4' : '#FBF5E6' }}>
                  {isComplete ? <Rocket size={28} color="#16A34A" /> : <Sparkles size={28} color="#C9A84C" />}
                </div>
              </div>
            )}

            {/* Step badge */}
            {!isModal && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(201,168,76,0.1)', padding: '4px 10px', borderRadius: 999 }}>
                  Step {stepIndex} / {totalSteps - 1}
                </span>
                {isInteractive && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#F0FDF4', padding: '4px 10px', borderRadius: 999, animation: 'pulse-border 2s ease-in-out infinite' }}>
                    Try it
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h3 style={{ fontWeight: 700, color: '#111', fontSize: isModal ? 24 : 18, marginBottom: 8, textAlign: isModal ? 'center' : 'left', lineHeight: 1.3 }}>
              {(currentStep.title || '').replace(/\{firstName\}/g, firstName)}
            </h3>

            {/* Body */}
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, textAlign: isModal ? 'center' : 'left', marginBottom: 12 }}>
              {bodyText}
            </p>

            {/* Task instruction */}
            {isInteractive && taskText && (
              <div style={{ background: '#FBF5E6', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
                <p style={{ color: '#111', fontSize: 13, fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{taskText}</p>
              </div>
            )}

            {/* Task done */}
            {taskDone && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                <p style={{ color: '#16A34A', fontSize: 13, fontWeight: 700, margin: 0 }}>Nice one! Moving on...</p>
              </div>
            )}

            {/* Progress bar */}
            <div style={{ width: '100%', height: 6, background: '#E8E0D4', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#C9A84C', borderRadius: 3, transition: 'width 500ms', width: `${(stepIndex / (totalSteps - 1)) * 100}%` }} />
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              {isWelcome ? (
                <>
                  <button onClick={skip} style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', fontFamily: 'Figtree, sans-serif' }}>Skip Tour</button>
                  <button onClick={next} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: '#C9A84C', color: '#111', border: 'none', cursor: 'pointer', fontFamily: 'Figtree, sans-serif' }}>
                    Let's Go <ArrowRight size={16} />
                  </button>
                </>
              ) : isComplete ? (
                <button onClick={next} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Figtree, sans-serif' }}>
                  Go to Dashboard <ArrowRight size={16} />
                </button>
              ) : isInteractive ? (
                <p style={{ fontSize: 12, color: '#999', textAlign: 'center', width: '100%', margin: 0 }}>
                  Click the highlighted area to continue, or <button onClick={next} style={{ color: '#C9A84C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12, fontFamily: 'Figtree, sans-serif' }}>skip this step</button>
                </p>
              ) : (
                <>
                  {stepIndex > 1 && <button onClick={back} style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', fontFamily: 'Figtree, sans-serif' }}>Back</button>}
                  <button onClick={next} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Figtree, sans-serif' }}>
                    {stepIndex >= totalSteps - 2 ? 'Finish' : 'Next'} <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Confetti */}
        {isComplete && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10004 }}>
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                left: `${Math.random() * 100}%`, top: -10,
                backgroundColor: ['#C9A84C', '#111', '#FFD700', '#FFF', '#E8E0D4'][i % 5],
                animation: `confetti-fall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s forwards`,
              }} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pointer-bounce { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-6px,10px)} }
        @keyframes pulse-border { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes pop-in { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes confetti-fall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
      `}</style>
    </>
  )
}

export default WalkthroughOverlay
