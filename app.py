from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

db = mysql.connector.connect(
    host="horizon-bank-data.cvwuyoa4ytj2.ap-south-1.rds.amazonaws.com",
    user="admin",
    password="vishal123",
    database="horizon_bank_data"
)
cursor = db.cursor(dictionary=True)

# ✅ Create/Alter Tables
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(15) UNIQUE,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(50),
    address VARCHAR(255),
    status VARCHAR(10) DEFAULT 'Active',
    balance DECIMAL(10,2) DEFAULT 10000,
    account_number BIGINT UNIQUE
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_acc BIGINT,
    receiver_acc BIGINT,
    amount DECIMAL(10,2),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
db.commit()

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    cursor.execute("SELECT * FROM users WHERE username=%s OR email=%s OR mobile=%s",
                   (data['username'], data['email'], data['mobile']))
    if cursor.fetchone():
        return jsonify({"message": "User already exists"}), 400

    cursor.execute("""
        INSERT INTO users (name,email,mobile,username,password,address,account_number)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        data['name'], data['email'], data['mobile'],
        data['username'], data['password'], data['address'],
        data['account_number']
    ))
    db.commit()
    return jsonify({"message": "Registration successful"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    cursor.execute("SELECT * FROM users WHERE username=%s AND password=%s",
                   (data['username'], data['password']))
    user = cursor.fetchone()
    if user:
        if user['status'] == 'Blocked':
            return jsonify({"message": "Blocked"}), 403
        return jsonify(user)
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/users', methods=['GET'])
def get_users():
    cursor.execute("SELECT * FROM users")
    return jsonify(cursor.fetchall())

@app.route('/block/<int:user_id>', methods=['PUT'])
def block_user(user_id):
    cursor.execute("UPDATE users SET status='Blocked' WHERE id=%s", (user_id,))
    db.commit()
    return jsonify({"message": "User blocked"})

@app.route('/unblock/<int:user_id>', methods=['PUT'])
def unblock_user(user_id):
    cursor.execute("UPDATE users SET status='Active' WHERE id=%s", (user_id,))
    db.commit()
    return jsonify({"message": "User unblocked"})

@app.route('/delete/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
    db.commit()
    return jsonify({"message": "User deleted"})

# ✅ Transfer Funds
@app.route('/transfer', methods=['POST'])
def transfer():
    data = request.json
    sender_id = data['sender_id']
    receiver_acc = data['receiver_acc']
    amount = float(data['amount'])

    # Sender info
    cursor.execute("SELECT balance, status, account_number FROM users WHERE id=%s", (sender_id,))
    sender = cursor.fetchone()
    if not sender:
        return jsonify({"message": "Sender not found"}), 404
    if sender['status'] == 'Blocked':
        return jsonify({"message": "Blocked user cannot transfer"}), 403
    if sender['balance'] < amount:
        return jsonify({"message": "Insufficient balance"}), 400

    # Deduct from sender
    cursor.execute("UPDATE users SET balance = balance - %s WHERE id=%s", (amount, sender_id))

    # If receiver exists
    cursor.execute("SELECT id FROM users WHERE account_number=%s", (receiver_acc,))
    receiver = cursor.fetchone()
    if receiver:
        cursor.execute("UPDATE users SET balance = balance + %s WHERE account_number=%s", (amount, receiver_acc))
    
    # ✅ Store sender account number directly
    cursor.execute("""
        INSERT INTO transactions (sender_acc, receiver_acc, amount)
        VALUES (%s, %s, %s)
    """, (sender['account_number'], receiver_acc, amount))
    db.commit()

    cursor.execute("SELECT balance FROM users WHERE id=%s", (sender_id,))
    updated_balance = cursor.fetchone()['balance']
    return jsonify({"message": "Transfer successful", "updated_balance": updated_balance}), 200

# ✅ Fetch Transactions (No JOIN)
@app.route('/transactions/<int:user_id>', methods=['GET'])
def get_transactions(user_id):
    cursor.execute("SELECT account_number FROM users WHERE id=%s", (user_id,))
    acc = cursor.fetchone()['account_number']

    cursor.execute("""
        SELECT id, sender_acc, receiver_acc, amount, date
        FROM transactions
        WHERE sender_acc=%s OR receiver_acc=%s
        ORDER BY date DESC
    """, (acc, acc))
    return jsonify(cursor.fetchall())

if __name__ == '__main__':
    app.run(debug=True)
