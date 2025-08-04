let totalTransferred = 0;
let currentUser = null;
let userChart;

document.getElementById('registerForm').addEventListener('submit', function(e){
  e.preventDefault();

  const newUser = {
    name: fullname.value,
    email: email.value,
    mobile: mobile.value,
    username: regUsername.value,
    password: regPassword.value,
    address: address.value,
    account_number: Math.floor(100000000000 + Math.random() * 900000000000)
  };

  fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUser)
  })
  .then(async (res) => {
    const data = await res.json();
    if(res.ok){
      alert("✅ Registration successful! Account: " + newUser.account_number);
      fullname.value = email.value = mobile.value = regUsername.value = regPassword.value = address.value = '';
      showLoginForm();
    } else {
      alert("🚫 " + data.message);
    }
  });
});

document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();

  fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    })
  })
  .then(res => res.json())
  .then(user => {
    if(user.message){
      alert(user.message);
      return;
    }
    currentUser = user;
    welcomeMsg.innerText = `Welcome, ${user.name}`;
    userAccNo.innerText = user.account_number;
    userBalance.innerText = `$${user.balance}`;
    showUserDashboard();
    fetchTransactions();
  });
});

function transferFunds(){
  const toAcc = transferToAcc.value;
  const amount = parseFloat(transferAmount.value);

  if(!/^\d{12}$/.test(toAcc) || amount <= 0){
    transferMsg.innerText = "⚠️ Enter valid 12-digit account and amount!";
    return;
  }

  fetch("http://127.0.0.1:5000/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_id: currentUser.id,
      receiver_acc: toAcc,
      amount: amount
    })
  })
  .then(res => res.json())
  .then(data => {
    if(data.updated_balance !== undefined){
      currentUser.balance = data.updated_balance;
      document.getElementById('userBalance').innerText = `$${data.updated_balance}`;
      alert(data.message);
      fetchTransactions(); // update history
    } else {
      alert("🚫 " + data.message);
    }
  });
}

function fetchTransactions(){
  fetch(`http://127.0.0.1:5000/transactions/${currentUser.id}`)
    .then(res => res.json())
    .then(tx => {
      userTxBody.innerHTML = tx.map(row => {
        const isSent = row.sender_acc === currentUser.account_number;
        const isInternal = /^\d{12}$/.test(row.receiver_acc);
        const displayReceiver = isInternal ? row.receiver_acc : "External Account";
        return `
          <tr>
            <td>${row.date}</td>
            <td>${row.sender_acc}</td>
            <td>${displayReceiver}</td>
            <td>${isSent ? `- $${row.amount}` : `+ $${row.amount}`}</td>
          </tr>
        `;
      }).join('');
    });
}

document.getElementById('adminLoginForm').addEventListener('submit', function(e){
  e.preventDefault();
  if(adminUsername.value === "admin" && adminPassword.value === "admin123"){
    showAdminDashboard();
  } else alert("Invalid Admin Credentials");
});

function showAdminDashboard(){
  navbar.classList.remove('hidden');
  loginPage.classList.add('hidden');
  userDashboard.classList.add('hidden');
  adminDashboard.classList.remove('hidden');

  fetch("http://127.0.0.1:5000/users")
    .then(res => res.json())
    .then(users => {
      totalUsers.innerText = users.length;
      const totalAmountVal = users.reduce((s,u)=>s+parseFloat(u.balance),0);
      totalAmount.innerText = `$${totalAmountVal}`;
      transferredAmount.innerText = `$${totalTransferred}`;

      userTableBody.innerHTML = users.map(u => `
        <tr>
          <td>${u.name}</td><td>${u.email}</td><td>${u.mobile}</td><td>${u.username}</td>
          <td>${u.account_number}</td><td>${u.address}</td><td>${u.balance}</td><td>${u.status}</td>
          <td>
            <button onclick="toggleStatus(${u.id}, '${u.status}')">${u.status === 'Active' ? 'Block' : 'Unblock'}</button>
            <button onclick="deleteUser(${u.id})">Delete</button>
          </td>
        </tr>`).join('');
      updateUserChart(totalAmountVal, totalTransferred);
    });
}

function toggleStatus(id, status){
  const url = status === 'Active' ? `/block/${id}` : `/unblock/${id}`;
  fetch(`http://127.0.0.1:5000${url}`, { method: "PUT" })
    .then(() => showAdminDashboard());
}

function deleteUser(id){
  fetch(`http://127.0.0.1:5000/delete/${id}`, { method: "DELETE" })
    .then(() => showAdminDashboard());
}

function showUserDashboard(){
  navbar.classList.remove('hidden');
  loginPage.classList.add('hidden');
  userDashboard.classList.remove('hidden');
  adminDashboard.classList.add('hidden');
}

function logout(){
  navbar.classList.add('hidden');
  loginPage.classList.remove('hidden');
  userDashboard.classList.add('hidden');
  adminDashboard.classList.add('hidden');
  username.value = password.value = adminUsername.value = adminPassword.value = '';
}

function updateUserChart(totalAmount, transferred){
  const ctx = document.getElementById('userChart').getContext('2d');
  if(userChart) userChart.destroy();
  userChart = new Chart(ctx, {
    type: 'pie',
    data: { 
      labels: ['Available Amount', 'Transferred Amount'],
      datasets: [{ 
        data: [totalAmount, transferred], 
        backgroundColor: ['#4CAF50', '#2196F3'] 
      }] 
    },
    options: { responsive: true }
  });
}

function showRegisterForm(){ toggleForms('register'); }
function showLoginForm(){ toggleForms('login'); }
function showAdminLogin(){ toggleForms('admin'); }

function toggleForms(form){
  loginFormContainer.classList.toggle('hidden', form !== 'login');
  registerFormContainer.classList.toggle('hidden', form !== 'register');
  adminLoginContainer.classList.toggle('hidden', form !== 'admin');
}
