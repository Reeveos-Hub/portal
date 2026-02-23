import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.rezvo.co.uk";
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const REZVO_KNOWLEDGE = `You are Rezvo's AI support assistant. You help restaurant owners, salon owners, barbers, spa owners and their customers with questions about the Rezvo booking platform.

ABOUT REZVO:
- Rezvo is a UK-based booking platform for independent service businesses — restaurants, barbers, salons, spas, and more
- Tagline: "Your High Street, Booked."
- Founded and operated in the UK
- We are NOT a marketplace that takes commission. We are a SaaS tool that empowers business owners.

KEY DIFFERENTIATORS:
- 0% commission on bookings (competitors like Fresha charge 20% on new clients, Treatwell charges 25-50%)
- Payments go DIRECTLY to the business owner's own Stripe Connect account — Rezvo never holds customer funds
- All plans include unlimited bookings — no per-booking fees
- Full data ownership — business owners own their customer data, can export anytime
- UK-based support via email and this AI assistant
- Modern, clean interface designed for ease of use

PRICING PLANS:
- Starter (£0/month): 1 staff member, unlimited bookings, online booking page, email notifications, AI support
- Growth (£29/month): Up to 5 staff members, everything in Starter plus SMS reminders, deposit payments, advanced reporting, priority email support, calendar sync
- Unlimited (£59/month): Unlimited staff, everything in Growth plus multiple locations, dedicated onboarding call, API access

PAYMENTS & DEPOSITS:
- Powered by Stripe Connect — each business connects their own Stripe account
- Deposits flow directly to the business owner's bank account, not through Rezvo
- Stripe's standard transaction fees apply (1.5% + 20p per transaction in the UK)
- Rezvo does NOT add any additional transaction fees on top of Stripe's rates
- Businesses can set custom deposit amounts, cancellation policies, and no-show fees
- PCI compliant — all card data handled by Stripe, never touches Rezvo servers

FEATURES:
- Online booking page (shareable link, embeddable on website)
- Real-time calendar with drag-and-drop management
- Calendar sync with Google Calendar and Outlook (two-way sync). Apple Calendar via .ics subscription
- Staff management with individual schedules and permissions
- Customer database with booking history, notes, and preferences
- Automated email confirmations and reminders
- SMS reminders (Growth plan and above)
- Deposit and prepayment collection
- No-show protection with cancellation fees
- Analytics dashboard with revenue, bookings, and customer insights
- Floor plan / table management for restaurants
- Multi-location support (Unlimited plan)
- API access for custom integrations (Unlimited plan)

GETTING STARTED:
1. Sign up free at rezvo.app — no credit card required
2. Add your business details, services, and staff
3. Connect your Stripe account for payments
4. Share your booking link with customers
5. Upgrade anytime as your business grows

COMMON QUESTIONS:
Q: Is there a setup fee? A: No, there is never a setup fee. Start free and upgrade when you're ready.
Q: Can I import existing client data? A: Yes, you can import client data via CSV upload from most other platforms.
Q: What happens if I want to cancel? A: Cancel anytime, no long-term contracts. Your data remains exportable for 30 days after cancellation.
Q: Do my clients need to download an app? A: No, clients book through your personalised web booking page — no app download required.
Q: How is Rezvo different from Fresha? A: Fresha charges 20% commission on new marketplace clients and controls your payment flow. Rezvo charges 0% commission, and payments go directly to your Stripe account. You own your data and your customer relationships.
Q: How is Rezvo different from Booksy? A: Booksy charges £40/month plus £20 per additional staff member, and limits marketplace visibility behind a 30% "Boost" fee. Rezvo's pricing is simpler with no per-staff surcharges on most plans and no marketplace commission.
Q: How is Rezvo different from Treatwell? A: Treatwell is a marketplace that takes 25-50% commission per booking and owns the customer relationship. Rezvo is your own booking system — you keep 100% of your revenue and own all your customer data.
Q: Is my data secure? A: Yes. All data is encrypted, stored on secure UK/EU servers, and fully GDPR compliant. Payment data is handled by Stripe (PCI DSS Level 1 certified).
Q: Do you offer a free trial? A: The Starter plan is free forever. For Growth and Unlimited plans, we offer a 14-day free trial.
Q: Can I use Rezvo for multiple locations? A: Yes, on the Unlimited plan (£59/month) you can manage multiple locations from one dashboard.

SUPPORT ESCALATION:
- If you cannot answer a question confidently, suggest the user emails support@rezvo.app
- For account-specific issues (billing, passwords, bugs), always recommend emailing support@rezvo.app
- For feature requests, encourage the user to email feedback@rezvo.app
- Never make up features or pricing that isn't listed above
- Be friendly, professional, and concise
- Use British English spelling (colour, organisation, etc.)

TONE:
- Warm, helpful, and professional — like a knowledgeable colleague
- Keep answers concise — 2-3 sentences for simple questions, more detail only when needed
- Use the business owner's perspective — "your customers", "your bookings", "your revenue"
- Be honest about limitations — if something isn't available yet, say so
- Never be pushy about upgrades — mention them only when directly relevant`;

