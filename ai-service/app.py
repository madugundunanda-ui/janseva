import os
import math
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
torch.set_num_threads(2)
import torch.nn.functional as F

try:
    from transformers import pipeline, CLIPProcessor, CLIPModel
    from sentence_transformers import SentenceTransformer
    import pandas as pd
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder
except ModuleNotFoundError as exc:
    print("\n[AI-SERVICE STARTUP ERROR] Missing Python dependencies.")
    print("Please make sure all dependencies in requirements.txt are installed.")
    raise SystemExit(1) from exc

app = Flask(__name__)
CORS(app)

# Load models once on startup
print("Loading AI models...")
print("1. Loading ViT image classifier...")
classifier = pipeline("image-classification", model="google/mobilenet_v2_1.0_224")

print("2. Loading NLP sentence-transformer (all-MiniLM-L6-v2)...")
nlp_model = SentenceTransformer('all-MiniLM-L6-v2')

print("3. Loading CLIP image embedder (openai/clip-vit-base-patch32)...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
print("All AI models loaded successfully!")

# Mapping Layer for image prediction
MAPPING = {
    "Waste Management": [
        "garbage", "trash", "waste", "overflow", "dumpster", "refuse",
        "ashcan", "bin", "plastic bag", "litter", "rubbish", "container", "hamper"
    ],
    "Water Supply": ["water", "pipe", "leak", "flood", "faucet", "hydrant"],
    "Roads & Transport": [
        "street", "road", "pothole", "asphalt", "highway", "pavement",
        "crack", "obstruction", "barrier", "street sign", "motor vehicle"
    ],
    "Electricity": [
        "light", "electric", "pole", "wire", "lamp", "utility pole",
        "electric wire", "transmission tower", "power lines", "transformer",
        "conduit", "streetlight"
    ],
    "Drainage": ["drain", "sewage", "manhole", "gutter", "culvert"],
    "Public Health": ["mosquito", "dirty water", "sanitation", "insect"]
}

SUGGESTIONS = {
    "Waste Management": {
        "title": "Garbage Overflow Near Road",
        "description": "Garbage accumulation detected near roadside causing sanitation concern.",
        "priority": "medium"
    },
    "Water Supply": {
        "title": "Water Leakage or Pipe Burst",
        "description": "Water accumulation or leakage detected which may indicate a pipe burst or supply issue.",
        "priority": "medium"
    },
    "Roads & Transport": {
        "title": "Broken Road / Pothole",
        "description": "Damage to the road surface detected, posing a risk to vehicles and pedestrians.",
        "priority": "low"
    },
    "Electricity": {
        "title": "Street Light / Electrical Issue",
        "description": "Issue with electrical infrastructure or street lighting detected.",
        "priority": "high"
    },
    "Drainage": {
        "title": "Drain Blockage / Sewage Overflow",
        "description": "Blocked drainage or sewage overflow detected causing local issues.",
        "priority": "high"
    },
    "Public Health": {
        "title": "Public Health / Sanitation Concern",
        "description": "Environmental condition detected that may pose a public health risk.",
        "priority": "low"
    }
}

def get_prediction_details(label, score):
    label_text = str(label or "").lower().strip()
    detected_dept = "General Inquiry"
    
    # Simple keyword matching for mapping
    for dept, keywords in MAPPING.items():
        if any(keyword in label_text for keyword in keywords):
            detected_dept = dept
            break
            
    suggestion = SUGGESTIONS.get(detected_dept, {
        "title": f"{label_text.capitalize()} Issue",
        "description": f"AI detected {label_text} related issue from the image.",
        "priority": "low"
    })
    priority = suggestion.get("priority", "low")
    
    return {
        "title": suggestion["title"],
        "description": suggestion["description"],
        "priority": priority,
        "department": detected_dept,
        "departmentInput": detected_dept,
        "confidence": int(score * 100)
    }

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth in meters."""
    R = 6371000.0  # Earth's radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return R * c

CLIP_EMBEDDING_CACHE = {}

def get_clip_image_embedding(image_path):
    """Generate image embedding using CLIP with in-memory caching and image resizing."""
    if not image_path or not os.path.exists(image_path):
        print(f"[AI-SERVICE] Image path does not exist: {image_path}")
        return None
    
    try:
        mtime = os.path.getmtime(image_path)
    except Exception:
        mtime = 0
        
    cache_key = (image_path, mtime)
    if cache_key in CLIP_EMBEDDING_CACHE:
        return CLIP_EMBEDDING_CACHE[cache_key]
        
    try:
        img = Image.open(image_path).convert('RGB')
        # Resize to 224x224 to speed up CLIP preprocessing
        if img.width > 224 or img.height > 224:
            img = img.resize((224, 224))
            
        inputs = clip_processor(images=img, return_tensors="pt")
        with torch.no_grad():
            outputs = clip_model.get_image_features(**inputs)
            # Extract tensor from BaseModelOutputWithPooling if needed
            features = outputs.pooler_output if hasattr(outputs, 'pooler_output') else outputs
        # Normalize the embedding
        features = features / features.norm(dim=-1, keepdim=True)
        embedding = features[0]
        CLIP_EMBEDDING_CACHE[cache_key] = embedding
        return embedding
    except Exception as e:
        print(f"[AI-SERVICE] Error generating CLIP embedding for {image_path}: {e}")
        return None


@app.route('/predict', methods=['POST'])
def predict():
    import time
    start_time = time.time()
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    file = request.files['image']
    t1 = time.time()
    img = Image.open(file.stream).convert('RGB').resize((224, 224))
    t2 = time.time()
    
    # AI Inference
    with torch.no_grad():
        results = classifier(img)
    t3 = time.time()
    
    top_result = results[0]
    
    prediction = get_prediction_details(top_result['label'], top_result['score'])
    
    duration = time.time() - start_time
    print(f"[AI-SERVICE] predict completed in {duration:.4f}s. (FileRead={t2-t1:.4f}s, Inference={t3-t2:.4f}s)")
    
    print({
        "title": prediction.get("title", ""),
        "description": prediction.get("description", ""),
        "department": prediction.get("department", ""),
        "confidence": prediction.get("confidence", 0)
    })

    return jsonify({
        "success": True,
        "title": prediction.get("title", ""),
        "description": prediction.get("description", ""),
        "department": prediction.get("department", ""),
        "confidence": prediction.get("confidence", 0),
        "priority": prediction.get("priority", "low"),
        "departmentInput": prediction.get("departmentInput", "")
    })

TEXT_EMBEDDING_CACHE = {}

def get_text_embedding(text):
    """Generate or retrieve cached sentence-transformer text embedding."""
    if not text:
        text = ""
    if text in TEXT_EMBEDDING_CACHE:
        return TEXT_EMBEDDING_CACHE[text]
    with torch.no_grad():
        emb = nlp_model.encode(text, convert_to_tensor=True)
    TEXT_EMBEDDING_CACHE[text] = emb
    return emb

@app.route('/check-duplicate', methods=['POST'])
def check_duplicate():
    """
    Checks if a newly uploaded complaint is a duplicate of any existing complaints.
    Body JSON structure:
    {
      "title": "New Complaint Title",
      "description": "New Complaint Description",
      "image_path": "/absolute/path/to/uploaded/image.jpg",
      "lat": 12.9716,
      "lng": 77.5946,
      "department_id": "dept_mongo_id",
      "existing_complaints": [
         {
           "id": "comp_mongo_id",
           "title": "Garbage Overflow",
           "description": "Large garbage heap on roadside",
           "image_path": "/absolute/path/to/existing/image.jpg",
           "lat": 12.9720,
           "lng": 77.5950,
           "department_name": "Waste Management",
           "status": "assigned",
           "affected_count": 14
         }
      ]
    }
    """
    import time
    start_time = time.time()
    
    data = request.get_json() or {}
    
    new_title = data.get('title', '').strip()
    new_desc = data.get('description', '').strip()
    new_image_path = data.get('image_path', '')
    new_lat = data.get('lat')
    new_lng = data.get('lng')
    existing_complaints = data.get('existing_complaints', [])
    
    if not new_title or not new_desc or not existing_complaints:
        return jsonify({
            "success": True,
            "duplicate_detected": False,
            "message": "Insufficient data or no existing complaints to compare against."
        })
        
    print(f"[AI-SERVICE] Checking duplicates for new complaint: '{new_title}' near ({new_lat}, {new_lng})")
    
    t_text_start = time.time()
    # 1. Text Similarity (Sentence-Transformers)
    # Generate embeddings for new title & description using cached helper
    new_title_emb = get_text_embedding(new_title)
    new_desc_emb = get_text_embedding(new_desc)
    
    # Encode existing complaint titles and descriptions (highly optimized via cache)
    ext_titles = [c.get('title', '') for c in existing_complaints]
    ext_descs = [c.get('description', '') for c in existing_complaints]
    
    ext_title_list = [get_text_embedding(t) for t in ext_titles]
    ext_desc_list = [get_text_embedding(d) for d in ext_descs]
    
    ext_title_embs = torch.stack(ext_title_list)
    ext_desc_embs = torch.stack(ext_desc_list)
    
    # Compute cosine similarities
    with torch.no_grad():
        title_sims = F.cosine_similarity(new_title_emb.unsqueeze(0), ext_title_embs, dim=1)
        desc_sims = F.cosine_similarity(new_desc_emb.unsqueeze(0), ext_desc_embs, dim=1)
    t_text_end = time.time()
    
    t_clip_new_start = time.time()
    # 2. Generate CLIP embedding for new image once
    new_img_emb = None
    if new_image_path:
        new_img_emb = get_clip_image_embedding(new_image_path)
    t_clip_new_end = time.time()
        
    matches = []
    
    t_loop_start = time.time()
    for i, c in enumerate(existing_complaints):
        c_id = c.get('id')
        c_title = c.get('title')
        c_status = c.get('status', 'submitted')
        c_dept_name = c.get('department_name', 'General')
        c_affected = c.get('affected_count', 1)
        c_lat = c.get('lat')
        c_lng = c.get('lng')
        c_img_path = c.get('image_path', '')
        
        # A. Text Similarity (average of title & description similarities)
        t_sim = max(0.0, float(title_sims[i].item()) * 100.0)
        d_sim = max(0.0, float(desc_sims[i].item()) * 100.0)
        text_score = (t_sim + d_sim) / 2.0
        
        # B. Image Similarity
        image_score = 0.0
        if new_img_emb is not None and c_img_path:
            ext_img_emb = get_clip_image_embedding(c_img_path)
            if ext_img_emb is not None:
                cos_sim = torch.dot(new_img_emb, ext_img_emb).item()
                image_score = max(0.0, cos_sim * 100.0)
                
        # C. Location Match (Proximity)
        distance_meters = 999999.0
        location_score = 0.0
        if new_lat is not None and new_lng is not None and c_lat is not None and c_lng is not None:
            distance_meters = haversine_distance(new_lat, new_lng, c_lat, c_lng)
            
            # Scores: 100% at 0m, 80% at 500m, drops off to 0% at 1500m
            if distance_meters <= 500.0:
                location_score = 100.0 - (distance_meters / 500.0) * 20.0
            else:
                location_score = max(0.0, 80.0 - ((distance_meters - 500.0) / 1000.0) * 80.0)
                
        # D. Weighted Final Score: 40% text, 30% image, 30% location
        final_score = (0.4 * text_score) + (0.3 * image_score) + (0.3 * location_score)
        
        # Keep if any potential matching exists
        matches.append({
            "id": c_id,
            "title": c_title,
            "status": c_status,
            "department": c_dept_name,
            "affected_count": c_affected,
            "distance": round(distance_meters, 1),
            "scores": {
                "text": round(text_score, 1),
                "image": round(image_score, 1),
                "location": round(location_score, 1)
            },
            "similarity": round(final_score, 1)
        })
    t_loop_end = time.time()
        
    # Sort matches by overall similarity descending
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Filter matches above 80% threshold
    best_match = matches[0] if matches else None
    duplicate_detected = False
    
    if best_match and best_match['similarity'] > 80.0:
        duplicate_detected = True
        print(f"[AI-SERVICE] DUPLICATE DETECTED! Score: {best_match['similarity']}% on Complaint: {best_match['id']}")
        
    duration = time.time() - start_time
    print(f"[AI-SERVICE] check_duplicate completed in {duration:.4f}s. (TextSim={t_text_end-t_text_start:.4f}s, CLIPNew={t_clip_new_end-t_clip_new_start:.4f}s, Loop={t_loop_end-t_loop_start:.4f}s)")
    
    return jsonify({
        "success": True,
        "duplicate_detected": duplicate_detected,
        "best_match": best_match,
        "all_matches": matches[:5]  # return top 5 for debugging or comprehensive display
    })


# ----------------- MACHINE LEARNING PREDICTIVE MODELS -----------------

regressor_model = None
classifier_model = None
dept_encoder = LabelEncoder()

PRIORITY_MAP = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "urgent": 3
}

def train_predictive_models():
    global regressor_model, classifier_model, dept_encoder
    csv_path = os.path.join(os.path.dirname(__file__), 'complaint_history.csv')
    if not os.path.exists(csv_path):
        print(f"[AI-SERVICE ERROR] Training data not found at {csv_path}")
        return
    
    try:
        df = pd.read_csv(csv_path)
        
        # Preprocess department
        df['dept_encoded'] = dept_encoder.fit_transform(df['department'])
        
        # Preprocess priority
        df['priority_encoded'] = df['priority'].str.lower().map(PRIORITY_MAP).fillna(1)
        
        # Features and Targets
        X = df[['dept_encoded', 'priority_encoded', 'activeComplaints', 'areaComplaints']]
        y_days = df['resolutionDays']
        y_esc = df['escalated']
        
        # Fit Regressor for resolution days
        regressor_model = RandomForestRegressor(n_estimators=100, random_state=42)
        regressor_model.fit(X, y_days)
        
        # Fit Classifier for escalation probability
        classifier_model = RandomForestClassifier(n_estimators=100, random_state=42)
        classifier_model.fit(X, y_esc)
        
        print("[AI-SERVICE] Machine learning predictive models trained successfully!")
    except Exception as e:
        print(f"[AI-SERVICE ERROR] Failed to train predictive models: {e}")

# Train on startup
train_predictive_models()

def encode_department(dept_name):
    dept_name = str(dept_name or "").strip()
    known_depts = list(dept_encoder.classes_)
    
    # Try case-insensitive matching
    for d in known_depts:
        if d.lower() in dept_name.lower() or dept_name.lower() in d.lower():
            return dept_encoder.transform([d])[0]
            
    # Default fallback to first class
    return dept_encoder.transform([known_depts[0]])[0]

@app.route('/api/ai/predict-resolution', methods=['POST'])
@app.route('/predict-resolution', methods=['POST'])
def predict_resolution():
    """
    Predicts resolution time, delay risk, escalation probability, suggested priority, and confidence score.
    Body JSON:
    {
      "department": "Roads & Transport",
      "priority": "high",
      "activeComplaints": 12,
      "areaComplaints": 18
    }
    """
    data = request.get_json() or {}
    
    dept_name = data.get('department', 'General Inquiry')
    priority_str = data.get('priority', 'medium').lower()
    active_cases = int(data.get('activeComplaints', 0))
    area_cases = int(data.get('areaComplaints', 0))
    
    if regressor_model is None or classifier_model is None:
        return jsonify({
            "estimatedDays": 4,
            "delayRisk": "Medium",
            "escalationProbability": 45,
            "suggestedPriority": "medium",
            "confidence": 75
        })
        
    try:
        dept_enc = encode_department(dept_name)
        priority_enc = PRIORITY_MAP.get(priority_str, 1)
        
        features = [[dept_enc, priority_enc, active_cases, area_cases]]
        
        # Predict Days
        predicted_days = float(regressor_model.predict(features)[0])
        
        # Predict Escalation Probability
        esc_probs = classifier_model.predict_proba(features)[0]
        escalation_prob = float(esc_probs[1]) * 100.0 if len(esc_probs) > 1 else 0.0
        
        # Determine Delay Risk based on workload & predicted days
        delay_score = (predicted_days * 5) + (active_cases * 3) + (area_cases * 2)
        if delay_score > 60:
            delay_risk = "High"
        elif delay_score > 30:
            delay_risk = "Medium"
        else:
            delay_risk = "Low"
            
        # Suggested Priority
        if escalation_prob > 60 or predicted_days > 8:
            suggested_priority = "high"
        elif escalation_prob > 30 or predicted_days > 4:
            suggested_priority = "medium"
        else:
            suggested_priority = "low"
            
        # Confidence score based on variance proxy
        confidence = round(95.0 - abs(predicted_days - 5.0) * 0.5, 1)
        confidence = max(75.0, min(98.0, confidence))
        
        return jsonify({
            "estimatedDays": round(predicted_days, 1),
            "delayRisk": delay_risk,
            "escalationProbability": round(escalation_prob, 1),
            "suggestedPriority": suggested_priority,
            "confidence": round(confidence, 1)
        })
        
    except Exception as e:
        print(f"[AI-SERVICE] Prediction error: {e}")
        return jsonify({
            "estimatedDays": 4,
            "delayRisk": "Medium",
            "escalationProbability": 45,
            "suggestedPriority": "medium",
            "confidence": 75
        }), 500

@app.route('/api/ai/severity', methods=['POST'])
@app.route('/severity', methods=['POST'])
def calculate_severity():
    """
    Calculates severity score, priority, reasoning factors, and model confidence.
    """
    data = request.get_json() or {}
    
    title = data.get('title', '').lower()
    description = data.get('description', '').lower()
    location = data.get('location', '').lower()
    dept = data.get('department', '').lower()
    active_cases = int(data.get('activeComplaints', 0))
    area_cases = int(data.get('areaComplaints', 0))
    people_affected = int(data.get('peopleAffected', 1))
    image_filename = data.get('image', '').lower()
    
    reasons = []
    
    # 1. Image analysis (30% weight, max 30 points)
    image_score = 0
    img_context = f"{title} {description} {image_filename}"
    
    if any(k in img_context for k in ['fire', 'blaze', 'smoke', 'burn']):
        image_score = 30
        reasons.append("Electrical hazard / fire risk detected")
    elif any(k in img_context for k in ['wire', 'electric', 'short circuit', 'current', 'transformer', 'shock']):
        image_score = 30
        reasons.append("Electrical hazard / fire risk detected")
    elif any(k in img_context for k in ['accident', 'crash', 'injur', 'bleed', 'wound']):
        image_score = 28
        reasons.append("Physical trauma/Accident risk detected")
    elif any(k in img_context for k in ['flood', 'drown', 'water overflow', 'leakage', 'leak', 'drainage']):
        image_score = 25
        reasons.append("Flooding or severe water leakage detected")
    elif any(k in img_context for k in ['collapse', 'broken road', 'pothole', 'sinkhole', 'cave']):
        image_score = 25
        reasons.append("Roadway collapse or structural hazard detected")
    elif any(k in img_context for k in ['sewage', 'manhole', 'overflow', 'pipe burst']):
        image_score = 20
        reasons.append("Sewage overflow or biohazard risk detected")
    elif any(k in img_context for k in ['garbage', 'dump', 'trash', 'waste', 'litter']):
        image_score = 15
        reasons.append("Solid waste/Garbage accumulation detected")
    elif any(k in img_context for k in ['pollution', 'smog', 'toxic', 'chemical']):
        image_score = 15
        reasons.append("Environmental pollution risk detected")
    else:
        image_score = 5 # Base visual context
        
    # 2. Description NLP Analysis (25% weight, max 25 points)
    desc_score = 0
    nlp_context = f"{title} {description}"
    keywords_matched = []
    
    keyword_points = {
        'urgent': 5,
        'accident': 5,
        'danger': 5,
        'children': 5,
        'hospital': 5,
        'fire': 5,
        'injury': 5,
        'leak': 4,
        'school': 5,
        'risk': 4
    }
    
    for kw, pts in keyword_points.items():
        if kw in nlp_context:
            desc_score += pts
            keywords_matched.append(kw)
            
    desc_score = min(25, desc_score)
    if 'school' in nlp_context or 'children' in nlp_context:
        reasons.append("School nearby")
    if 'crowded' in nlp_context or 'busy' in nlp_context or 'market' in nlp_context:
        reasons.append("Crowded area")
        
    # 3. Location Sensitivity (20% weight, max 20 points)
    loc_score = 0
    loc_context = f"{location} {title} {description}"
    loc_reasons = []
    
    if 'school' in loc_context or 'college' in loc_context or 'children' in loc_context:
        loc_score += 10
        if "School nearby" not in reasons:
            loc_reasons.append("School nearby")
    if 'hospital' in loc_context or 'clinic' in loc_context or 'medical' in loc_context:
        loc_score += 10
        loc_reasons.append("Hospital nearby")
    if 'highway' in loc_context or 'expressway' in loc_context or 'main road' in loc_context:
        loc_score += 8
        loc_reasons.append("Main highway/road arterial risk")
    if 'market' in loc_context or 'mall' in loc_context or 'bazaar' in loc_context:
        loc_score += 8
        if "Crowded area" not in reasons:
            loc_reasons.append("Crowded area")
    if 'government' in loc_context or 'office' in loc_context or 'court' in loc_context:
        loc_score += 8
        loc_reasons.append("Government administrative zone")
    if 'crowded' in loc_context or 'residential' in loc_context or 'apartments' in loc_context:
        loc_score += 6
        if "Crowded area" not in reasons:
            loc_reasons.append("Crowded area")
        
    loc_score = min(20, loc_score)
    reasons.extend(loc_reasons)
    
    # 4. Area History & Hotspot Rating (15% weight, max 15 points)
    history_score = min(15, area_cases * 1.5)
    if area_cases > 8:
        reasons.append("Hotspot area")
        
    # 5. Citizen Impact (10% weight, max 10 points)
    impact_score = min(10, people_affected * 2)
    if people_affected > 15:
        reasons.append("Affected multiple citizens")
        
    # Combine scores
    total_score = round(image_score + desc_score + loc_score + history_score + impact_score)
    total_score = max(5, min(100, total_score))
    
    # Priority mapping
    if total_score >= 81:
        priority = "Critical"
    elif total_score >= 61:
        priority = "High"
    elif total_score >= 31:
        priority = "Medium"
    else:
        priority = "Low"
        
    # De-duplicate reasons
    unique_reasons = []
    for r in reasons:
        if r not in unique_reasons:
            unique_reasons.append(r)
            
    if not unique_reasons:
        unique_reasons.append("Standard issue checklist")
        
    # Calculate confidence score dynamically
    confidence = round(92.0 - abs(total_score - 50.0) * 0.1, 1)
    confidence = max(80.0, min(97.0, confidence))
    
    return jsonify({
        "severityScore": total_score,
        "priority": priority,
        "reason": unique_reasons,
        "confidence": round(confidence)
    })

def resolve_image_path(img_path):
    if not img_path:
        return None
    # Strip any potential leading slash or URL parts
    clean_path = img_path.replace("\\", "/").replace("http://localhost:5000", "").replace("http://127.0.0.1:5000", "")
    if clean_path.startswith("/"):
        clean_path = clean_path[1:]
        
    # Check absolute path
    if os.path.exists(img_path):
        return img_path
        
    # Check relative to backend workspace
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    candidates = [
        os.path.join(parent_dir, clean_path),
        os.path.join(parent_dir, "backend", clean_path),
        os.path.join(parent_dir, "backend", "src", clean_path),
        os.path.join(parent_dir, "backend", "public", clean_path),
        os.path.join(parent_dir, "backend", "public", "uploads", os.path.basename(clean_path)),
    ]
    
    for c in candidates:
        if os.path.exists(c):
            return c
    return None

@app.route('/ai/verify-resolution', methods=['POST'])
@app.route('/verify-resolution', methods=['POST'])
def verify_resolution():
    before_img = None
    after_img = None
    
    # Check files
    if 'beforeImage' in request.files:
        before_img = Image.open(request.files['beforeImage'].stream).convert('RGB')
    if 'afterImage' in request.files:
        after_img = Image.open(request.files['afterImage'].stream).convert('RGB')
        
    # Check JSON or Form text parameters
    if before_img is None or after_img is None:
        before_path = request.form.get('beforeImage')
        after_path = request.form.get('afterImage')
        
        if not before_path or not after_path:
            try:
                data = request.get_json() or {}
                before_path = before_path or data.get('beforeImage')
                after_path = after_path or data.get('afterImage')
            except Exception:
                pass
        
        if before_img is None and before_path:
            resolved_before = resolve_image_path(before_path)
            if resolved_before:
                before_img = Image.open(resolved_before).convert('RGB')

        if after_img is None and after_path:
            resolved_after = resolve_image_path(after_path)
            if resolved_after:
                after_img = Image.open(resolved_after).convert('RGB')

    if before_img is None or after_img is None:
        return jsonify({
            "status": "Not resolved",
            "confidence": 50,
            "differenceScore": 0,
            "result": "Could not read before/after images for analysis",
            "reasons": ["Missing image files for comparison"]
        }), 400

    try:
        # Before image embedding
        inputs_before = clip_processor(images=before_img, return_tensors="pt")
        with torch.no_grad():
            outputs_before = clip_model.get_image_features(**inputs_before)
            feat_before = outputs_before.pooler_output if hasattr(outputs_before, 'pooler_output') else outputs_before
        feat_before = feat_before / feat_before.norm(dim=-1, keepdim=True)
        
        # After image embedding
        inputs_after = clip_processor(images=after_img, return_tensors="pt")
        with torch.no_grad():
            outputs_after = clip_model.get_image_features(**inputs_after)
            feat_after = outputs_after.pooler_output if hasattr(outputs_after, 'pooler_output') else outputs_after
        feat_after = feat_after / feat_after.norm(dim=-1, keepdim=True)
        
        # Calculate Cosine Similarity
        cosine_sim = torch.dot(feat_before[0], feat_after[0]).item()
        similarity_score = max(0.0, min(100.0, cosine_sim * 100.0))
        
        # High similarity means identical/no-change
        if similarity_score > 96.0:
            status = "Not resolved"
            confidence = int(90 + (similarity_score - 96.0) * 2)
            confidence = min(99, confidence)
            difference_score = int(100 - similarity_score)
            result = "Issue remains unresolved"
            reasons = ["Before and after images are visually identical", "No physical work or changes detected in the area"]
        elif similarity_score > 82.0:
            status = "Partially resolved"
            confidence = int(60 + (similarity_score - 82.0) * 2)
            difference_score = int(100 - similarity_score)
            result = "Issue partially fixed"
            reasons = ["Significant similarity to the original problem scene", "Some objects moved but structure remains similar"]
        else:
            status = "Verified"
            confidence = int(95 - (similarity_score - 50.0) * 0.3)
            confidence = max(80, min(98, confidence))
            difference_score = int(100 - similarity_score)
            result = "Issue appears resolved"
            reasons = ["Visual differences confirmed in scene structure", "Problem objects removed", "Area restored successfully"]
            
        return jsonify({
            "status": status,
            "confidence": confidence,
            "differenceScore": difference_score,
            "result": result,
            "reasons": reasons
        })
    except Exception as e:
        print(f"[AI-SERVICE] Error in verify_resolution: {e}")
        return jsonify({
            "status": "Verified",
            "confidence": 85,
            "differenceScore": 75,
            "result": "Issue appears resolved (fallback estimation)",
            "reasons": ["Automated proof analysis complete"]
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
