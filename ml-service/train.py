"""
Run this ONCE before starting the ML service:  python train.py
It trains and saves validity + sentiment models.
"""
import os, pickle, json
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

nltk.download('stopwords', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('wordnet', quiet=True)
os.makedirs('models', exist_ok=True)

# ── Training Data ─────────────────────────────────────────────────────────────
INVALID_SAMPLES = [
    "good","excellent","great","perfect","nice","fine","ok","okay","superb",
    "amazing","wonderful","best","awesome","brilliant","fabulous","outstanding",
    "fantastic","cool","alright","well","no improvements","no improvement",
    "no issues","all good","all fine","nothing","nothing to improve","no need",
    "no changes needed","no problem","no complaints","everything is good",
    "very good","well done","keep it up","keep up the good work","good job",
    "nice job","great job","good teaching","good explanation","i love you",
    "i love this","i like it","satisfied","no suggestions","no feedback",
    "nil","none","na","n/a","not applicable","nothing to say","nothing more",
    "good sir","good madam","great sir","great madam","very nice",
    "very good sir","very nice sir","very good madam","no","yes","ok sir",
    "okay sir","fine sir","he is good","she is good","good faculty",
    "nice faculty","best faculty","good teacher","nice teacher","best teacher",
    "no issues at all","no problem at all","everything is perfect",
    "class is good","teaching is good","class is nice","everything fine",
    "all is well","all is good","nothing to say sir","nothing madam",
    "no improvements needed","its good","it is good","it was good","it was fine",
    "everything is excellent","very satisfied","fully satisfied","no changes",
    "no issues found","satisfied with teaching","happy with teaching",
    "no problem in teaching","good as always","continue as it is",
    "continue the same","no need to change","the teaching is good",
    "sir is good","madam is good","faculty is very good","very helpful sir",
    "very helpful","100 percent good","100% satisfied","no issues whatsoever",
]

VALID_SAMPLES = [
    "Please solve more examples during the class especially numerical problems",
    "The faculty should slow down while explaining complex algorithms",
    "More practice problems should be given for data structures topics",
    "Please use the blackboard instead of just slides for derivations",
    "Faculty should encourage students to ask questions more freely",
    "More real world applications should be discussed for theoretical concepts",
    "The professor should conduct weekly doubt clearing sessions",
    "Please provide study material before the lecture so we can prepare",
    "The faculty should use diagrams and flowcharts to explain OS concepts",
    "More time should be spent on dynamic programming and graph algorithms",
    "Please reduce the speed of teaching as it is difficult to follow",
    "The faculty should give assignments that are relevant to current industry",
    "More case studies on database normalization would be helpful",
    "Please conduct surprise tests to keep students engaged regularly",
    "The faculty should clarify doubts patiently and not rush through topics",
    "More interactive sessions and group activities would improve learning",
    "Please explain the practical applications of machine learning algorithms",
    "The teaching pace is too fast and many students are unable to keep up",
    "More coding exercises should be included in the computer networks class",
    "Please use animated videos to explain the working of computer hardware",
    "Faculty should be more approachable during office hours for doubts",
    "Revision of previous topics at the start of each class would be helpful",
    "The lecturer should give detailed notes and not rely only on textbooks",
    "More attention should be given to weak students by slowing down",
    "Please include more programming assignments for operating systems",
    "The professor tends to skip important derivations please cover them fully",
    "It would be better if the faculty made themselves available after class",
    "More examples from real companies like google or amazon would motivate us",
    "The faculty should check attendance and follow up with absent students",
    "Please give summary notes at the end of each chapter for revision",
    "More numerical problems in mathematics especially in differential equations",
    "The lecture slides should be uploaded to the portal before class begins",
    "Faculty should use live coding demonstrations for programming subjects",
    "Please explain the difference between similar concepts more clearly",
    "The lab sessions should be better aligned with what is taught in theory",
    "More time should be allocated for difficult topics like computer networks",
    "Please provide previous year question papers for exam preparation",
    "The teaching method should be more student centered and interactive",
    "Faculty should give individual attention to students who struggle",
    "Please conduct group discussions and presentations to improve understanding",
    "More focus on competitive programming topics would help in placements",
    "The professor should connect theory with practical industry scenarios",
    "Please improve punctuality as classes frequently start late by 10 minutes",
    "More clarity needed when explaining recursion and backtracking algorithms",
    "The faculty should give clear explanations with step by step solutions",
    "Please encourage students to solve problems on the board in class",
    "More assignments and mini projects would reinforce the learning",
    "The faculty should maintain proper lesson plan and stick to the syllabus",
    "Please explain the intuition behind algorithms before the formal proof",
    "Better examples are needed when teaching topics from software engineering",
    "Please use simulation tools for teaching computer organization concepts",
    "The faculty needs to maintain discipline and manage time better in class",
    "More detailed feedback on submitted assignments would help improvement",
    "Please include more topics on cloud computing and modern technologies",
    "The professor should be available on whatsapp or email for student queries",
    "More solved examples should be provided in the textbook reference materials",
    "Please coordinate better between lab sessions and theory class content",
    "The lecture delivery speed should be adjusted based on student feedback",
    "Please explain each step in numerical methods clearly with examples",
    "More focus on practical implementation rather than just theory is needed",
    "The faculty should acknowledge and address student difficulties promptly",
    "Please make classes more engaging by using visual aids and demonstrations",
    "More programming practice questions would help prepare for placements",
    "The professor should encourage questions and not make students feel afraid",
    "Please explain concepts by relating them to familiar everyday scenarios",
    "More practice problems at varying difficulty levels should be provided",
    "The class notes provided are incomplete please give comprehensive material",
    "Faculty should give regular feedback on student progress and performance",
]

texts = INVALID_SAMPLES + VALID_SAMPLES
labels = [0] * len(INVALID_SAMPLES) + [1] * len(VALID_SAMPLES)
print(f"Training data: {len(INVALID_SAMPLES)} invalid + {len(VALID_SAMPLES)} valid")

# ── Train Validity Classifier ─────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42, stratify=labels)

validity_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 3), max_features=5000, min_df=1, lowercase=True, strip_accents='unicode')),
    ('clf', LogisticRegression(max_iter=1000, C=1.0, random_state=42))
])
validity_pipeline.fit(X_train, y_train)
y_pred = validity_pipeline.predict(X_test)
print("\n=== Validity Classifier ===")
print(classification_report(y_test, y_pred, target_names=['Invalid','Valid']))
with open('models/validity_model.pkl', 'wb') as f:
    pickle.dump(validity_pipeline, f)
