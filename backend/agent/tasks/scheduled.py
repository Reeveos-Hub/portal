"""
Rezvo Scheduled Tasks
=====================
Every autonomous task the agent daemon runs on a schedule.
Each task calls the agent runner with specific tools and prompts.
"""
import logging
from datetime import datetime, timedelta
from database import get_database
from agent.runner import run_agent, MODEL_HAIKU, MODEL_SONNET

logger = logging.getLogger("agent.tasks")


# ═══════════════════════════════════════════════════════════
# TASK 1: HEALTH CHECK (every 5 minutes)
# ═══════════════════════════════════════════════════════════

async def health_check():
    """Check system health. Auto-restart services if needed. Alert on anomalies."""
    result = await run_agent(
        task="""Check the system health and error logs from the last hour.
If CPU > 90%, memory > 90%, or disk > 90%, flag as critical.
If there are repeated errors (same error 5+ times), analyse the root cause.
If MongoDB is down, that's an emergency.
Summarise the health status in 2-3 sentences.""",
        tools=["get_system_health", "get_error_logs"],
        model=MODEL_HAIKU,
        max_turns=3,
        task_type="health_check",
    )
    
    # Store latest health snapshot
    db = get_database()
    if db is not None:
        await db.health_snapshots.insert_one({
            "result": result["result"],
            "tokens": result["tokens_used"],
            "duration": result["duration"],
            "created_at": datetime.utcnow(),
        })
        # Keep only 7 days of snapshots
        cutoff = datetime.utcnow() - timedelta(days=7)
        await db.health_snapshots.delete_many({"created_at": {"$lt": cutoff}})
    
    return result


# ═══════════════════════════════════════════════════════════
# TASK 2: SUPPORT TICKET TRIAGE (every 15 minutes)
# ═══════════════════════════════════════════════════════════

async def triage_tickets():
    """Triage open support tickets. Auto-respond to simple ones, escalate complex ones."""
    result = await run_agent(
        task="""Check for open support tickets. For each ticket:

1. If it's a simple question (hours, pricing, how-to), draft a helpful response and mark as in_progress.
2. If it's a bug report, add an internal note with your diagnosis and set priority to high.
3. If it's a billing issue, set priority to urgent and add note "needs human review".
4. If it's angry/frustrated, set priority to high and draft a empathetic response acknowledging their frustration.

Also search the knowledge base for relevant answers before responding.
Only process up to 5 tickets per run to stay focused.""",
        tools=["get_support_tickets", "update_ticket", "search_knowledge_base"],
        model=MODEL_HAIKU,
        max_turns=8,
        task_type="ticket_triage",
    )
    return result


# ═══════════════════════════════════════════════════════════
# TASK 3: REVIEW MODERATION (every 2 hours)
# ═══════════════════════════════════════════════════════════

async def moderate_reviews():
    """Moderate pending reviews. Approve genuine ones, flag suspicious ones."""
    result = await run_agent(
        task="""Check for reviews pending moderation. For each review:

1. APPROVE if: genuine customer experience, constructive feedback, reasonable language.
2. FLAG if: contains profanity, personal attacks, spam, fake review signals (generic praise, no specifics), competitor attacks.
3. REMOVE if: clearly spam, contains URLs/promotional links, hate speech, threats.

Add a brief moderation reason for each flagged or removed review.
Process up to 10 reviews per run.""",
        tools=["get_reviews", "moderate_review"],
        model=MODEL_HAIKU,
        max_turns=6,
        task_type="review_moderation",
    )
    return result


# ═══════════════════════════════════════════════════════════
# TASK 4: DAILY BRIEFING (8 AM daily)
# ═══════════════════════════════════════════════════════════

async def daily_briefing():
    """Generate and send the morning ops briefing."""
    result = await run_agent(
        task="""Generate today's morning operations briefing for the Rezvo founder. Gather:

1. MRR and subscriber stats
2. Booking stats for the last 24 hours and 7-day trend
3. Open support tickets count and any urgent ones
4. System health status
5. Email delivery stats
6. Any businesses at high churn risk (score > 60)
7. Agent's own stats (how many tasks ran, tokens used, cost)

Format as a clear, scannable briefing. Lead with the most important number (MRR).
Flag anything that needs immediate attention with ⚠️.
End with 1-2 suggested actions for today.

Then send this briefing via email to the founder.""",
        tools=[
            "get_mrr", "get_booking_stats", "get_support_tickets", "get_system_health",
            "get_email_stats", "get_churn_scores", "get_agent_stats", "get_error_logs",
            "send_email",
        ],
        model=MODEL_SONNET,
        max_turns=10,
        task_type="daily_briefing",
    )
    return result


