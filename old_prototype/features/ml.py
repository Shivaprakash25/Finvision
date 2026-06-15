
import pandas as pd, joblib, os
from sklearn.ensemble import RandomForestClassifier

MODEL="features/model.pkl"

def train():
    data={
    "amount":[100,500,2000,150,3000,80,2500],
    "freq":[2,15,5,3,20,1,18],
    "waste":[0,1,1,0,1,0,1]
    }
    df=pd.DataFrame(data)
    X=df[["amount","freq"]]
    y=df["waste"]
    m=RandomForestClassifier()
    m.fit(X,y)
    joblib.dump(m,MODEL)

def load():
    if not os.path.exists(MODEL):
        train()
    return joblib.load(MODEL)

def predict(a,f):
    m=load()
    df=pd.DataFrame([[a,f]],columns=["amount","freq"])
    return m.predict(df)[0]