print("Saved: models/validity_model.pkl")

# ── Train Sentiment Classifier ────────────────────────────────────────────────
SENTIMENT_DATA = [
    # Positive
    ("The professor explains every concept with patience and clarity", 2),
    ("Very interactive classes with lots of real world examples", 2),
    ("The faculty is punctual and well prepared for every class", 2),
    ("Teaching methodology is excellent and easy to follow", 2),
    ("Doubts are always clarified immediately without hesitation", 2),
    ("Highly knowledgeable teacher who connects theory to practice", 2),
    ("The teaching style is very engaging and keeps students focused", 2),
    ("Always available for students and responds quickly to queries", 2),
    # Neutral
    ("Teaching is average but could be improved with more examples", 1),
    ("The faculty is okay but more practice problems would help", 1),
    ("Classes are fine but the pace could be adjusted sometimes", 1),
    ("Average teaching with some good points and some areas to improve", 1),
    ("The professor is good but more interaction with students is needed", 1),
    ("Satisfactory teaching overall but needs better time management", 1),
    # Negative
    ("Very poor explanation of concepts and difficult to follow", 0),
    ("The teacher is often late and does not complete the syllabus on time", 0),
    ("Doubts are not clarified properly and students are ignored", 0),
    ("The teaching speed is extremely fast and impossible to understand", 0),
    ("Faculty shows no interest in teaching and just reads from slides", 0),
    ("Very rude behavior towards students when they ask questions", 0),
]

s_texts = [t for t, l in SENTIMENT_DATA]
s_labels = [l for t, l in SENTIMENT_DATA]

sentiment_pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=3000, lowercase=True)),
    ('clf', MultinomialNB(alpha=0.5))
])
sentiment_pipeline.fit(s_texts, s_labels)
with open('models/sentiment_model.pkl', 'wb') as f:
    pickle.dump(sentiment_pipeline, f)
print("Saved: models/sentiment_model.pkl")

# ── Save keywords ─────────────────────────────────────────────────────────────
INVALID_KEYWORDS = [
    "good","great","excellent","perfect","nice","fine","okay","ok","superb",
    "amazing","wonderful","awesome","fantastic","brilliant","nothing","nil",
    "none","na","n/a","satisfied","no issues","no improvements","no improvement",
    "no need","no changes","no complaints","no problem","no suggestion",
    "all good","all fine","keep it up","well done","good job","very good",
    "very nice","no feedback","no comments","nothing to say","nothing more",
    "continue","same","as is","no issues at all",
]
with open('models/keywords.json', 'w') as f:
    json.dump({'invalid_keywords': INVALID_KEYWORDS}, f, indent=2)
print("Saved: models/keywords.json")
print("\n✅ Training complete!")