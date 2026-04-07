# CVFilter/models/explain.py

def generate_explanation(features):
    tfidf, semantic, skill = features

    explanations = []

    if skill > 0.7:
        explanations.append("Strong skill match")
    elif skill > 0.3:
        explanations.append("Moderate skill match")
    else:
        explanations.append("Low skill match")

    if tfidf > 0.5:
        explanations.append("Good keyword match")
    else:
        explanations.append("Low keyword match")

    return explanations