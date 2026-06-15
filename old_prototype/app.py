
import streamlit as st, hashlib, pandas as pd

from database.db import *
from features.ml import predict
from ai.chatbot import ask
from features.pdf_export import export
from features.stocks import price

init()

def hashp(p):
    return hashlib.sha256(p.encode()).hexdigest()

def css():
    st.markdown("<style>"+open("style.css").read()+"</style>",True)

css()

if "user" not in st.session_state:
    st.session_state.user=None

if st.session_state.user is None:

    st.title("FinVision Level 2")

    mode=st.radio("Mode",["Login","Register"])

    u=st.text_input("Username")
    p=st.text_input("Password",type="password")

    if mode=="Register":
        if st.button("Register"):
            try:
                register(u,hashp(p))
                st.success("Account created")
            except:
                st.error("User exists")

    else:
        if st.button("Login"):
            if login(u,hashp(p)):
                st.session_state.user=u
                st.rerun()
            else:
                st.error("Invalid")

else:

    st.sidebar.write("User:",st.session_state.user)

    if st.sidebar.button("Logout"):
        st.session_state.user=None
        st.rerun()

    menu=st.sidebar.selectbox("Menu",[
        "Add","Dashboard","AI","Waste AI","Stocks","Export PDF"
    ])

    if menu=="Add":
        d=st.date_input("Date")
        c=st.selectbox("Category",["Food","Travel","Shopping","Bills"])
        a=st.number_input("Amount",1)
        n=st.text_input("Note")
        if st.button("Save"):
            add_expense(st.session_state.user,str(d),c,a,n)
            st.success("Saved")

    elif menu=="Dashboard":
        rows=get_expenses(st.session_state.user)
        if rows:
            df=pd.DataFrame(rows,columns=["Date","Category","Amount","Note"])
            st.dataframe(df)
            st.bar_chart(df.groupby("Category")["Amount"].sum())
        else:
            st.warning("No data")

    elif menu=="AI":
        q=st.text_input("Ask finance question")
        if st.button("Ask"):
            st.info(ask(q))

    elif menu=="Waste AI":
        a=st.number_input("Amount",10)
        f=st.number_input("Freq",1)
        if st.button("Check"):
            if predict(a,f)==1:
                st.error("Waste")
            else:
                st.success("Good")

    elif menu=="Stocks":
        s=st.text_input("Enter stock symbol (AAPL, TSLA)")
        if st.button("Get Price"):
            st.info(price(s))

    elif menu=="Export PDF":
        rows=get_expenses(st.session_state.user)
        if rows:
            df=pd.DataFrame(rows,columns=["Date","Category","Amount","Note"])
            path=export(df,st.session_state.user)
            st.success("PDF generated")
            with open(path,"rb") as f:
                st.download_button("Download",f,"report.pdf")
