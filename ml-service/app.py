"""
Flask Smart AI Feedback Analyzer — runs on port 5001
Endpoints:
POST /validate
POST /sentiment
POST /analyze
POST /analyze-batch
GET /health
"""

import os, re, json, pickle
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
validity_model = None
sentiment_model = None
invalid_keywords = []

# ─────────────── CATEGORY DEFINITIONS ───────────────
CATEGORIES = {
    "Teaching": ["explain", "teaching", "concept", "clarity"],
    "Pace": ["fast", "slow", "speed"],
    "Interaction": ["interaction", "questions", "engage"],
    "Doubt Solving": ["doubt", "clarify"],
    "Content": ["syllabus", "topics", "content"],
    "Punctuality": ["late", "time", "schedule"]
}

# ─────────────── LOAD MODELS ───────────────
def load_models():
    global validity_model, sentiment_model, invalid_keywords
    try:
        with open(os.path.join(MODEL_DIR, 'validity_model.pkl'), 'rb') as f:
            validity_model = pickle.load(f)
        print("✓ Validity model loaded")
    except:
        print("⚠ Validity model not found")

    try:
        with open(os.path.join(MODEL_DIR, 'sentiment_model.pkl'), 'rb') as f:
            sentiment_model = pickle.load(f)
        print("✓ Sentiment model loaded")
    except:
        print("⚠ Sentiment model not found")

    try:
        with open(os.path.join(MODEL_DIR, 'keywords.json'), 'r') as f:
            invalid_keywords = json.load(f).get('invalid_keywords', [])
    except:
        pass

load_models()

# ─────────────── TEXT CLEANING ───────────────
def clean_text(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', '', text)
    return re.sub(r'\s+', ' ', text).strip()

# ─────────────── VALIDATION ───────────────
def rule_based_check(text):
    raw = text.strip()
    cleaned = clean_text(raw)

    if len(raw) < 10:
        return False, "Too short"
    words = cleaned.split()
    if len(words) < 3:
        return False, "Too few words"

    for kw in invalid_keywords:
        if cleaned == kw.lower():
            return False, "Generic feedback"

    return True, "Valid"

def ml_validate(text):
    if validity_model is None:
        return True, 0.5
    cleaned = clean_text(text)
    proba = validity_model.predict_proba([cleaned])[0]
    label = validity_model.predict([cleaned])[0]
    return bool(label == 1), float(max(proba))

# ─────────────── SENTIMENT ANALYSIS ───────────────
POSITIVE_WORDS = ["good", "excellent", "awesome", "clear", "helpful"]
NEGATIVE_WORDS = ["bad", "poor", "fast", "slow", "confusing", "late"]

def ml_sentiment(text):
    cleaned = clean_text(text)

    # Keyword boost
    if any(w in cleaned for w in POSITIVE_WORDS):
        return "positive", 0.9, 8
    if any(w in cleaned for w in NEGATIVE_WORDS):
        return "negative", 0.9, 3

    if sentiment_model is None:
        return "neutral", 0.5, 5

    proba = sentiment_model.predict_proba([cleaned])[0]
    label_idx = sentiment_model.predict([cleaned])[0]
    confidence = float(max(proba))

    label_map = {0: "negative", 1: "neutral", 2: "positive"}
    label = label_map.get(label_idx, "neutral")

    base = {"negative": 2, "neutral": 5, "positive": 8}[label]
    score = max(0, min(10, round(base + (confidence - 0.5) * 4)))

    return label, confidence, score

# ─────────────── CATEGORY DETECTION ───────────────
def detect_category(text):
    cleaned = clean_text(text)
    found = []

    for cat, words in CATEGORIES.items():
        if any(w in cleaned for w in words):
            found.append(cat)

    return found if found else ["General"]

# ─────────────── SUGGESTION GENERATOR ───────────────
def generate_suggestion(text, sentiment):
    t = clean_text(text)

    if "fast" in t:
        return "Reduce teaching speed and explain concepts more clearly"
    if "doubt" in t:
        return "Improve doubt clearing sessions"
    if "interaction" in t:
        return "Increase student interaction during classes"
    if "late" in t:
        return "Maintain punctuality and manage time effectively"
    if "no need" in t or "no improvement" in t:
        return "No improvement needed"

    if sentiment == "negative":
        return "Needs improvement in teaching methodology"
    if sentiment == "neutral":
        return "Some improvements can be made"

    return "Keep up the good work"

# ─────────────── KEYWORDS ───────────────
def extract_keywords(text):
    words = [w for w in clean_text(text).split() if len(w) > 3]
    return list(dict.fromkeys(words))[:8]

# ─────────────── ROUTES ───────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/validate', methods=['POST'])
def validate():
    data = request.get_json()
    text = data.get("text", "")

    rule_valid, reason = rule_based_check(text)
    ml_valid, conf = ml_validate(text)

    is_valid = rule_valid and (ml_valid or conf < 0.75)

    return jsonify({
        "is_valid": is_valid,
        "reason": reason,
        "confidence": round(conf, 3)
    })

@app.route('/sentiment', methods=['POST'])
def sentiment():
    data = request.get_json()
    text = data.get("text", "")

    label, conf, score = ml_sentiment(text)

    return jsonify({
        "sentiment": label,
        "score": score,
        "confidence": round(conf, 3)
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "Empty text"}), 400

    rule_valid, reason = rule_based_check(text)
    ml_valid, conf = ml_validate(text)

    sent_label, sent_conf, sent_score = ml_sentiment(text)
    category = detect_category(text)
    suggestion = generate_suggestion(text, sent_label)
    keywords = extract_keywords(text)

    is_valid = rule_valid and (ml_valid or conf < 0.75)

    return jsonify({
        "is_valid": is_valid,
        "sentiment": {
            "label": sent_label,
            "score": sent_score
        },
        "category": category,
        "suggestion": suggestion,
        "keywords": keywords
    })

@app.route('/analyze-batch', methods=['POST'])
def analyze_batch():
    data = request.get_json()
    entries = data.get("entries", [])

    results = []

    for entry in entries:
        text = entry.get("text", "")

        sent_label, _, sent_score = ml_sentiment(text)

        results.append({
            "text": text,
            "sentiment": sent_label,
            "score": sent_score,
            "category": detect_category(text),
            "suggestion": generate_suggestion(text, sent_label)
        })

    return jsonify({
        "total": len(results),
        "results": results
    })

# ─────────────── RUN ───────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)