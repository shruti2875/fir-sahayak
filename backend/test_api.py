import requests

API_KEY = "sk-or-your-key-here"

def generate_fir(text: str):
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
    Convert the following complaint into a formal FIR:

    Complaint: {text}

    Also:
    - Identify missing information
    - Suggest improvements
    """

    data = {
        "model": "mistralai/mistral-7b-instruct:free",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, headers=headers, json=data)

    return response.json()["choices"][0]["message"]["content"]


# 👉 TEST HERE
print(generate_fir("My phone was stolen near bus stand"))