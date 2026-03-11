"""
Seed Rejuvenate Skin Experts website into the Website Builder.
Creates pages with Puck JSON data matching the live Rejuvenate site.

Run on VPS: cd /opt/rezvo-app && python3 backend/scripts/seed_rejuvenate_website.py
"""
import asyncio
from datetime import datetime
from bson import ObjectId

from dotenv import load_dotenv
load_dotenv("/opt/rezvo-app/backend/.env")
import sys
sys.path.insert(0, "/opt/rezvo-app/backend")


async def main():
    from motor.motor_asyncio import AsyncIOMotorClient
    import os

    client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    db = client[os.getenv("MONGODB_DB", "rezvo")]

    # Find Rejuvenate business
    biz = await db.businesses.find_one({"name": {"$regex": "rejuv", "$options": "i"}})
    if not biz:
        print("ERROR: Rejuvenate business not found. Run seed_rejuvenate.py first.")
        return

    bid = str(biz["_id"])
    print(f"Found business: {biz['name']} ({bid})")

    # Clean existing website data for this business
    await db.website_pages.delete_many({"business_id": bid})
    await db.website_settings.delete_many({"business_id": bid})
    print("Cleared existing website data.")

    # ─── WEBSITE SETTINGS ───
    settings = {
        "business_id": bid,
        "brand": {
            "business_name": "Rejuvenate Skin Experts",
            "tagline": "Where Your Skin Story Begins",
            "logo_url": "",
            "primary_color": "#2C3E2D",
            "secondary_color": "#C4A265",
            "accent_color": "#FAF7F2",
            "font": "Cormorant Garamond",
            "body_font": "DM Sans",
        },
        "navigation": {
            "items": [
                {"label": "Home", "slug": "/home"},
                {"label": "Treatments", "slug": "/treatments"},
                {"label": "About", "slug": "/about"},
                {"label": "Contact", "slug": "/contact"},
            ]
        },
        "footer": {
            "text": "© 2026 Rejuvenate Skin Experts, Barry, Wales.",
            "links": [
                {"label": "Privacy", "url": "#"},
                {"label": "Terms", "url": "#"},
            ]
        },
        "seo": {
            "title_format": "{page_title} | Rejuvenate Skin Experts",
            "meta_description": "Cardiff's Premier Skin Clinic. Advanced aesthetics treatments by qualified professionals.",
        },
        "subdomain": "rejuvenate-skin-experts",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.website_settings.insert_one(settings)
    print("Website settings created.")

    # ─── HOME PAGE ───
    home_puck = {
        "root": {},
        "content": [
            {
                "type": "HeroBanner",
                "props": {
                    "id": "hero-1",
                    "heading": "Where Your Skin Story Begins",
                    "subheading": "Expert aesthetics treatments in Barry, Wales. Personalised care for visible, lasting results — by qualified professionals who genuinely care about your skin.",
                    "buttonText": "Book Your Consultation",
                    "buttonUrl": "/book",
                    "bgImage": "",
                    "bgColor": "#2C3E2D",
                    "overlayOpacity": "0",
                    "minHeight": "500px",
                    "textColor": "#ffffff",
                }
            },
            {
                "type": "Section",
                "props": {
                    "id": "gateway-section",
                    "bgColor": "#FAF7F2",
                    "padding": "xl",
                    "maxWidth": "1140px",
                }
            },
            {
                "type": "Heading",
                "props": {
                    "id": "gateway-heading",
                    "text": "Choose Your Path",
                    "level": "h2",
                    "align": "center",
                    "color": "#1A1A1A",
                }
            },
            {
                "type": "Spacer",
                "props": {"id": "spacer-1", "height": "32"}
            },
            {
                "type": "Columns",
                "props": {
                    "id": "gateway-cols",
                    "columns": "3",
                    "gap": "24",
                }
            },
            {
                "type": "ServiceCard",
                "props": {
                    "id": "card-treatments",
                    "title": "I Know What I Want",
                    "description": "You've done your research. You know the treatment — now you want it done properly, by someone who's an expert. Jump straight to booking.",
                    "price": "From £45",
                    "duration": "20-90 min",
                    "image": "",
                }
            },
            {
                "type": "ServiceCard",
                "props": {
                    "id": "card-new",
                    "title": "I'm New to This",
                    "description": "No idea where to start? That's completely fine. Book a skin consultation and we'll build a personalised treatment plan together.",
                    "price": "Free",
                    "duration": "30 min",
                    "image": "",
                }
            },
            {
                "type": "ServiceCard",
                "props": {
                    "id": "card-chat",
                    "title": "Meet Natalie. Get Honest Advice.",
                    "description": "You want to know who's treating your skin before you commit. Book a virtual chat or an AI skin scan — no hard sell, just genuine expertise.",
                    "price": "",
                    "duration": "",
                    "image": "",
                }
            },
            {
                "type": "Spacer",
                "props": {"id": "spacer-2", "height": "64"}
            },
            {
                "type": "Section",
                "props": {
                    "id": "trust-section",
                    "bgColor": "#ffffff",
                    "padding": "l",
                    "maxWidth": "1140px",
                }
            },
            {
                "type": "Columns",
                "props": {
                    "id": "trust-cols",
                    "columns": "4",
                    "gap": "24",
                }
            },
            {
                "type": "IconText",
                "props": {"id": "trust-1", "icon": "star", "text": "17+ Years Experience", "iconSize": "28"}
            },
            {
                "type": "IconText",
                "props": {"id": "trust-2", "icon": "star", "text": "418+ Five-Star Reviews", "iconSize": "28"}
            },
            {
                "type": "IconText",
                "props": {"id": "trust-3", "icon": "star", "text": "5.0 Fresha Rating", "iconSize": "28"}
            },
            {
                "type": "IconText",
                "props": {"id": "trust-4", "icon": "check", "text": "Dermalogica Certified Partner", "iconSize": "28"}
            },
        ]
    }

    home_page = {
        "business_id": bid,
        "slug": "home",
        "title": "Home",
        "puck_data": home_puck,
        "is_published": True,
        "is_homepage": True,
        "seo_title": "Rejuvenate Skin Experts | Cardiff's Premier Skin Clinic",
        "seo_description": "Expert aesthetics treatments in Barry, Wales. Personalised care for visible, lasting results.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "deleted": False,
    }

    # ─── TREATMENTS PAGE ───
    treatments_puck = {
        "root": {},
        "content": [
            {
                "type": "Section",
                "props": {"id": "treatments-hero", "bgColor": "#FAF7F2", "padding": "xl", "maxWidth": "1140px"}
            },
            {
                "type": "Heading",
                "props": {"id": "treatments-h1", "text": "Our Treatments", "level": "h1", "align": "center", "color": "#1A2A1B"}
            },
            {
                "type": "TextBlock",
                "props": {"id": "treatments-sub", "text": "Every treatment is tailored to your skin. We combine advanced techniques with premium products for results that speak for themselves.", "align": "center", "color": "#7A756D", "fontSize": "1.1rem"}
            },
            {"type": "Spacer", "props": {"id": "s1", "height": "32"}},
            {
                "type": "Heading",
                "props": {"id": "facials-h", "text": "Facials", "level": "h2", "align": "left", "color": "#2C3E2D"}
            },
            {"type": "Columns", "props": {"id": "facial-cols", "columns": "3", "gap": "24"}},
            {
                "type": "ServiceCard",
                "props": {"id": "svc-1", "title": "Luxury Lymphatic Lift Facial", "description": "Holistic treatment promoting relaxation and lymphatic drainage through breathwork, therapeutic techniques, and advanced skincare.", "price": "£85", "duration": "75 min", "image": ""}
            },
            {
                "type": "ServiceCard",
                "props": {"id": "svc-2", "title": "Express Lymphatic Lift", "description": "A shorter version of our signature lymphatic facial for those short on time.", "price": "£55", "duration": "45 min", "image": ""}
            },
            {
                "type": "ServiceCard",
                "props": {"id": "svc-3", "title": "Dermaplaning Facial", "description": "Non-surgical facial exfoliation removing dead skin cells and peach fuzz for a smooth, radiant complexion.", "price": "£65", "duration": "60 min", "image": ""}
            },
            {"type": "Spacer", "props": {"id": "s2", "height": "32"}},
            {
                "type": "Heading",
                "props": {"id": "peels-h", "text": "Chemical Peels", "level": "h2", "align": "left", "color": "#2C3E2D"}
            },
            {"type": "Columns", "props": {"id": "peel-cols", "columns": "3", "gap": "24"}},
            {
                "type": "ServiceCard",
                "props": {"id": "svc-4", "title": "Dermalogica Pro Power Peel", "description": "Professional-grade chemical peel customised to your skin type for deep exfoliation and renewal.", "price": "£75", "duration": "45 min", "image": ""}
            },
            {
                "type": "ServiceCard",
                "props": {"id": "svc-5", "title": "BioRePeelCI3", "description": "Innovative bi-phasic chemical peel providing bio-stimulation without the social downtime.", "price": "£95", "duration": "30 min", "image": ""}
            },
            {
                "type": "ServiceCard",
                "props": {"id": "svc-6", "title": "MelanoPro Peel", "description": "Targeted peel for hyperpigmentation, melasma, and uneven skin tone.", "price": "£110", "duration": "30 min", "image": ""}
            },
            {"type": "Spacer", "props": {"id": "s3", "height": "32"}},
            {
                "type": "Heading",
                "props": {"id": "needle-h", "text": "Microneedling", "level": "h2", "align": "left", "color": "#2C3E2D"}
            },
            {"type": "Columns", "props": {"id": "needle-cols", "columns": "3", "gap": "24"}},
            {
                "type": "ServiceCard",
                "props": {"id": "svc-7", "title": "Microneedling Facial", "description": "Collagen-stimulating treatment using controlled micro-injuries to rejuvenate skin, reduce scarring, and improve texture.", "price": "£120", "duration": "60 min", "image": ""}
            },
            {
                "type": "ServiceCard",
                "props": {"id": "svc-8", "title": "RF Microneedling", "description": "Combines radiofrequency energy with microneedling for enhanced collagen production and skin tightening.", "price": "£180", "duration": "60 min", "image": ""}
            },
            {
                "type": "ServiceCard",
                "props": {"id": "svc-9", "title": "Polynucleotides", "description": "Bio-revitalisation treatment using DNA-derived polynucleotides to deeply regenerate and hydrate the skin.", "price": "£200", "duration": "45 min", "image": ""}
            },
            {"type": "Spacer", "props": {"id": "s4", "height": "32"}},
            {
                "type": "Button",
                "props": {"id": "book-btn", "text": "Book a Treatment", "url": "/book", "variant": "secondary", "align": "center", "size": "lg"}
            },
        ]
    }

    treatments_page = {
        "business_id": bid,
        "slug": "treatments",
        "title": "Treatments",
        "puck_data": treatments_puck,
        "is_published": True,
        "is_homepage": False,
        "seo_title": "Treatments | Rejuvenate Skin Experts",
        "seo_description": "Explore our full range of advanced skin treatments including microneedling, chemical peels, lymphatic lift facials, and more.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "deleted": False,
    }

    # ─── ABOUT PAGE ───
    about_puck = {
        "root": {},
        "content": [
            {
                "type": "Section",
                "props": {"id": "about-hero", "bgColor": "#2C3E2D", "padding": "xl", "maxWidth": "1140px"}
            },
            {
                "type": "Heading",
                "props": {"id": "about-h1", "text": "Meet the Team", "level": "h1", "align": "center", "color": "#ffffff"}
            },
            {
                "type": "TextBlock",
                "props": {"id": "about-sub", "text": "We're a small, dedicated team of skin therapists based in Barry, near Cardiff. Every treatment is personal because we genuinely care about your skin journey.", "align": "center", "color": "rgba(255,255,255,0.8)", "fontSize": "1.1rem"}
            },
            {"type": "Spacer", "props": {"id": "s1", "height": "64"}},
            {"type": "Columns", "props": {"id": "team-cols", "columns": "4", "gap": "24"}},
            {
                "type": "TeamMember",
                "props": {"id": "natalie", "name": "Natalie", "role": "Owner / Lead Therapist", "bio": "17+ years experience. Dermalogica certified. Specialist in microneedling, lymphatic lift, chemical peels, and polynucleotides.", "image": ""}
            },
            {
                "type": "TeamMember",
                "props": {"id": "grace", "name": "Grace", "role": "Senior Therapist", "bio": "Expert in microneedling, dermaplaning, chemical peels, and lymphatic lift treatments.", "image": ""}
            },
            {
                "type": "TeamMember",
                "props": {"id": "emily", "name": "Emily", "role": "Therapist", "bio": "Specialises in dermaplaning, lymphatic lift, and chemical peels.", "image": ""}
            },
            {
                "type": "TeamMember",
                "props": {"id": "jen", "name": "Jen", "role": "Therapist", "bio": "Skilled in lymphatic lift, dermaplaning, and RF needling treatments.", "image": ""}
            },
        ]
    }

    about_page = {
        "business_id": bid,
        "slug": "about",
        "title": "About",
        "puck_data": about_puck,
        "is_published": True,
        "is_homepage": False,
        "seo_title": "About Us | Rejuvenate Skin Experts",
        "seo_description": "Meet the team at Rejuvenate Skin Experts. Qualified skin therapists in Barry, near Cardiff.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "deleted": False,
    }

    # ─── CONTACT PAGE ───
    contact_puck = {
        "root": {},
        "content": [
            {
                "type": "Section",
                "props": {"id": "contact-section", "bgColor": "#FAF7F2", "padding": "xl", "maxWidth": "800px"}
            },
            {
                "type": "Heading",
                "props": {"id": "contact-h1", "text": "Get in Touch", "level": "h1", "align": "center", "color": "#1A2A1B"}
            },
            {
                "type": "TextBlock",
                "props": {"id": "contact-sub", "text": "Have a question about a treatment or want to book a consultation? We'd love to hear from you.", "align": "center", "color": "#7A756D", "fontSize": "1.1rem"}
            },
            {"type": "Spacer", "props": {"id": "s1", "height": "32"}},
            {
                "type": "IconText",
                "props": {"id": "loc", "icon": "location", "text": "Barry, near Cardiff, Wales", "iconSize": "24"}
            },
            {"type": "Spacer", "props": {"id": "s2", "height": "16"}},
            {
                "type": "IconText",
                "props": {"id": "phone", "icon": "phone", "text": "Contact via booking page", "iconSize": "24"}
            },
            {"type": "Spacer", "props": {"id": "s3", "height": "16"}},
            {
                "type": "IconText",
                "props": {"id": "hours", "icon": "clock", "text": "Tue-Sat: 9:00 AM - 6:00 PM | Sun-Mon: Closed", "iconSize": "24"}
            },
            {"type": "Spacer", "props": {"id": "s4", "height": "32"}},
            {
                "type": "Button",
                "props": {"id": "book-btn", "text": "Book a Consultation", "url": "/book", "variant": "secondary", "align": "center", "size": "lg"}
            },
        ]
    }

    contact_page = {
        "business_id": bid,
        "slug": "contact",
        "title": "Contact",
        "puck_data": contact_puck,
        "is_published": True,
        "is_homepage": False,
        "seo_title": "Contact | Rejuvenate Skin Experts",
        "seo_description": "Get in touch with Rejuvenate Skin Experts in Barry, near Cardiff. Book your consultation today.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "deleted": False,
    }

    # ─── INSERT ALL PAGES ───
    result = await db.website_pages.insert_many([
        home_page, treatments_page, about_page, contact_page
    ])
    print(f"Created {len(result.inserted_ids)} website pages: Home, Treatments, About, Contact")

    # Verify
    count = await db.website_pages.count_documents({"business_id": bid, "deleted": False})
    print(f"\nDone. {count} pages in website builder for Rejuvenate.")
    print("Deploy: cd /opt/rezvo-app && git pull && cd frontend && npm run build && cd .. && systemctl restart rezvo-backend")


if __name__ == "__main__":
    asyncio.run(main())
