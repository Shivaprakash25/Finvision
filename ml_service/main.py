from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load from the backend env file where the key is stored
load_dotenv("../backend/.env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using NVIDIA NIM API Key
API_KEY = os.getenv("DEEPSEEK_API_KEY", "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")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://integrate.api.nvidia.com/v1"
)

class AIQuery(BaseModel):
    query: str

@app.post("/ask-ai")
def ask_ai(req: AIQuery):
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.2-1b-instruct",
            messages=[
                {"role": "system", "content": "You are a professional, highly knowledgeable financial advisor AI inside a premium banking app. Keep your answers concise (2-3 sentences), practical, and professional."},
                {"role": "user", "content": req.query}
            ],
            temperature=0.2,
            top_p=0.7,
            max_tokens=1024,
            stream=False
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        error_msg = str(e)
        print("Error:", error_msg)
        if "Insufficient Balance" in error_msg or "402" in error_msg:
            return {"response": "System Notice: The DeepSeek API successfully connected, but the account has insufficient balance. Please top up your DeepSeek platform account to resume live AI financial advice."}
        return {"response": "AI service unavailable at the moment. Please ensure your DeepSeek API key is correct."}

class CreditRiskQuery(BaseModel):
    income: float
    expenses: float
    debt: float

@app.post("/predict-credit-risk")
def predict_credit_risk(data: CreditRiskQuery):
    score = 600 + (data.income - data.expenses) / 100 - (data.debt / 100)
    score = min(850, max(300, score))
    return {"risk_score": round(score), "status": "Good" if score > 650 else "Risky"}
