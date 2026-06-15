
import sqlite3, os

DB="database/app.db"

def connect():
    os.makedirs("database",exist_ok=True)
    return sqlite3.connect(DB)

def init():
    conn=connect()
    cur=conn.cursor()

    cur.execute("""CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT)""")

    cur.execute("""CREATE TABLE IF NOT EXISTS expenses(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    date TEXT,
    category TEXT,
    amount REAL,
    note TEXT)""")

    conn.commit()
    conn.close()

def register(u,p):
    conn=connect()
    conn.execute("INSERT INTO users(username,password) VALUES(?,?)",(u,p))
    conn.commit()
    conn.close()

def login(u,p):
    conn=connect()
    cur=conn.cursor()
    cur.execute("SELECT * FROM users WHERE username=? AND password=?",(u,p))
    r=cur.fetchone()
    conn.close()
    return r

def add_expense(u,d,c,a,n):
    conn=connect()
    conn.execute("INSERT INTO expenses(user,date,category,amount,note) VALUES(?,?,?,?,?)",(u,d,c,a,n))
    conn.commit()
    conn.close()

def get_expenses(u):
    conn=connect()
    cur=conn.cursor()
    cur.execute("SELECT date,category,amount,note FROM expenses WHERE user=?",(u,))
    rows=cur.fetchall()
    conn.close()
    return rows
