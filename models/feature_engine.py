# CVFilter/models/feature_engine.py

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class FeatureEngine:

    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

        self.skills = [
            "python", "sql", "aws", "docker",
            "machine learning", "deep learning", "nlp"
        ]

    def tfidf_similarity(self, jd, cv):
        docs = [jd, cv]
        tfidf_matrix = self.vectorizer.fit_transform(docs)
        return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    def skill_overlap(self, jd, cv):
        jd_text = jd.lower()
        cv_text = cv.lower()

        jd_skills = [s for s in self.skills if s in jd_text]
        cv_skills = [s for s in self.skills if s in cv_text]

        if len(jd_skills) == 0:
            return 0.0

        return len(set(jd_skills) & set(cv_skills)) / len(jd_skills)

    def build_features(self, jd, cv):
        tfidf = self.tfidf_similarity(jd, cv)
        semantic = 0.0  # Disabled (stable system)
        skill = self.skill_overlap(jd, cv)

        return np.array([tfidf, semantic, skill])