# ═══════════════════════════════════════════════════════════
# TASK 5: CHURN SCORING (daily)
# ═══════════════════════════════════════════════════════════

async def score_churn_risk():
    """Score all active businesses for churn risk using rule-based signals."""
    db = get_database()
    if db is None:
        return {"result": "No database connection"}
    
    now = datetime.utcnow()
    scored = 0
    
    async for biz in db.businesses.find({"subscription_status": "active"}):
        score = 0
        signals = []
        biz_id = str(biz["_id"])
        
        # Signal 1: No login in 30 days (+30)
        last_login = biz.get("last_login_at")
        if last_login and (now - last_login).days > 30:
            score += 30
            signals.append("no_login_30d")
        elif not last_login:
            score += 15
            signals.append("never_logged_in")
        
        # Signal 2: Booking volume dropped 50%+ (+20)
        recent_bookings = await db.bookings.count_documents({
            "business_id": biz_id,
            "created_at": {"$gte": now - timedelta(days=14)}
        })
        prev_bookings = await db.bookings.count_documents({
            "business_id": biz_id,
            "created_at": {"$gte": now - timedelta(days=28), "$lt": now - timedelta(days=14)}
        })
        if prev_bookings > 0 and recent_bookings < prev_bookings * 0.5:
            score += 20
            signals.append("booking_volume_dropped")
        
        # Signal 3: Payment failures (+20)
        payment_failures = await db.dunning_log.count_documents({
            "business_id": biz_id,
            "sent_at": {"$gte": now - timedelta(days=30)}
        })
        if payment_failures > 0:
            score += 20
            signals.append(f"payment_failures_{payment_failures}")
        
        # Signal 4: Support tickets (high volume = frustration) (+15)
        ticket_count = await db.support_tickets.count_documents({
            "business_id": biz_id,
            "created_at": {"$gte": now - timedelta(days=30)},
            "priority": {"$in": ["high", "urgent"]}
        })
        if ticket_count >= 3:
            score += 15
            signals.append("many_support_tickets")
        
        # Signal 5: New customer < 90 days (+5)
        created = biz.get("created_at")
        if created and (now - created).days < 90:
            score += 5
            signals.append("new_customer")
        
        # Cap at 100
        score = min(score, 100)
        
        # Upsert churn score
        await db.churn_scores.update_one(
            {"business_id": biz_id},
            {"$set": {
                "business_id": biz_id,
                "business_name": biz.get("name"),
                "score": score,
                "signals": signals,
                "plan": biz.get("plan"),
                "scored_at": now,
            }},
            upsert=True,
        )
        scored += 1
    
    # If any high-risk businesses found, use agent to suggest interventions
    high_risk = await db.churn_scores.count_documents({"score": {"$gte": 60}})
    
    if high_risk > 0:
        await run_agent(
            task=f"""There are {high_risk} businesses with churn risk score >= 60.
Get the at-risk businesses and for each one, decide:
- If score >= 80: send a personal check-in email from the founder
- If score 60-79: send an upgrade nudge or feature discovery email
Add an internal note with your recommended action.""",
            tools=["get_churn_scores", "send_email", "send_upgrade_nudge"],
            model=MODEL_HAIKU,
            max_turns=8,
            task_type="churn_intervention",
        )
    
    return {"scored": scored, "high_risk": high_risk}


# ═══════════════════════════════════════════════════════════
# TASK 6: LEAD DISCOVERY (twice daily)
# ═══════════════════════════════════════════════════════════

