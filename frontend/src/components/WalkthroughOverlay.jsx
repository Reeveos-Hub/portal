/**
 * WalkthroughOverlay — renders the dim backdrop, highlight ring, and speech bubble.
 * Positioned dynamically based on the target element.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useWalkthrough } from '../contexts/WalkthroughContext'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, ArrowRight, X, Sparkles, Rocket } from 'lucide-react'

const WalkthroughOverlay = () => {
  const { active, currentStep, stepIndex, totalSteps, next, back, skip } = useWalkthrough()
  const { user } = useAuth()
  const [targetRect, setTargetRect] = useState(null)
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 })
  const [visible, setVisible] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const bubbleRef = useRef(null)
  const firstName = (user?.name || 'there').split(' ')[0]

  // Find and measure target element
  const measureTarget = useCallback(() => {
    if (!currentStep || !currentStep.target) {
      setTargetRect(null)
      return
    }
    // Small delay to let page render after navigation
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        // Scroll into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => setTargetRect(el.getBoundingClientRect()), 400)
        }
      } else {
        setTargetRect(null)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [currentStep])

  useEffect(() => {
    const cleanup = measureTarget()
    return cleanup
  }, [measureTarget, stepIndex])

  // Position bubble relative to target
  useEffect(() => {
    if (!targetRect || !bubbleRef.current) {
      setBubblePos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }
    const bw = 380 // bubble width
    const bh = bubbleRef.current?.offsetHeight || 200
    const pad = 16
    const pos = currentStep?.position || 'bottom'

    let top, left
    if (pos === 'bottom') {
      top = targetRect.bottom + pad
      left = targetRect.left + targetRect.width / 2 - bw / 2
    } else if (pos === 'top') {
      top = targetRect.top - bh - pad
      left = targetRect.left + targetRect.width / 2 - bw / 2
    } else if (pos === 'right') {
      top = targetRect.top + targetRect.height / 2 - bh / 2
      left = targetRect.right + pad
    } else {
      top = targetRect.top + targetRect.height / 2 - bh / 2
      left = targetRect.left - bw - pad
    }

    // Clamp to viewport
    left = Math.max(16, Math.min(left, window.innerWidth - bw - 16))
    top = Math.max(16, Math.min(top, window.innerHeight - bh - 16))

    setBubblePos({ top: `${top}px`, left: `${left}px`, transform: 'none' })
  }, [targetRect, currentStep])

  // Fade in/out transitions
  useEffect(() => {
    if (active) {
      setTimeout(() => setVisible(true), 50)
    } else {
      setVisible(false)
    }
  }, [active])

  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => setTransitioning(false), 300)
    return () => clearTimeout(t)
  }, [stepIndex])

  // Resize handler
  useEffect(() => {
    const handleResize = () => measureTarget()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [measureTarget])

  if (!active || !currentStep) return null

  const isModal = currentStep.type === 'modal'
  const isComplete = currentStep.id === 'complete'
  const isWelcome = currentStep.id === 'welcome'
  const bodyText = currentStep.body.replace('{firstName}', firstName)

  // Confetti for completion
  const renderConfetti = () => {
    if (!isComplete) return null
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              backgroundColor: ['#C9A84C', '#111111', '#FFD700', '#FFF', '#E8E0D4'][i % 5],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={(e) => e.stopPropagation()} />

      {/* Target highlight cutout */}
      {targetRect && !isModal && (
        <div
          className="absolute border-2 border-[#C9A84C] rounded-xl shadow-[0_0_0_4px_rgba(201,168,76,0.3)] transition-all duration-500 z-[10000]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(201,168,76,0.4)',
          }}
        />
      )}

      {/* Skip button */}
      {!isComplete && (
        <button
          onClick={skip}
          className="absolute top-5 right-5 z-[10002] flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-sm font-medium hover:bg-white/20 hover:text-white transition-all"
        >
          <X size={14} /> Skip Tour
        </button>
      )}

      {/* Speech bubble / Modal */}
      <div
        ref={bubbleRef}
        className={`absolute z-[10001] transition-all duration-300 ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={isModal
          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          : bubblePos
        }
      >
        <div className={`bg-white rounded-2xl shadow-2xl border border-[#E8E0D4] ${isModal ? 'w-[440px] max-w-[90vw] p-8' : 'w-[380px] max-w-[85vw] p-6'}`}>
          {/* Icon for modals */}
          {isModal && (
            <div className="flex justify-center mb-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isComplete ? 'bg-green-50' : 'bg-[#FBF5E6]'}`}>
                {isComplete
                  ? <Rocket className="w-7 h-7 text-green-600" />
                  : <Sparkles className="w-7 h-7 text-[#C9A84C]" />
                }
              </div>
            </div>
          )}

          {/* Step indicator */}
          {!isModal && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider">
                Step {stepIndex} of {totalSteps - 1}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className={`font-bold text-[#111111] mb-2 ${isModal ? 'text-2xl text-center' : 'text-base'}`}
            style={{ fontFamily: 'Figtree, sans-serif' }}>
            {currentStep.title.replace('{firstName}', firstName)}
          </h3>

          {/* Body */}
          <p className={`text-[#666] text-sm leading-relaxed ${isModal ? 'text-center' : ''}`}
            style={{ fontFamily: 'Figtree, sans-serif' }}>
            {bodyText}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1 mt-5 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === stepIndex ? 'w-6 h-2 bg-[#C9A84C]' : 'w-2 h-2 bg-[#E8E0D4]'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            {isWelcome ? (
              <>
                <button onClick={skip}
                  className="text-sm text-[#999] hover:text-[#111] transition-colors font-medium">
                  Skip Tour
                </button>
                <button onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#C9A84C', color: '#111111' }}>
                  Let's Go <ArrowRight size={16} />
                </button>
              </>
            ) : isComplete ? (
              <button onClick={next}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: '#111111', color: '#FFFFFF' }}>
                Go to Dashboard <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button onClick={back} disabled={stepIndex <= 1}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#999] hover:text-[#111] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={next}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#111111', color: '#FFFFFF' }}>
                  {stepIndex >= totalSteps - 2 ? 'Finish' : 'Next'} <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confetti */}
      {renderConfetti()}

      {/* Confetti animation keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  )
}

export default WalkthroughOverlay
