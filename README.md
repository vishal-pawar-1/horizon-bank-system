# 🏦 Horizon Bank System

A Flask-based banking web application hosted on AWS with MySQL (RDS) and EC2.  
This project allows users to register, log in, transfer funds, and view transaction history.  
Admin can manage users (block/unblock/delete).

---

## 🚀 Features
- User Registration & Login
- Fund Transfer between accounts
- Transaction history tracking
- Admin panel to manage users
- MySQL RDS database integration
- AWS EC2 deployment

---

## 🛠️ Tech Stack
- Python (Flask)
- MySQL (AWS RDS)
- HTML, CSS, JavaScript
- AWS EC2, RDS

---

## 📂 Project Structure
horizon-bank-system/
│── app.py # Flask backend
│── requirements.txt # Dependencies
│── README.md # Project documentation
│── templates/
│ └── index.html
│── static/
│ ├── style.css
│ └── script.js



---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository
```bash
git clone https://github.com/<your-username>/horizon-bank-system.git
cd horizon-bank-system

2️⃣ Create Virtual Environment & Install Dependencies

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

3️⃣ Configure Database
Update your RDS endpoint, username, password in app.py

4️⃣ Run Flask App
python3 app.py
Visit http://<EC2_PUBLIC_IP>:5000