async def discover_leads(city: str = "Nottingham", cuisine: str = None):
    """Discover restaurant leads via Google Places API and score them."""
    import httpx
    
    db = get_database()
    if db is None:
        return {"result": "No database connection"}
    
    from config import settings
    api_key = getattr(settings, 'google_places_api_key', None)
    if not api_key:
        return {"result": "Google Places API key not configured"}
    
    # Search for restaurants
    query = f"restaurants in {city}"
    if cuisine:
        query = f"{cuisine} restaurants in {city}"
    
    leads_created = 0
    leads_skipped = 0
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Text search
            resp = await client.post(
                "https://places.googleapis.com/v1/places:searchText",
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": api_key,
                    "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri,places.googleMapsUri,places.types,places.primaryType",
                },
                json={"textQuery": query, "maxResultCount": 20},
            )
            
            if resp.status_code != 200:
                return {"error": f"Google API {resp.status_code}: {resp.text[:200]}"}
            
            places = resp.json().get("places", [])
            
            for place in places:
                place_id = place.get("id")
                if not place_id:
                    continue
                
                # Deduplicate
                existing = await db.sales_leads.find_one({"google_place_id": place_id})
                if existing:
                    leads_skipped += 1
                    continue
                
                name = place.get("displayName", {}).get("text", "")
                
                lead = {
                    "name": name,
                    "google_place_id": place_id,
                    "address": place.get("formattedAddress"),
                    "phone": place.get("nationalPhoneNumber"),
                    "rating": place.get("rating"),
                    "review_count": place.get("userRatingCount", 0),
                    "website": place.get("websiteUri"),
                    "google_maps_url": place.get("googleMapsUri"),
                    "types": place.get("types", []),
                    "city": city,
                    "status": "new",
                    "score": 0,
                    "drip_step": 0,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
                
                # Basic lead scoring
                score = 0
                if lead["rating"] and lead["rating"] >= 4.0:
                    score += 20
                if lead["review_count"] and lead["review_count"] >= 50:
                    score += 15
                elif lead["review_count"] and lead["review_count"] >= 20:
                    score += 10
                if lead["website"]:
                    score += 10
                if lead["phone"]:
                    score += 5
                # Bonus for not having obvious delivery platform presence
                # (we'd need to scrape their website to check this properly)
                score += 10  # baseline interest
                
                lead["score"] = score
                await db.sales_leads.insert_one(lead)
                leads_created += 1
    
    except Exception as e:
        logger.error(f"Lead discovery error: {e}")
        return {"error": str(e)}
    
    return {"city": city, "leads_created": leads_created, "leads_skipped": leads_skipped}


# ═══════════════════════════════════════════════════════════
# TASK 7: LEAD RESEARCH & OUTREACH (daily)
# ═══════════════════════════════════════════════════════════

async def research_and_outreach_leads():
    """AI researches new leads and drafts personalised outreach."""
    db = get_database()
    if db is None:
        return
    
    # Get unresearched leads with decent scores
    leads = []
    async for lead in db.sales_leads.find({
        "status": "new",
        "score": {"$gte": 20}
    }).sort("score", -1).limit(5):
        lead["_id"] = str(lead["_id"])
        leads.append(lead)
    
    if not leads:
        return {"result": "No leads to research"}
    
    for lead in leads:
        # Use Sonnet for quality outreach
        result = await run_agent(
            task=f"""Research this restaurant lead and draft a personalised outreach email.

Restaurant: {lead['name']}
Address: {lead.get('address', 'Unknown')}
Rating: {lead.get('rating', 'N/A')} ({lead.get('review_count', 0)} reviews)
Website: {lead.get('website', 'None')}
Phone: {lead.get('phone', 'None')}

1. Analyse what you can infer from the data:
   - Are they likely paying commission to delivery platforms?
   - What's their online presence like?
   - What pain points might they have?

2. Generate 3 personalisation hooks specific to this restaurant.

3. Update the lead with pain_points and personalisation_hooks.

4. Draft a cold outreach email that:
   - References something specific about THEIR restaurant
   - Leads with their problem, not our features
   - Mentions the commission savings in concrete terms
   - Is under 150 words
   - Has a single CTA (reply or book a call)
   - Sounds like a real person wrote it (British, warm, direct)
   - Subject line under 8 words

5. If they have an email, send the outreach. If not, just update the lead status to 'researched'.

IMPORTANT: The email must NOT sound like AI. No "I hope this email finds you well." No "leverage." No "synergy." Write like a real founder who gives a damn about restaurants.""",
            tools=["update_lead", "send_email"],
            model=MODEL_SONNET,
            max_turns=5,
            task_type="lead_research",
        )
    
    return {"leads_processed": len(leads)}


# ═══════════════════════════════════════════════════════════
# TASK 8: DUNNING / PAYMENT RECOVERY (every 4 hours)
# ═══════════════════════════════════════════════════════════

async def process_dunning():
    """Check for failed payments and send dunning emails."""
    db = get_database()
    if db is None:
        return
    
    # Find businesses with failed payments that haven't been dunned recently
    now = datetime.utcnow()
    
    businesses_with_failures = []
    async for biz in db.businesses.find({
        "payment_status": "failed",
        "subscription_status": "active",
    }):
        biz_id = str(biz["_id"])
        # Check last dunning attempt
        last_dunning = await db.dunning_log.find_one(
            {"business_id": biz_id},
            sort=[("sent_at", -1)]
        )
        
        if last_dunning:
            days_since = (now - last_dunning["sent_at"]).days
            attempt = last_dunning["attempt"]
            # Dunning schedule: Day 0, Day 3, Day 7, Day 10
            next_attempt_days = {1: 3, 2: 4, 3: 3}
            if attempt >= 4:
                continue  # Max dunning reached
            if days_since < next_attempt_days.get(attempt, 3):
                continue  # Too soon
            next_attempt = attempt + 1
        else:
            next_attempt = 1
        
        businesses_with_failures.append({"biz": biz, "attempt": next_attempt})
    
    sent = 0
    for item in businesses_with_failures[:10]:  # Cap at 10 per run
        result = await run_agent(
            task=f"Send dunning email attempt {item['attempt']} to business {str(item['biz']['_id'])}.",
            tools=["trigger_dunning_email"],
            model=MODEL_HAIKU,
            max_turns=2,
            task_type="dunning",
        )
        sent += 1
    
    return {"dunning_emails_sent": sent}


# ═══════════════════════════════════════════════════════════
# TASK 9: SEO CONTENT GENERATION (daily)
# ═══════════════════════════════════════════════════════════

async def generate_seo_content():
    """Generate programmatic SEO pages for restaurant directory."""
    db = get_database()
    if db is None:
        return
    
    # Get cities and cuisines we have restaurants for
    cities = await db.businesses.distinct("city")
    if not cities:
        cities = ["Nottingham"]  # Start with launch city
    
    cuisines = ["Turkish", "Italian", "Indian", "Chinese", "Japanese", "Mexican",
                "Thai", "Vietnamese", "British", "Greek", "American", "Korean"]
    
    pages_created = 0
    
    for city in cities[:3]:  # Cap at 3 cities per run
        for cuisine in cuisines[:4]:  # Cap at 4 cuisines per city
            # Check if page already exists
            slug = f"{cuisine.lower()}-restaurants-{city.lower().replace(' ', '-')}"
            existing = await db.seo_pages.find_one({"slug": slug})
            if existing:
                continue
            
            # Generate with AI
            result = await run_agent(
                task=f"""Generate an SEO page for "{cuisine} restaurants in {city}".

Write a 2-paragraph intro (150-200 words) that:
- Mentions the specific food culture of {city}
- References what makes {cuisine} food special in this area
- Includes natural keywords: "{cuisine.lower()} restaurants {city.lower()}", "best {cuisine.lower()} food {city.lower()}"
- Sounds genuinely helpful, not keyword-stuffed
- Is written in British English

Also generate:
- Page title (under 60 chars): "Best {cuisine} Restaurants in {city} | Rezvo"
- Meta description (under 155 chars)
- 3 FAQ questions and answers about {cuisine} dining in {city}

Return as a structured format I can parse.""",
                tools=[],  # No tools needed, pure generation
                model=MODEL_HAIKU,
                max_turns=1,
                task_type="seo_content",
            )
            
            await db.seo_pages.insert_one({
                "slug": slug,
                "city": city,
                "cuisine": cuisine,
                "content": result["result"],
                "status": "review",  # Human reviews before publishing
                "created_at": datetime.utcnow(),
            })
            pages_created += 1
    
    return {"pages_created": pages_created}


# ═══════════════════════════════════════════════════════════
# TASK 10: AUTO-ONBOARDING FOLLOW-UP (every 30 mins)
# ═══════════════════════════════════════════════════════════

async def process_onboarding_drip():
    """Process the 5-email onboarding drip for new restaurants."""
    db = get_database()
    if db is None:
        return
    
    now = datetime.utcnow()
    processed = 0
    
    # Drip schedule: immediate, +24h, after first login, +72h, +7d
    drip_delays = {
        0: timedelta(hours=0),    # Welcome — sent on signup
        1: timedelta(hours=24),   # Engagement nudge
        2: timedelta(hours=48),   # Quick wins (or after first login)
        3: timedelta(hours=72),   # Social proof
        4: timedelta(days=7),     # Check-in
    }
    
    drip_subjects = {
        0: "Welcome to Rezvo — your page is live!",
        1: "Your restaurant dashboard is waiting",
        2: "3 quick things that'll make your page shine",
        3: "How {name} doubled their bookings in 2 weeks",
        4: "How's everything going?",
    }
    
    async for biz in db.businesses.find({
        "onboarding_complete": {"$ne": True},
        "onboarding_drip_step": {"$lt": 5},
        "email": {"$exists": True},
    }):
        step = biz.get("onboarding_drip_step", 0)
        last_sent = biz.get("onboarding_last_sent")
        
        # Check if enough time has passed
        if last_sent:
            delay = drip_delays.get(step, timedelta(days=1))
            if (now - last_sent) < delay:
                continue
        
        # Skip step 2 if they haven't logged in yet (wait for step 1 to work)
        if step == 2 and not biz.get("last_login_at"):
            continue
        
        # Generate personalised drip email
        biz_name = biz.get("name", "there")
        subject = drip_subjects.get(step, "Quick update from Rezvo").replace("{name}", biz_name)
        
        result = await run_agent(
            task=f"""Generate onboarding drip email step {step} for restaurant "{biz_name}".

Step descriptions:
0: Welcome — show them their live profile URL, link to dashboard
1: Engagement nudge — drive first dashboard visit, mention what they can customise
2: Quick wins — upload menu, add photos, set booking rules
3: Social proof — share a case study of a similar restaurant
4: Check-in — ask how things are going, offer help, mention features they haven't tried

Requirements:
- Under 200 words
- One clear CTA button
- Warm, British tone
- Reference their restaurant by name
- Dashboard link: https://rezvo.app/dashboard

Send the email to {biz.get('email')}. Subject: {subject}""",
            tools=["send_email"],
            model=MODEL_HAIKU,
            max_turns=3,
            task_type="onboarding_drip",
        )
        
        # Advance drip
        await db.businesses.update_one(
            {"_id": biz["_id"]},
            {"$set": {
                "onboarding_drip_step": step + 1,
                "onboarding_last_sent": now,
            }}
        )
        processed += 1
        
        if processed >= 20:  # Cap per run
            break
    
    return {"processed": processed}


# ═══════════════════════════════════════════════════════════
# TASK 11: KNOWLEDGE BASE LEARNING (daily)
# ═══════════════════════════════════════════════════════════

async def learn_from_conversations():
    """Analyse recent chatbot conversations and improve the knowledge base."""
    db = get_database()
    if db is None:
        return
    
    # Find conversations with positive feedback
    good_convos = []
    async for doc in db.chat_conversations.find({
        "feedback": "positive",
        "indexed": {"$ne": True},
    }).limit(10):
        doc["_id"] = str(doc["_id"])
        good_convos.append(doc)
    
    if not good_convos:
        return {"result": "No new positive conversations to learn from"}
    
    # Use agent to extract knowledge
    result = await run_agent(
        task=f"""Analyse these {len(good_convos)} positively-rated chatbot conversations.

For each conversation:
1. Identify the customer's question/intent
2. Extract the answer that satisfied them
3. If it covers a topic not in the knowledge base, create a new knowledge entry

Conversations:
{[{'question': c.get('messages', [{}])[0].get('content', ''), 'answer': c.get('messages', [{}])[-1].get('content', '')} for c in good_convos[:5]]}

Index any new knowledge that would help answer similar questions in the future.
Tag entries with relevant categories: faq, booking, menu, payment, technical, hours.""",
        tools=["search_knowledge_base", "index_knowledge"],
        model=MODEL_HAIKU,
        max_turns=6,
        task_type="knowledge_learning",
    )
    
    # Mark conversations as indexed
    from bson import ObjectId
    for convo in good_convos:
        await db.chat_conversations.update_one(
            {"_id": ObjectId(convo["_id"])},
            {"$set": {"indexed": True}}
        )
    
    return {"conversations_processed": len(good_convos)}