const SUGGESTED_QUESTIONS = [
  "How is Rezvo different from Fresha?",
  "How do payments and deposits work?",
  "What's included in the free plan?",
  "Can my clients book without an app?",
  "How does calendar sync work?",
  "Is there a setup fee?",
];

export default function RezvoSupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const lastBotRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "assistant") {
      setTimeout(() => {
        lastBotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && pulseCount < 3) {
      const timer = setTimeout(() => setPulseCount((p) => p + 1), 5000);
      return () => clearTimeout(timer);
    }
  }, [pulseCount, isOpen]);

  async function startConversation() {
    try {
      const source = window.location.pathname.includes("/app")
        ? "app_owner"
        : window.location.pathname.includes("/dashboard")
        ? "dashboard"
        : "web";

      const res = await fetch(`${API_BASE}/api/support/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.id);
        return data.id;
      }
    } catch (err) {
      console.warn("Could not start support conversation:", err);
    }
    return null;
  }

  async function logMessage(convId, role, content, inputTokens, outputTokens, isEscalation) {
    if (!convId) return;

    try {
      await fetch(`${API_BASE}/api/support/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          content,
          input_tokens: inputTokens || 0,
          output_tokens: outputTokens || 0,
          is_escalation: isEscalation || false,
        }),
      });
    } catch (err) {
      console.warn("Could not log support message:", err);
    }
  }

  async function sendMessage(text) {
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    // Start conversation on first message
    let convId = conversationId;
    if (!convId) {
      convId = await startConversation();
    }

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: REZVO_KNOWLEDGE,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const assistantText =
        data.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "Sorry, I couldn't process that. Please try again or email support@rezvo.app";

      // Get token counts from API response
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;

      // Check if bot escalated (mentions support email and suggests emailing)
      const isEscalation =
        assistantText.toLowerCase().includes("support@rezvo.app") &&
        (assistantText.toLowerCase().includes("email") ||
          assistantText.toLowerCase().includes("contact"));

      // Log user message
      logMessage(convId, "user", text.trim(), inputTokens, 0, false);

      // Log assistant response
      logMessage(convId, "assistant", assistantText, 0, outputTokens, isEscalation);

      setMessages([...updatedMessages, { role: "assistant", content: assistantText }]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage =
        "I'm having trouble connecting right now. Please try again in a moment, or email us at support@rezvo.app and we'll get back to you within 24 hours.";

      setMessages([...updatedMessages, { role: "assistant", content: errorMessage }]);

      // Log error as assistant message
      logMessage(convId, "assistant", errorMessage, 0, 0, true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div style={{ fontFamily: '"Figtree", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Figtree:wght@400;500;600;700&display=swap');
        
        .rezvo-chat-bubble {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B4332, #2D6A4F);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(27, 67, 50, 0.35), 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .rezvo-chat-bubble:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 40px rgba(27, 67, 50, 0.45);
        }
        .rezvo-chat-bubble.open {
          transform: rotate(180deg) scale(1);
        }
        
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid #52B788;
          animation: pulse-ring 2s ease-out infinite;
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slide-down {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(20px) scale(0.95); }
        }
        .chat-window-enter { animation: slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .chat-window-exit { animation: slide-down 0.25s ease-in forwards; }
        
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-animate { animation: msg-in 0.3s ease-out forwards; }
        
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .typing-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #6B706D;
          display: inline-block; margin: 0 2px;
        }
        .typing-dot:nth-child(1) { animation: dot-bounce 1.2s ease infinite 0s; }
        .typing-dot:nth-child(2) { animation: dot-bounce 1.2s ease infinite 0.15s; }
        .typing-dot:nth-child(3) { animation: dot-bounce 1.2s ease infinite 0.3s; }
        
        .suggestion-chip {
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid #DDD5C5;
          background: white;
          color: #1B4332;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .suggestion-chip:hover {
          background: #1B4332;
          color: white;
          border-color: #1B4332;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(27, 67, 50, 0.2);
        }
        
        .chat-input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(82, 183, 136, 0.3);
        }
        
        .chat-scrollbar::-webkit-scrollbar { width: 5px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: #DDD5C5; border-radius: 10px; }
      `}</style>

      {/* Chat Bubble */}
      <button
        className={`rezvo-chat-bubble ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {!isOpen && pulseCount < 3 && <div className="pulse-ring" />}
        {isOpen ? (
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="chat-window-enter"
          style={{
            position: "fixed",
            bottom: 100,
            right: 24,
            width: 400,
            maxWidth: "calc(100vw - 48px)",
            height: 560,
            maxHeight: "calc(100vh - 140px)",
            borderRadius: 20,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            boxShadow: "0 25px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)",
            border: "1px solid #E2E5DF",
            background: "#FAFAF7",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0A1F14, #1B4332)",
              padding: "20px 20px 16px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#1B4332",
                  border: "2px solid #52B788",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FAFAF7",
                  fontFamily: '"Bricolage Grotesque", sans-serif',
                  fontWeight: 800,
                  fontSize: 20,
                }}
              >
                R
              </div>
              <div>
                <div
                  style={{
                    color: "white",
                    fontFamily: '"Bricolage Grotesque", sans-serif',
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: "0.02em",
                  }}
                >
                  REZVO Support
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#52B788",
                      boxShadow: "0 0 8px rgba(82,183,136,0.5)",
                    }}
                  />
                  <span style={{ color: "#74C69D", fontSize: 12, fontWeight: 500 }}>
                    Powered by AI · Usually instant
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className="chat-scrollbar"
            style={{
              flex: 1,
              overflow: "auto",
              padding: "16px 16px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="msg-animate">
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E2E5DF",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "14px 16px",
                    maxWidth: "88%",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#2A2A28",
                  }}
                >
                  <span style={{ fontSize: 20, display: "block", marginBottom: 6 }}>👋</span>
                  <strong style={{ color: "#1B4332" }}>Hey! I'm Rezvo's AI assistant.</strong>
                  <br />
                  I can help with questions about features, pricing, payments, getting started, and more. What can I help you with?
                </div>

                {/* Suggestions */}
                {showSuggestions && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 12,
                      paddingLeft: 2,
                    }}
                  >
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        className="suggestion-chip"
                        onClick={() => sendMessage(q)}
                        style={{ animationDelay: `${i * 0.08}s` }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message History */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className="msg-animate"
                ref={msg.role === "assistant" && i === messages.length - 1 ? lastBotRef : null}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius:
                      msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "#1B4332" : "white",
                    color: msg.role === "user" ? "white" : "#2A2A28",
                    border: msg.role === "user" ? "none" : "1px solid #E2E5DF",
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    boxShadow:
                      msg.role === "user"
                        ? "0 2px 8px rgba(27,67,50,0.15)"
                        : "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="msg-animate" style={{ display: "flex" }}>
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E2E5DF",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "12px 16px 16px",
              borderTop: "1px solid #E2E5DF",
              background: "white",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Rezvo..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid #DDD5C5",
                  background: "#FAFAF7",
                  fontSize: 14,
                  fontFamily: "inherit",
                  color: "#2A2A28",
                  transition: "all 0.2s ease",
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: "none",
                  background:
                    input.trim() && !isLoading
                      ? "linear-gradient(135deg, #1B4332, #2D6A4F)"
                      : "#E2E5DF",
                  color: input.trim() && !isLoading ? "white" : "#9CA09E",
                  cursor: input.trim() && !isLoading ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.3s ease",
                  transform: input.trim() ? "scale(1)" : "scale(0.95)",
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: 8,
                fontSize: 11,
                color: "#9CA09E",
              }}
            >
              AI-powered · For account issues, email{" "}
              <a href="mailto:support@rezvo.app" style={{ color: "#1B4332", textDecoration: "none", fontWeight: 600 }}>
                support@rezvo.app
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
