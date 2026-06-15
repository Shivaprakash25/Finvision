
import requests

def price(symbol):

    try:
        url=f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbol}"
        r=requests.get(url,timeout=5).json()
        return r["quoteResponse"]["result"][0]["regularMarketPrice"]
    except:
        return "Unavailable"
