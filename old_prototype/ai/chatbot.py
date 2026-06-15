import requests

API_KEY = "your_api_key_here"

def ask(question):
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-3.5-turbo",
                "messages": [
                    {"role": "user", "content": question}
                ]
            }
        )

        return response.json()["choices"][0]["message"]["content"]

    except Exception as e:
        return f"AI error: {e}"