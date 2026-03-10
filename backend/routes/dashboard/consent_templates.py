"""
Consent Form Template Library — Pre-built UK aesthetics templates.
50+ templates ready to use, owner can customise.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from database import get_database
from middleware.tenant_db import get_scoped_db
from middleware.tenant import verify_business_access, TenantContext

router = APIRouter(prefix="/consent-templates", tags=["consent-templates"])

# ═══ PRE-BUILT TEMPLATE LIBRARY ═══
TEMPLATE_LIBRARY = [
    # ─── INJECTABLES ───
    {"id":"tpl_botox","name":"Anti-Wrinkle (Botox)","category":"Injectables","treatment":"Botulinum Toxin","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","previous_treatments","photos_consent","treatment_risks","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","neuromuscular_disorders","allergy_botulinum","active_skin_infection","blood_thinners"],"aftercare":"tpl_ac_botox"},
    {"id":"tpl_dermal_filler","name":"Dermal Filler","category":"Injectables","treatment":"Hyaluronic Acid Filler","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","previous_treatments","filler_specific_risks","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","autoimmune_disorders","allergy_lidocaine","active_skin_infection","blood_thinners"],"aftercare":"tpl_ac_filler"},
    {"id":"tpl_lip_filler","name":"Lip Filler","category":"Injectables","treatment":"Lip Augmentation","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","cold_sore_history","previous_treatments","lip_specific_risks","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","active_cold_sore","allergy_lidocaine","blood_thinners"],"aftercare":"tpl_ac_lip"},
    {"id":"tpl_skin_boosters","name":"Skin Boosters","category":"Injectables","treatment":"Skin Boosters (Profhilo/Seventy Hyal)","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","autoimmune_disorders","active_skin_infection"],"aftercare":"tpl_ac_boosters"},
    {"id":"tpl_polynucleotides","name":"Polynucleotides","category":"Injectables","treatment":"Polynucleotide Treatment","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","autoimmune_disorders","fish_allergy","active_skin_infection"],"aftercare":"tpl_ac_polynucleotides"},
    {"id":"tpl_prp","name":"PRP (Platelet-Rich Plasma)","category":"Injectables","treatment":"PRP Therapy","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","blood_disorders","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","blood_disorders","anticoagulants","active_infection","cancer"],"aftercare":"tpl_ac_prp"},
    {"id":"tpl_thread_lift","name":"Thread Lift","category":"Injectables","treatment":"PDO Thread Lift","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","previous_treatments","thread_specific_risks","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","autoimmune_disorders","blood_thinners","active_skin_infection","keloid_scarring"],"aftercare":"tpl_ac_threads"},

    # ─── SKIN TREATMENTS ───
    {"id":"tpl_microneedling","name":"Microneedling","category":"Skin Treatments","treatment":"Microneedling / Collagen Induction","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_conditions","previous_treatments","patch_test","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","active_acne","eczema_on_area","blood_thinners","isotretinoin","active_skin_infection","keloid_scarring"],"aftercare":"tpl_ac_microneedling"},
    {"id":"tpl_rf_needling","name":"RF Microneedling","category":"Skin Treatments","treatment":"Radiofrequency Microneedling","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_conditions","metallic_implants","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","pacemaker","metallic_implants_face","active_skin_infection","isotretinoin","epilepsy"],"aftercare":"tpl_ac_rf"},
    {"id":"tpl_chemical_peel","name":"Chemical Peel","category":"Skin Treatments","treatment":"Chemical Peel","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_conditions","sun_exposure","previous_treatments","patch_test","peel_depth_selection","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","active_herpes","isotretinoin","recent_sun_exposure","aspirin_allergy"],"aftercare":"tpl_ac_peel"},
    {"id":"tpl_dermaplaning","name":"Dermaplaning","category":"Skin Treatments","treatment":"Dermaplaning","sections":["personal_info","medical_history","allergies","skin_conditions","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["active_acne","rosacea_on_area","eczema_on_area","blood_thinners","isotretinoin"],"aftercare":"tpl_ac_dermaplaning"},
    {"id":"tpl_ipl","name":"IPL Skin Rejuvenation","category":"Skin Treatments","treatment":"Intense Pulsed Light","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_type_assessment","sun_exposure","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","epilepsy","photosensitive_medication","recent_tan","active_skin_infection","skin_type_vi"],"aftercare":"tpl_ac_ipl"},
    {"id":"tpl_laser","name":"Laser Treatment","category":"Skin Treatments","treatment":"Laser Skin Treatment","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_type_assessment","sun_exposure","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","epilepsy","photosensitive_medication","recent_tan","keloid_scarring","skin_type_vi"],"aftercare":"tpl_ac_laser"},
    {"id":"tpl_led","name":"LED Light Therapy","category":"Skin Treatments","treatment":"LED Phototherapy","sections":["personal_info","medical_history","allergies","medications","epilepsy_check","photosensitivity","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["epilepsy","photosensitive_medication","pregnancy_for_some_wavelengths"],"aftercare":"tpl_ac_led"},
    {"id":"tpl_hydrafacial","name":"HydraFacial","category":"Skin Treatments","treatment":"HydraFacial","sections":["personal_info","medical_history","allergies","skin_conditions","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["active_rosacea","active_herpes","recent_chemical_peel"],"aftercare":"tpl_ac_hydrafacial"},

    # ─── BODY TREATMENTS ───
    {"id":"tpl_lymphatic","name":"Lymphatic Drainage","category":"Body Treatments","treatment":"Manual Lymphatic Drainage","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","lymphatic_conditions","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["active_infection","dvt","heart_failure","kidney_failure","cancer_active"],"aftercare":"tpl_ac_lymphatic"},
    {"id":"tpl_cryotherapy","name":"Cryotherapy / Fat Freezing","category":"Body Treatments","treatment":"Cryolipolysis","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","cold_sensitivity","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","raynauds","cold_urticaria","cryoglobulinemia","hernia_on_area"],"aftercare":"tpl_ac_cryo"},
    {"id":"tpl_body_sculpting","name":"Body Sculpting (RF)","category":"Body Treatments","treatment":"RF Body Contouring","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","metallic_implants","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","pacemaker","metallic_implants","active_infection"],"aftercare":"tpl_ac_body_rf"},

    # ─── LASHES & BROWS ───
    {"id":"tpl_lash_extensions","name":"Lash Extensions","category":"Lashes & Brows","treatment":"Eyelash Extensions","sections":["personal_info","allergies","eye_conditions","contact_lens","patch_test","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["eye_infection","allergy_cyanoacrylate","recent_eye_surgery","patch_test_reaction"],"aftercare":"tpl_ac_lash_ext"},
    {"id":"tpl_lash_lift","name":"Lash Lift & Tint","category":"Lashes & Brows","treatment":"Lash Lift / Tint","sections":["personal_info","allergies","eye_conditions","patch_test","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["eye_infection","allergy_peroxide","patch_test_reaction"],"aftercare":"tpl_ac_lash_lift"},
    {"id":"tpl_brow_lamination","name":"Brow Lamination","category":"Lashes & Brows","treatment":"Brow Lamination","sections":["personal_info","allergies","skin_conditions","patch_test","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["skin_infection_on_area","allergy_peroxide","patch_test_reaction","eczema_on_area"],"aftercare":"tpl_ac_brow_lam"},
    {"id":"tpl_microblading","name":"Microblading","category":"Lashes & Brows","treatment":"Microblading / Semi-Permanent Brows","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_conditions","previous_treatments","patch_test","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","blood_thinners","diabetes_uncontrolled","keloid_scarring","isotretinoin","active_skin_infection"],"aftercare":"tpl_ac_microblading"},

    # ─── HAIR REMOVAL ───
    {"id":"tpl_laser_hair","name":"Laser Hair Removal","category":"Hair Removal","treatment":"Laser Hair Removal","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_type_assessment","sun_exposure","previous_treatments","patch_test","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","epilepsy","photosensitive_medication","recent_tan","active_skin_infection","isotretinoin","tattoo_on_area"],"aftercare":"tpl_ac_laser_hair"},
    {"id":"tpl_waxing","name":"Waxing","category":"Hair Removal","treatment":"Waxing","sections":["personal_info","allergies","skin_conditions","medications","patch_test","aftercare_acknowledgement","signature"],"contraindications":["isotretinoin","blood_thinners","active_skin_infection","sunburn_on_area","recent_chemical_peel"],"aftercare":"tpl_ac_waxing"},
    {"id":"tpl_electrolysis","name":"Electrolysis","category":"Hair Removal","treatment":"Electrolysis","sections":["personal_info","medical_history","allergies","medications","pacemaker_check","skin_conditions","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pacemaker","active_skin_infection","keloid_scarring","epilepsy"],"aftercare":"tpl_ac_electrolysis"},

    # ─── NAILS ───
    {"id":"tpl_gel_nails","name":"Gel Nails / Manicure","category":"Nails","treatment":"Gel Nail Application","sections":["personal_info","allergies","skin_conditions","nail_conditions","previous_reactions","aftercare_acknowledgement","signature"],"contraindications":["allergy_acrylates","fungal_nail_infection","broken_skin_around_nails"],"aftercare":"tpl_ac_gel_nails"},

    # ─── MASSAGE & BODY ───
    {"id":"tpl_massage","name":"Massage Therapy","category":"Massage & Wellness","treatment":"Massage","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","pain_areas","pressure_preference","aftercare_acknowledgement","signature"],"contraindications":["dvt","fever","open_wounds","fractures","cancer_active"],"aftercare":"tpl_ac_massage"},
    {"id":"tpl_sports_massage","name":"Sports Massage","category":"Massage & Wellness","treatment":"Deep Tissue / Sports Massage","sections":["personal_info","medical_history","allergies","medications","injury_history","pain_areas","pressure_preference","aftercare_acknowledgement","signature"],"contraindications":["dvt","fever","open_wounds","fractures","recent_surgery"],"aftercare":"tpl_ac_sports_massage"},

    # ─── TATTOO ───
    {"id":"tpl_tattoo","name":"Tattoo Consent","category":"Tattoo & Piercing","treatment":"Tattoo","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","blood_disorders","previous_reactions","design_confirmation","age_verification","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","blood_thinners","hepatitis","hiv","intoxication","under_18"],"aftercare":"tpl_ac_tattoo"},
    {"id":"tpl_tattoo_removal","name":"Tattoo Removal (Laser)","category":"Tattoo & Piercing","treatment":"Laser Tattoo Removal","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","skin_type_assessment","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","photosensitive_medication","recent_tan","keloid_scarring"],"aftercare":"tpl_ac_tattoo_removal"},
    {"id":"tpl_piercing","name":"Body Piercing","category":"Tattoo & Piercing","treatment":"Piercing","sections":["personal_info","medical_history","allergies","blood_disorders","age_verification","piercing_location","aftercare_acknowledgement","signature"],"contraindications":["blood_thinners","hepatitis","keloid_scarring","intoxication","under_16"],"aftercare":"tpl_ac_piercing"},

    # ─── DENTAL / AESTHETICS ───
    {"id":"tpl_teeth_whitening","name":"Teeth Whitening","category":"Dental Aesthetics","treatment":"Teeth Whitening","sections":["personal_info","dental_history","allergies","sensitivity_check","pregnancy_check","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["pregnancy","breastfeeding","active_tooth_decay","gum_disease","under_18","peroxide_allergy"],"aftercare":"tpl_ac_whitening"},
    {"id":"tpl_composite_bonding","name":"Composite Bonding","category":"Dental Aesthetics","treatment":"Dental Composite Bonding","sections":["personal_info","dental_history","allergies","medications","bruxism_check","previous_treatments","photos_consent","aftercare_acknowledgement","signature"],"contraindications":["active_tooth_decay","severe_bruxism","gum_disease"],"aftercare":"tpl_ac_bonding"},

    # ─── GENERAL ───
    {"id":"tpl_consultation","name":"General Consultation","category":"General","treatment":"Initial Consultation","sections":["personal_info","medical_history","allergies","medications","pregnancy_check","lifestyle","skin_assessment","goals","photos_consent","gdpr_consent","signature"],"contraindications":[],"aftercare":None},
    {"id":"tpl_patch_test","name":"Patch Test Record","category":"General","treatment":"Patch Test","sections":["personal_info","test_product","test_location","test_date","result_date","result_observation","practitioner_notes","signature"],"contraindications":[],"aftercare":None},
    {"id":"tpl_gdpr","name":"GDPR / Data Consent","category":"General","treatment":"Data Processing","sections":["personal_info","data_usage","marketing_consent","photo_consent","third_party_sharing","retention_period","right_to_erasure","signature"],"contraindications":[],"aftercare":None},
]

# ═══ AFTERCARE TEMPLATES ═══
AFTERCARE_LIBRARY = [
    {"id":"tpl_ac_botox","name":"Anti-Wrinkle Aftercare","treatment":"Botulinum Toxin","instructions":["Do not touch or rub the treated area for 4-6 hours","Stay upright for 4 hours — do not lie down","Avoid strenuous exercise for 24 hours","Avoid alcohol for 24 hours","Avoid facials, saunas, and steam rooms for 2 weeks","Results typically appear within 5-14 days","Contact us immediately if you experience difficulty swallowing, breathing, or speaking"]},
    {"id":"tpl_ac_filler","name":"Dermal Filler Aftercare","treatment":"Hyaluronic Acid Filler","instructions":["Apply ice packs gently to reduce swelling (10 mins on, 10 mins off)","Avoid touching or pressing the treated area for 6 hours","Avoid strenuous exercise for 24-48 hours","Avoid alcohol for 24 hours","Sleep on your back for the first night","Swelling and bruising are normal and should subside within 7-14 days","Avoid extreme heat (saunas, hot tubs) for 2 weeks","Contact us if you notice persistent blanching, severe pain, or vision changes"]},
    {"id":"tpl_ac_lip","name":"Lip Filler Aftercare","treatment":"Lip Augmentation","instructions":["Apply ice packs gently (10 mins on/off) for the first 24 hours","Avoid kissing or pressure on lips for 24 hours","Do not drink through straws for 24 hours","Avoid hot drinks for 24 hours — use lukewarm or cold","Avoid strenuous exercise for 48 hours","Swelling peaks at 24-48 hours then gradually reduces","Take Arnica tablets to help with bruising","Contact us immediately if you notice severe pain, blanching, or unusual lumps"]},
    {"id":"tpl_ac_microneedling","name":"Microneedling Aftercare","treatment":"Microneedling","instructions":["Skin will be red and feel warm — this is normal and subsides within 24-72 hours","Do not apply makeup for 24 hours","Use only the recommended post-treatment serum for 24 hours","Avoid direct sun exposure for 7 days — use SPF 50 daily","Avoid swimming, saunas, and steam for 72 hours","Do not exfoliate or use active ingredients (retinol, AHAs, BHAs) for 7 days","Keep skin hydrated with a gentle moisturiser","Peeling may occur — do not pick at the skin"]},
    {"id":"tpl_ac_peel","name":"Chemical Peel Aftercare","treatment":"Chemical Peel","instructions":["Redness and tightness are normal for 24-72 hours","Do not pick, peel, or scratch flaking skin","Apply SPF 50 daily for at least 2 weeks","Avoid direct sun exposure for 2 weeks minimum","Use only gentle cleanser and moisturiser for 7 days","Avoid retinol, AHAs, BHAs, and exfoliants for 14 days","Avoid swimming and saunas for 7 days","Stay hydrated — drink plenty of water"]},
    {"id":"tpl_ac_rf","name":"RF Microneedling Aftercare","treatment":"Radiofrequency Microneedling","instructions":["Redness and slight swelling normal for 24-72 hours","Do not apply makeup for 24 hours","Use SPF 50 daily for 2 weeks","Avoid active skincare ingredients for 7 days","Avoid sun exposure, saunas, and swimming for 7 days","Keep skin hydrated","Results improve over 4-12 weeks as collagen remodels"]},
    {"id":"tpl_ac_polynucleotides","name":"Polynucleotides Aftercare","treatment":"Polynucleotides","instructions":["Small bumps at injection sites are normal — resolve within 24-48 hours","Avoid touching the treated area for 6 hours","Avoid strenuous exercise for 24 hours","Avoid alcohol for 24 hours","Apply SPF 50 daily","Results develop over 2-4 weeks","A course of treatments is usually recommended for best results"]},
    {"id":"tpl_ac_dermaplaning","name":"Dermaplaning Aftercare","treatment":"Dermaplaning","instructions":["Skin may be slightly pink — this resolves within hours","Apply SPF 50 — your skin is more sensitive to UV after treatment","Avoid direct sun exposure for 48 hours","Avoid exfoliants and active ingredients for 48 hours","Skin will feel very smooth — moisturise regularly","Makeup can be applied after 24 hours"]},
    {"id":"tpl_ac_boosters","name":"Skin Boosters Aftercare","treatment":"Skin Boosters","instructions":["Small bumps at injection sites resolve within 24-48 hours","Avoid touching the area for 6 hours","Avoid makeup for 24 hours","Avoid exercise, alcohol, and heat for 24 hours","Apply SPF 50 daily","Results improve over 2-4 weeks","Stay hydrated for best results"]},
    {"id":"tpl_ac_ipl","name":"IPL Aftercare","treatment":"Intense Pulsed Light","instructions":["Redness and warmth normal for 2-6 hours","Apply cool compresses if uncomfortable","Apply SPF 50 daily for 4 weeks minimum","Avoid sun exposure for 4 weeks","Avoid hot showers, saunas, and exercise for 24 hours","Pigmented spots may darken before flaking off — do not pick","Avoid retinol and active ingredients for 7 days"]},
    {"id":"tpl_ac_laser","name":"Laser Treatment Aftercare","treatment":"Laser","instructions":["Follow specific aftercare for your laser type","Apply SPF 50 daily for 4+ weeks","Avoid sun exposure","Keep the area clean and moisturised","Do not pick at any scabbing or peeling","Contact us if you notice blistering or signs of infection"]},
    {"id":"tpl_ac_led","name":"LED Light Therapy Aftercare","treatment":"LED Phototherapy","instructions":["No downtime — resume normal activities immediately","Apply SPF if going outdoors","Stay hydrated","Results are cumulative — a course of treatments is recommended"]},
    {"id":"tpl_ac_lymphatic","name":"Lymphatic Drainage Aftercare","treatment":"Lymphatic Drainage","instructions":["Drink 2-3 litres of water over the next 24 hours","You may feel tired — rest if needed","Avoid alcohol and caffeine for 24 hours","Light exercise (walking) is beneficial","You may notice increased urination — this is normal drainage"]},
    {"id":"tpl_ac_hydrafacial","name":"HydraFacial Aftercare","treatment":"HydraFacial","instructions":["No downtime — skin may appear glowing and slightly flushed","Apply SPF 50","Avoid heavy makeup for 6 hours","Avoid exfoliants for 48 hours","Stay hydrated"]},
    {"id":"tpl_ac_lash_ext","name":"Lash Extensions Aftercare","treatment":"Eyelash Extensions","instructions":["Avoid getting lashes wet for 24-48 hours","Do not use oil-based products near eyes","Sleep on your back to preserve shape","Avoid rubbing your eyes","Use a spoolie to brush lashes daily","Avoid waterproof mascara","Book infill every 2-3 weeks"]},
    {"id":"tpl_ac_lash_lift","name":"Lash Lift Aftercare","treatment":"Lash Lift / Tint","instructions":["Do not wet lashes for 24 hours","Avoid steam and saunas for 48 hours","Do not rub your eyes","Avoid oil-based products near eyes for 24 hours","Results last 6-8 weeks"]},
    {"id":"tpl_ac_brow_lam","name":"Brow Lamination Aftercare","treatment":"Brow Lamination","instructions":["Do not get brows wet for 24 hours","Avoid steam and saunas for 48 hours","Do not rub or pick at brows","Apply the provided brow oil daily","Results last 6-8 weeks"]},
    {"id":"tpl_ac_microblading","name":"Microblading Aftercare","treatment":"Microblading","instructions":["Do not wet the area for 10 days","Apply the healing balm provided as directed","Do not pick or scratch — let scabs fall naturally","Avoid sun exposure for 4 weeks","Avoid swimming and saunas for 2 weeks","Colour will appear darker initially — it fades 30-50% during healing","Book touch-up appointment at 6-8 weeks"]},
    {"id":"tpl_ac_laser_hair","name":"Laser Hair Removal Aftercare","treatment":"Laser Hair Removal","instructions":["Treated area may feel like mild sunburn — apply aloe vera","Avoid sun exposure for 2 weeks — use SPF 50","Avoid hot showers, saunas, and swimming for 48 hours","Do not shave the area for 48 hours","Avoid deodorant (if underarms treated) for 24 hours","Hair will shed over 1-3 weeks — this is normal","Next session in 4-8 weeks depending on area"]},
    {"id":"tpl_ac_waxing","name":"Waxing Aftercare","treatment":"Waxing","instructions":["Avoid hot baths and showers for 24 hours","Avoid tight clothing on treated area","Apply soothing lotion if needed","Avoid sun exposure and tanning for 48 hours","Exfoliate gently after 48 hours to prevent ingrown hairs","Avoid deodorant (if underarms) for 24 hours"]},
    {"id":"tpl_ac_tattoo","name":"Tattoo Aftercare","treatment":"Tattoo","instructions":["Keep the wrapping on for 2-4 hours","Wash gently with lukewarm water and antibacterial soap","Apply thin layer of recommended aftercare cream 2-3 times daily","Do not pick, scratch, or peel","Avoid swimming and soaking for 2 weeks","Avoid direct sun exposure — use SPF once healed","Wear loose clothing over the area","Healing takes 2-4 weeks"]},
    {"id":"tpl_ac_tattoo_removal","name":"Tattoo Removal Aftercare","treatment":"Laser Tattoo Removal","instructions":["Apply ice packs to reduce swelling","Keep area clean and dry","Apply antibiotic cream as directed","Avoid sun exposure for 4 weeks","Blistering is normal — do not pop blisters","Avoid swimming for 2 weeks","Next session in 6-8 weeks"]},
    {"id":"tpl_ac_whitening","name":"Teeth Whitening Aftercare","treatment":"Teeth Whitening","instructions":["Avoid coloured food and drinks for 48 hours (coffee, red wine, curry, berries)","Use a white diet for 48 hours","Sensitivity is normal — use sensitive toothpaste","Avoid smoking for 48 hours","Results last 6-12 months depending on lifestyle"]},
    {"id":"tpl_ac_gel_nails","name":"Gel Nails Aftercare","treatment":"Gel Nails","instructions":["Wear gloves when cleaning with chemicals","Avoid using nails as tools","Apply cuticle oil daily","Book removal/infill — do not peel gel off yourself","Return for infill every 2-3 weeks"]},
    {"id":"tpl_ac_massage","name":"Massage Aftercare","treatment":"Massage","instructions":["Drink plenty of water for the next 24 hours","You may feel mild soreness — this is normal","Avoid strenuous exercise for 24 hours","Take a warm (not hot) bath if needed","Rest and relax for the remainder of the day if possible"]},
]


@router.get("/library")
async def get_template_library(
    category: str = Query(None),
    search: str = Query(None),
):
    """Public: Browse template library (no auth needed for discovery)."""
    templates = TEMPLATE_LIBRARY
    if category:
        templates = [t for t in templates if t["category"].lower() == category.lower()]
    if search:
        q = search.lower()
        templates = [t for t in templates if q in t["name"].lower() or q in t.get("treatment", "").lower() or q in t.get("category", "").lower()]

    categories = sorted(set(t["category"] for t in TEMPLATE_LIBRARY))
    return {"templates": templates, "categories": categories, "total": len(templates)}


@router.get("/library/{template_id}")
async def get_template_detail(template_id: str):
    """Get full template with sections and aftercare."""
    tpl = next((t for t in TEMPLATE_LIBRARY if t["id"] == template_id), None)
    if not tpl:
        raise HTTPException(404, "Template not found")

    aftercare = None
    if tpl.get("aftercare"):
        aftercare = next((a for a in AFTERCARE_LIBRARY if a["id"] == tpl["aftercare"]), None)

    return {"template": tpl, "aftercare": aftercare}


@router.get("/aftercare")
async def get_aftercare_library(search: str = Query(None)):
    """Browse aftercare templates."""
    templates = AFTERCARE_LIBRARY
    if search:
        q = search.lower()
        templates = [t for t in templates if q in t["name"].lower() or q in t.get("treatment", "").lower()]
    return {"templates": templates, "total": len(templates)}


@router.post("/business/{business_id}/install")
async def install_template(
    business_id: str,
    payload: dict = Body(...),
    tenant: TenantContext = Depends(verify_business_access),
):
    """Install a template from the library into the business's consultation forms."""
    template_id = payload.get("template_id")
    tpl = next((t for t in TEMPLATE_LIBRARY if t["id"] == template_id), None)
    if not tpl:
        raise HTTPException(404, "Template not found")

    sdb = get_scoped_db(tenant.business_id)

    # Check if already installed
    existing = await sdb.consultation_forms.find_one({"business_id": tenant.business_id, "source_template": template_id})
    if existing:
        return {"status": "already_installed", "form_id": existing.get("id")}

    import random, string
    form_id = f"form_{''.join(random.choices(string.ascii_lowercase + string.digits, k=10))}"

    form = {
        "id": form_id,
        "business_id": tenant.business_id,
        "name": tpl["name"],
        "treatment": tpl["treatment"],
        "category": tpl["category"],
        "sections": tpl["sections"],
        "contraindications": tpl["contraindications"],
        "aftercare_template": tpl.get("aftercare"),
        "source_template": template_id,
        "active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await sdb.consultation_forms.insert_one(form)
    form.pop("_id", None)
    return {"status": "installed", "form": form}
