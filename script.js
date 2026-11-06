// --- DATA STORAGE ---
let loans = JSON.parse(localStorage.getItem('ibzLoansProV5')) || [];

// --- PAGE NAVIGATION ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    if(pageId === 'admin-login') document.getElementById('admin-pin').value = '';
}

// --- ADMIN LOGIN ---
function loginAdmin() {
    const pin = document.getElementById('admin-pin').value;
    if (pin === '2026') {
        showPage('dashboard');
        updateUI();
    } else { 
        alert('Incorrect PIN.'); 
    }
}

// --- TOGGLE FORM ---
function toggleForm() {
    const form = document.getElementById('add-loan-section');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// --- UPDATE UI ---
function updateUI() {
    const ledgerList = document.getElementById('ledger-list');
    ledgerList.innerHTML = '';
    
    let totalCapital = 0;
    let totalCollected = 0;
    let currentOutstanding = 0;
    let totalExpected = 0; 
    let totalProfit = 0; 

    if (loans.length === 0) {
        ledgerList.innerHTML = '<p style="text-align:center; color:#a8a29e; padding: 20px;">No active loans.</p>';
    }

    loans.forEach((loan, index) => {
        totalCapital += loan.amount;
        totalExpected += loan.totalOwed;
        totalProfit += loan.interest;
        currentOutstanding += loan.balance;
        totalCollected += (loan.totalOwed - loan.balance);

        const today = new Date();
        const dueDate = new Date(loan.dueDate);
        const isLate = today > dueDate && loan.balance > 0;
        const formatR = (amount) => `R${amount.toFixed(2)}`;

        const card = document.createElement('div');
        card.className = `loaner-card ${isLate ? 'overdue' : ''}`;
        
        card.innerHTML = `
            <div class="loaner-top">
                <div class="loaner-contact">
                    <span class="loaner-name">${loan.name}</span>
                    <span><i class="fas fa-phone"></i> ${loan.phone}</span>
                    ${loan.idNum ? `<span><i class="fas fa-id-card"></i> ${loan.idNum}</span>` : ''}
                </div>
                <div class="loaner-balance">
                    <h4>Balance</h4>
                    <p>${formatR(loan.balance)}</p>
                </div>
            </div>
            <div class="loaner-details-grid">
                <div class="detail-item"><span class="detail-label">Principal</span><span class="detail-value">${formatR(loan.amount)}</span></div>
                <div class="detail-item"><span class="detail-label">Interest</span><span class="detail-value">${formatR(loan.interest)}</span></div>
                <div class="detail-item"><span class="detail-label">Disbursed</span><span class="detail-value">${loan.dateBorrowed}</span></div>
                <div class="detail-item"><span class="detail-label">Maturity</span><span class="detail-value" style="color: ${isLate ? '#ef4444' : '#fdfbf7'};">${loan.dueDate}</span></div>
            </div>
            <div class="loaner-actions">
                <button onclick="recordPayment(${index})" class="btn-pay"><i class="fas fa-hand-holding-usd"></i> Record Payment</button>
                <button onclick="deleteLoan(${index})" class="btn-del"><i class="fas fa-trash"></i></button>
            </div>
        `;
        ledgerList.appendChild(card);
    });

    document.getElementById('total-capital').textContent = `R${totalCapital.toFixed(2)}`;
    document.getElementById('total-outstanding').textContent = `R${currentOutstanding.toFixed(2)}`;
    document.getElementById('total-collected').textContent = `R${totalCollected.toFixed(2)}`;
    document.getElementById('total-profit').textContent = `R${totalProfit.toFixed(2)}`;

    let collectionRate = 0;
    if (totalExpected > 0) collectionRate = Math.round((totalCollected / totalExpected) * 100);
    
    document.getElementById('collection-rate').textContent = `${collectionRate}%`;
    document.getElementById('progress-bar-fill').style.width = `${collectionRate}%`;
    
    let statusText = "No Data";
    let statusColor = "#a8a29e";
    if (collectionRate >= 80) { statusText = "Excellent"; statusColor = "#10b981"; }
    else if (collectionRate >= 50) { statusText = "Healthy"; statusColor = "#f59e0b"; }
    else if (collectionRate > 0) { statusText = "Needs Attention"; statusColor = "#ef4444"; }
    
    document.getElementById('rating-status').textContent = statusText;
    document.getElementById('rating-status').style.color = statusColor;
    document.getElementById('progress-bar-fill').style.backgroundColor = statusColor;

    localStorage.setItem('ibzLoansProV5', JSON.stringify(loans));
}

// --- ADD LOAN ---
document.getElementById('loan-form').addEventListener('submit', (e) => {
    e.preventDefault(); 
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const interest = parseFloat(document.getElementById('loan-interest').value);
    
    const newLoan = {
        name: document.getElementById('borrower-name').value,
        phone: document.getElementById('borrower-phone').value,
        idNum: document.getElementById('borrower-id').value,
        amount: amount,
        interest: interest,
        dateBorrowed: document.getElementById('date-borrowed').value,
        dueDate: document.getElementById('due-date').value,
        totalOwed: amount + interest,
        balance: amount + interest
    };

    loans.push(newLoan);
    document.getElementById('loan-form').reset();
    document.getElementById('add-loan-section').style.display = 'none';
    updateUI();
});

// --- RECORD PAYMENT ---
function recordPayment(index) {
    const loan = loans[index];
    const payment = prompt(`How much is ${loan.name} paying? (Balance: R${loan.balance})`);
    if (payment === null || payment === '') return;
    const payAmount = parseFloat(payment);
    if (isNaN(payAmount) || payAmount <= 0 || payAmount > loan.balance) {
        alert("Invalid amount."); return;
    }
    loan.balance -= payAmount;
    if (loan.balance === 0) { alert(`🎉 ${loan.name} has fully paid!`); loans.splice(index, 1); }
    updateUI();
}

// --- DELETE LOAN ---
function deleteLoan(index) {
    if (confirm("Delete this loan permanently?")) { loans.splice(index, 1); updateUI(); }
}

// --- ADMIN SETTINGS ---
function openSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('ibzBankDetails'));
    if (savedSettings) {
        document.getElementById('set-bank-name').value = savedSettings.bankName;
        document.getElementById('set-acc-name').value = savedSettings.accName;
        document.getElementById('set-acc-num').value = savedSettings.accNum;
    }
    showPage('admin-settings');
}

