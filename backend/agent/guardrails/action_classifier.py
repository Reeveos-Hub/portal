"""
Action Classifier & Rate Limiter
=================================
Three tiers:
  auto    — reads, queries, health checks → execute immediately
  review  — sends emails, updates records, refunds < £100 → execute + log
  human   — delete accounts, modify pricing, large refunds → block + queue for approval

Rate limits prevent runaway agent loops.
"""
import time
import logging
from collections import defaultdict
from typing import Dict, Any

logger = logging.getLogger("agent.guardrails")

# ─── Rate Limiting ─── #
_call_counts: Dict[str, list] = defaultdict(list)

RATE_LIMITS = {
    "send_email": {"max": 50, "window": 3600},        # 50/hour
    "send_sms": {"max": 20, "window": 3600},           # 20/hour
    "process_refund": {"max": 10, "window": 3600},     # 10/hour
    "update_ticket": {"max": 100, "window": 3600},     # 100/hour
    "moderate_review": {"max": 50, "window": 3600},    # 50/hour
    "create_lead": {"max": 200, "window": 3600},       # 200/hour
    "generate_content": {"max": 50, "window": 3600},   # 50/hour
    "_default": {"max": 200, "window": 3600},           # 200/hour catch-all
}

def check_rate_limit(tool_name: str) -> bool:
    """Check if tool call is within rate limits. Returns True if allowed."""
    limits = RATE_LIMITS.get(tool_name, RATE_LIMITS["_default"])
    now = time.time()
    window = limits["window"]
    
    # Clean old entries
    _call_counts[tool_name] = [t for t in _call_counts[tool_name] if now - t < window]
    
    if len(_call_counts[tool_name]) >= limits["max"]:
        logger.warning(f"Rate limit hit: {tool_name} ({len(_call_counts[tool_name])}/{limits['max']})")
        return False
    
    _call_counts[tool_name].append(now)
    return True


# ─── Action Classification ─── #

# Tools that are always safe (reads only)
AUTO_APPROVE = {
    "get_bookings", "get_booking_stats", "get_support_tickets", "get_ticket",
    "get_system_health", "get_error_logs", "get_stripe_balance", "get_mrr",
    "get_active_restaurants", "get_churn_scores", "search_knowledge_base",
    "get_restaurant_profile", "get_reviews", "get_analytics", "get_lead",
    "get_leads", "get_onboarding_status", "get_email_stats", "scan_trends",
    "get_agent_stats", "get_pending_approvals",
}

# Tools that execute but get logged (writes, bounded impact)
REVIEW_REQUIRED = {
    "send_email", "send_sms", "update_ticket", "moderate_review",
    "create_lead", "update_lead", "advance_drip", "generate_content",
    "generate_seo_page", "trigger_dunning_email", "update_churn_score",
    "send_upgrade_nudge", "create_onboarding_sequence", "index_knowledge",
    "send_briefing",
}

# Tools that NEVER auto-execute (high stakes)
HUMAN_REQUIRED = {
    "delete_account", "modify_pricing", "suspend_business", "process_refund_large",
    "delete_restaurant", "bulk_email_blast", "modify_subscription", "purge_data",
    "update_billing", "grant_admin_access",
}


def classify_action(tool_name: str, tool_input: Dict[str, Any], declared_tier: str = "auto") -> str:
    """
    Classify a tool call. Returns: 'auto', 'review', 'blocked', 'rate_limited'
    """
    # Hard block on human-required tools
    if tool_name in HUMAN_REQUIRED or declared_tier == "human":
        logger.info(f"BLOCKED: {tool_name} requires human approval")
        return "blocked"
    
    # Check rate limits
    if not check_rate_limit(tool_name):
        return "rate_limited"
    
    # Auto-approve reads
    if tool_name in AUTO_APPROVE or declared_tier == "auto":
        return "auto"
    
    # Review-required writes
    if tool_name in REVIEW_REQUIRED or declared_tier == "review":
        # Additional safety checks on specific tools
        if tool_name == "send_email":
            # Block if sending to more than 10 recipients at once
            recipients = tool_input.get("to", [])
            if isinstance(recipients, list) and len(recipients) > 10:
                logger.info(f"BLOCKED: send_email to {len(recipients)} recipients (>10)")
                return "blocked"
        
        if tool_name == "process_refund":
            amount = tool_input.get("amount", 0)
            if amount > 10000:  # > £100 in pence
                logger.info(f"BLOCKED: refund £{amount/100:.2f} exceeds auto-approve limit")
                return "blocked"
        
        return "review"
    
    # Default: review
    return "review"
