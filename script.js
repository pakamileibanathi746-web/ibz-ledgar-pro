// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- YOUR FIREBASE CONFIGURATION ---
// IMPORTANT: Replace the keys below with YOUR actual keys from the Firebase Console!
const firebaseConfig = {
  const firebaseConfig = {
  apiKey: "AIzaSyCwT_-2Af30-PPhWNC08a_yvLbYg-3WvRs",
  authDomain: "ibz-capital.firebaseapp.com",
  projectId: "ibz-capital",
  storageBucket: "ibz-capital.firebasestorage.app",
  messagingSenderId: "28073595243",
  appId: "1:28073595243:web:648ddc53d0425b4600fc2e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const loansCollection = collection(db, "loans");

// Global variables
let loans = [];
let savedBank = JSON.parse(localStorage.getItem('ibzBankDetails')); 

// --- PAGE NAVIGATION ---
window.showPage = function(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    if(pageId === 'admin-login') document.getElementById('admin-pin').value = '';
}

// --- ADMIN LOGIN ---
window.loginAdmin = function() {
    const pin = document.getElementById('admin-pin').value;
    if (pin === '2026') {
        showPage('dashboard');
    } else { 
        alert('Incorrect PIN.'); 
    }
}

// --- TOGGLE FORM ---
window.toggleForm = function() {
    const form = document.getElementById('add-loan-section');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// --- REAL-TIME CLOUD SYNC ---
onSnapshot(loansCollection, (snapshot) => {
    loans = [];
    snapshot.forEach((doc) => {
        loans.push({ id: doc.id, ...doc.data() });
    });
    updateUI();
});

// --- UPDATE UI ---
function updateUI() {
    const ledgerList = document.getElementById('ledger-list');
    if(!ledgerList) return; 
    
    ledgerList.innerHTML = '';
    
    let totalCapital = 0;
    let totalCollected = 0;
    let currentOutstanding = 0;
    let totalExpected = 0; 
    let totalProfit = 0; 

    if (loans.length === 0) {
        ledgerList.innerHTML = '<p style="text-align:center; color:#a8a29e; padding: 20px;">No active loans in the cloud.</p>';
    }

    loans.forEach((loan) => {
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
                <button onclick="recordPayment('${loan.id}', ${loan.balance})" class="btn-pay"><i class="fas fa-hand-holding-usd"></i> Record Payment</button>
                <button onclick="deleteLoan('${loan.id}')" class="btn-del"><i class="fas fa-trash"></i></button>
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
}

// --- ADD LOAN TO CLOUD ---
document.getElementById('loan-form').addEventListener('submit', async (e) => {
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

    try {
        await addDoc(loansCollection, newLoan);
        document.getElementById('loan-form').reset();
        document.getElementById('add-loan-section').style.display = 'none';
    } catch (error) {
        alert("Error adding loan: " + error.message);
    }
});

// --- RECORD PAYMENT IN CLOUD ---
window.recordPayment = async function(loanId, currentBalance) {
    const payment = prompt(`How much are they paying? (Balance: R${currentBalance})`);
    if (payment === null || payment === '') return;
    const payAmount = parseFloat(payment);
    
    if (isNaN(payAmount) || payAmount <= 0 || payAmount > currentBalance) {
        alert("Invalid amount."); return;
    }
    
    const newBalance = currentBalance - payAmount;
    const loanRef = doc(db, "loans", loanId);

    try {
        if (newBalance === 0) { 
            alert(`🎉 They have fully paid!`); 
            await deleteDoc(loanRef); 
        } else {
            await updateDoc(loanRef, { balance: newBalance });
        }
    } catch (error) {
        alert("Error updating payment: " + error.message);
    }
}

// --- DELETE LOAN FROM CLOUD ---
window.deleteLoan = async function(loanId) {
    if (confirm("Delete this loan permanently from the cloud?")) { 
        await deleteDoc(doc(db, "loans", loanId)); 
    }
}

// --- ADMIN SETTINGS ---
window.openSettings = function() {
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
    alert('✅ Banking details saved securely on this device!');
    showPage('dashboard');
});

// --- CLIENT PORTAL ---
window.findClientLoan = function() {
    const searchPhone = document.getElementById('client-search-phone').value.trim();
    
    if (!searchPhone) {
        alert("Please enter your phone number.");
        return;
    }

    const savedBank = JSON.parse(localStorage.getItem('ibzBankDetails'));
    const clientLoan = loans.find(loan => loan.phone === searchPhone);
    const resultArea = document.getElementById('client-result-area');

    if (clientLoan) {
        const isLate = new Date() > new Date(clientLoan.dueDate) && clientLoan.balance > 0;
        const formatR = (amount) => `R${amount.toFixed(2)}`;

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
window.sendWhatsAppProof = function(clientName, balance) {
    const adminPhone = '27658291242'; 
    const message = `Hello IBZ Capital, this is ${clientName}. I have just made a payment towards my balance of R${balance}. Here is my proof of payment.`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
}