document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const bankDetails = {
        bankName: document.getElementById('set-bank-name').value,
        accName: document.getElementById('set-acc-name').value,
        accNum: document.getElementById('set-acc-num').value
    };
    localStorage.setItem('ibzBankDetails', JSON.stringify(bankDetails));
    alert('✅ Banking details saved securely!');
    showPage('dashboard');
});

// --- CLIENT PORTAL ---
function findClientLoan() {
    const searchPhone = document.getElementById('client-search-phone').value.trim();
    
    if (!searchPhone) {
        alert("Please enter your phone number.");
        return;
    }

    // This pulls the REAL details from Settings
    const savedBank = JSON.parse(localStorage.getItem('ibzBankDetails'));
    const clientLoan = loans.find(loan => loan.phone === searchPhone);
    const resultArea = document.getElementById('client-result-area');

    if (clientLoan) {
        const isLate = new Date() > new Date(clientLoan.dueDate) && clientLoan.balance > 0;
        const formatR = (amount) => `R${amount.toFixed(2)}`;

        // Fallbacks in case you haven't saved settings yet
        const bankName = savedBank ? savedBank.bankName : 'Not Set';
        const accName = savedBank ? savedBank.accName : 'Not Set';
        const accNum = savedBank ? savedBank.accNum : 'Not Set';

        resultArea.innerHTML = `
            <h2 style="color: #f59e0b; margin-bottom: 5px;">Hello, ${clientLoan.name}</h2>
            <p style="color: #a8a29e; font-size: 12px; margin-bottom: 25px;">Here is your account summary with IBZ Capital.</p>
            
            <div style="background: rgba(0,0,0,0.3); border-radius: 16px; padding: 20px; margin-bottom: 20px; border-left: 4px solid ${isLate ? '#ef4444' : '#10b981'};">
                <p style="font-size: 12px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1px;">Current Balance Due</p>
                <h1 style="font-size: 42px; color: ${isLate ? '#ef4444' : '#10b981'}; margin: 10px 0;">${formatR(clientLoan.balance)}</h1>
                <p style="font-size: 14px; color: #fdfbf7;">Due Date: <strong>${clientLoan.dueDate}</strong></p>
                ${isLate ? '<p style="color: #ef4444; font-size: 12px; margin-top: 10px; font-weight: bold;">⚠️ Account Overdue</p>' : '<p style="color: #10b981; font-size: 12px; margin-top: 10px;">✅ Account in good standing</p>'}
            </div>

            <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; text-align: left; margin-bottom: 20px;">
                <h3 style="font-size: 14px; margin-bottom: 10px; color: #fdfbf7;">Payment Details</h3>
                <p style="font-size: 12px; color: #a8a29e; margin-bottom: 5px;">Bank: <strong>${bankName}</strong></p>
                <p style="font-size: 12px; color: #a8a29e; margin-bottom: 5px;">Account Name: <strong>${accName}</strong></p>
                <p style="font-size: 12px; color: #a8a29e; margin-bottom: 15px;">Acc Number: <strong>${accNum}</strong></p>
                <p style="font-size: 11px; color: #f59e0b;">Reference: <strong>${clientLoan.name}</strong></p>
            </div>

            <button onclick="sendWhatsAppProof('${clientLoan.name}', '${clientLoan.balance}')" class="btn-primary" style="background: #25D366; color: white; box-shadow: none;">
                <i class="fab fa-whatsapp"></i> Send Proof of Payment
            </button>
        `;
        showPage('client-dashboard');
    } else {
        alert("No account found with that phone number.");
    }
}

// --- WHATSAPP INTEGRATION ---
function sendWhatsAppProof(clientName, balance) {
    const adminPhone = '27658291242'; 
    const message = `Hello IBZ Capital, this is ${clientName}. I have just made a payment towards my balance of R${balance}. Here is my proof of payment.`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
}