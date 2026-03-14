/**
 * ReeveOS Assistant — AI Business Operator Chat
 * Phase 1: Read-only popup mode
 * Connects to /assistant/chat backend endpoint
 */
import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Mic, ChevronRight, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { useBusiness } from '../contexts/BusinessContext'
import api from '../utils/api'

const SUGGESTIONS = [
  "Who's booked today?",
  "Revenue this week vs last",
  "Clients who haven't visited in 30 days",
  "Most popular treatments this month",
  "Any flagged consultation forms?",
  "Who's working tomorrow?",
]

const AssistantChat = () => {
  const { business, businessType } = useBusiness()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokensUsed, setTokensUsed] = useState(0)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const [expanded, setExpanded] = useState(false)

  const businessName = business?.name || 'your business'

  // Chat window dimensions
  const chatW = expanded ? 520 : 380
  const chatH = expanded ? 620 : 520

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMsg = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/assistant/chat', {
        message: text.trim(),
        history,
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response || "I couldn't process that.",
        toolCalls: res.tool_calls || [],
      }])
      setTokensUsed(prev => prev + (res.tokens_used || 0))
    } catch (err) {
      console.error('Assistant error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't connect. Please try again.",
        error: true,
      }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Format AI response — handle markdown-like formatting
  const formatResponse = (text) => {
    if (!text) return null
    return text.split('\n').map((line, i) => {
      // Bold
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <div key={i} style={{ marginBottom: line ? 4 : 8 }}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ fontWeight: 700 }}>{part}</strong>
              : <span key={j}>{part}</span>
          )}
        </div>
      )
    })
  }

  return (
    <>
      {/* ── FAB Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: isOpen ? '#111' : 'linear-gradient(135deg, #C9A84C, #B8860B)',
          color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(201, 168, 76, 0.4), 0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(180deg)' : 'scale(1)',
        }}
        onMouseOver={e => { if (!isOpen) e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseOut={e => { if (!isOpen) e.currentTarget.style.transform = 'scale(1)' }}
      >
        {isOpen ? <X size={20} /> : <Sparkles size={20} />}
      </button>

      {/* ── Pulse ring on FAB ── */}
      {!isOpen && messages.length === 0 && (
        <div style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 9998,
          width: 52, height: 52, borderRadius: '50%',
          border: '2px solid #C9A84C',
          animation: 'assistantPulse 2s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 84, left: 20, zIndex: 9998,
          width: chatW, maxHeight: chatH,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)',
          border: '1px solid #E5E7EB',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'assistantSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          fontFamily: "'Figtree', system-ui, sans-serif",
          transition: 'width 0.3s ease, max-height 0.3s ease',
        }}>

          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#111', color: '#fff', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #C9A84C, #B8860B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>ReeveOS Assistant</div>
                <div style={{ fontSize: 10, color: '#C9A84C', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                  {businessType === 'restaurant' ? 'Restaurant operator' : 'Clinic assistant'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4, borderRadius: 999 }}
                title={expanded ? 'Shrink' : 'Expand'}>
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{
            flex: 1, overflowY: 'auto', padding: '12px 16px',
            minHeight: expanded ? 420 : 300, maxHeight: expanded ? 480 : 380,
          }}>
            {/* Welcome message */}
            {messages.length === 0 && (
              <div style={{ paddingTop: 12 }}>
                <div style={{
                  background: '#F9FAFB', borderRadius: 12, padding: 14,
                  border: '1px solid #E5E7EB', marginBottom: 12,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                    Hi! I'm your AI business operator.
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                    I can look up bookings, check revenue, find clients, and answer questions about {businessName}. Just ask me anything.
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: 8 }}>SUGGESTIONS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SUGGESTIONS.slice(0, 4).map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} style={{
                      padding: '6px 12px', borderRadius: 16, fontSize: 11, fontWeight: 500,
                      background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151',
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#111' }}
                      onMouseOut={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#E5E7EB' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
                  background: msg.role === 'user' ? '#111' : msg.error ? '#FEF2F2' : '#F9FAFB',
                  color: msg.role === 'user' ? '#fff' : msg.error ? '#DC2626' : '#111',
                  fontSize: 13, lineHeight: 1.5,
                  border: msg.role === 'user' ? 'none' : `1px solid ${msg.error ? '#FEE2E2' : '#E5E7EB'}`,
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: msg.role === 'user' ? 14 : 4,
                }}>
                  {msg.role === 'assistant' ? formatResponse(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 14, background: '#F9FAFB',
                  border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8,
                  borderBottomLeftRadius: 4,
                }}>
                  <Loader2 size={14} color="#C9A84C" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid #E5E7EB',
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or give a command..."
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 13,
                fontFamily: "'Figtree', system-ui, sans-serif",
                color: '#111', background: 'transparent',
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: input.trim() ? '#111' : '#F3F4F6',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Send size={14} color={input.trim() ? '#fff' : '#9CA3AF'} />
            </button>
          </div>

          {/* Footer */}
          <div style={{
            padding: '6px 12px', borderTop: '1px solid #F3F4F6',
            fontSize: 9, color: '#9CA3AF', textAlign: 'center', flexShrink: 0,
          }}>
            AI-powered · For account issues, email support@reeveos.app
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes assistantPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes assistantSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

export default AssistantChat
