// admin.js

// 1. Login State
let isLoggedIn = false;

window.handleLogin = function() {
  const key = document.getElementById('loginKey').value;
  const pass = document.getElementById('loginPass').value;
  if (key === 'admin123' && pass === 'killers2026') {
    isLoggedIn = true;
    document.getElementById('login-overlay').classList.add('hidden');
    initDashboard();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
};

window.logout = function() {
  isLoggedIn = false;
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('loginKey').value = '';
  document.getElementById('loginPass').value = '';
};

// 2. Tab Navigation
window.switchTab = function(tabId, el) {
  document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pageTitle').innerText = el.innerText;
  
  if (tabId === 'packages') renderPackages();
  if (tabId === 'promocodes') renderPromos();
  if (tabId === 'leaderboard') renderLeaderboard();
  if (tabId === 'signals') renderSignals();
};

// 3. Modal Controls
window.closeModal = function(id) {
  document.getElementById(id).classList.remove('active');
};
window.openModal = function(id) {
  document.getElementById(id).classList.add('active');
};

// ========= DEMO DB (Ref to supabase-config.js mock) =========
let mockDB = null;

function getDB() {
  if(!mockDB) {
     mockDB = {
        packages: [
          { id: 'crypto', name: 'Crypto VIP', price: 40, links: ['https://t.me/crypto1'] },
          { id: 'forex', name: 'Forex VIP', price: 40, links: ['https://t.me/forex1'] },
          { id: 'all', name: 'All-in-One', price: 60, links: ['https://t.me/all1', 'https://t.me/all2', 'https://t.me/all3'] },
          { id: 'free', name: 'Free Signals', price: 0, links: ['https://t.me/free1'] }
        ],
        promo_codes: [
          { id: 1, code: 'DEF100', is_default: true, usage_count: 520 },
          { id: 2, code: 'DILA14', is_default: false, usage_count: 450 }
        ],
        bank_details: [
          { id: 1, promo_code_id: 1, bank_name: 'BOC', account_name: 'Killers Group', account_number: '1234567890', branch: 'Colombo' },
          { id: 2, promo_code_id: 1, bank_name: 'Binance', account_name: 'Killers', account_number: '12344321', branch: 'PayID' },
          { id: 3, promo_code_id: 2, bank_name: 'Commercial Bank', account_name: 'Dila', account_number: '987654321', branch: 'Kurunegala' }
        ]
     };
  }
  return mockDB;
}

// 4. Packages Logic
function renderPackages() {
  const db = getDB();
  const html = db.packages.map(pkg => `
    <div class="card" style="margin-bottom:0">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <h4 style="color:var(--primary)">${pkg.name}</h4>
        <button class="btn btn-sm btn-outline" onclick="editPackage('${pkg.id}')">Edit Links</button>
      </div>
      <div>
        ${pkg.links.map(l => `<div style="font-size:0.85rem; padding:4px 0; border-bottom:1px dashed var(--border)">🔗 ${l}</div>`).join('')}
      </div>
    </div>
  `).join('');
  document.getElementById('packagesList').innerHTML = html;
}

window.editPackage = function(id) {
  const pkg = getDB().packages.find(p => p.id === id);
  document.getElementById('editingPkgId').value = id;
  document.getElementById('pkgModalTitle').innerText = 'Edit Links: ' + pkg.name;
  const cont = document.getElementById('pkgLinksContainer');
  cont.innerHTML = '';
  pkg.links.forEach((l, idx) => addPkgLinkRow(l, idx));
  openModal('packageModal');
};

window.addPkgLinkRow = function(val = '', uid = Date.now()) {
  const cont = document.getElementById('pkgLinksContainer');
  const d = document.createElement('div');
  d.className = 'link-row';
  d.innerHTML = `
    <input type="text" class="form-control pkg-link-input" value="${val}" placeholder="https://t.me/...">
    <button class="btn btn-danger" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
  `;
  cont.appendChild(d);
};

window.savePkgLinks = function() {
  const id = document.getElementById('editingPkgId').value;
  const inputs = document.querySelectorAll('.pkg-link-input');
  const links = Array.from(inputs).map(inp => inp.value).filter(v => v.trim() !== '');
  const db = getDB();
  const pkg = db.packages.find(p => p.id === id);
  if(pkg) pkg.links = links;
  closeModal('packageModal');
  renderPackages();
  alert('Package links updated successfully.');
};

// 5. Promo Codes Logic
function renderPromos() {
  const db = getDB();
  const html = db.promo_codes.map(p => {
    const banks = db.bank_details.filter(b => b.promo_code_id === p.id);
    return `
      <tr>
        <td style="font-weight:bold; color:var(--primary)">${p.code}</td>
        <td>${p.is_default ? '<span class="badge badge-primary">Default</span>' : '<span style="color:gray">Standard</span>'}</td>
        <td>${p.usage_count}</td>
        <td>${banks.length} Account(s)</td>
        <td class="text-right">
          <button class="btn btn-sm btn-outline" onclick="editPromo(${p.id})">Edit Banks</button>
        </td>
      </tr>
    `;
  }).join('');
  document.getElementById('promoTableBody').innerHTML = html;
}

window.openPromoModal = function(id = null) {
  document.getElementById('editingPromoId').value = id || '';
  const db = getDB();
  if(id) {
    const p = db.promo_codes.find(x => x.id === id);
    document.getElementById('promoModalTitle').innerText = 'Edit Promo Code';
    document.getElementById('promoCodeVal').value = p.code;
    document.getElementById('promoIsDefault').checked = p.is_default;
    const banks = db.bank_details.filter(b => b.promo_code_id === p.id);
    const cont = document.getElementById('promoBanksContainer');
    cont.innerHTML = '';
    banks.forEach(b => addBankForm(b));
  } else {
    document.getElementById('promoModalTitle').innerText = 'Add Promo Code';
    document.getElementById('promoCodeVal').value = '';
    document.getElementById('promoIsDefault').checked = false;
    document.getElementById('promoBanksContainer').innerHTML = '';
    addBankForm();
  }
  openModal('promoModal');
};

window.editPromo = window.openPromoModal;

window.addBankForm = function(b = {}) {
  const cont = document.getElementById('promoBanksContainer');
  const d = document.createElement('div');
  d.className = 'bank-card';
  d.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
      <h5 style="color:var(--text-muted)">Payment Account</h5>
      <button class="btn btn-sm btn-danger" onclick="this.parentElement.parentElement.remove()"><i class="fas fa-trash"></i></button>
    </div>
    <div class="grid grid-2">
      <div class="form-group mb-3">
        <label>Bank Name / Wallet</label>
        <input type="text" class="form-control b-name" value="${b.bank_name || ''}">
      </div>
      <div class="form-group mb-3">
        <label>Account Name</label>
        <input type="text" class="form-control b-acc" value="${b.account_name || ''}">
      </div>
      <div class="form-group mb-3">
        <label>Account Number/ID</label>
        <input type="text" class="form-control b-num" value="${b.account_number || ''}">
      </div>
      <div class="form-group mb-3">
        <label>Branch (Optional)</label>
        <input type="text" class="form-control b-branch" value="${b.branch || ''}">
      </div>
    </div>
  `;
  cont.appendChild(d);
};

window.savePromoCode = function() {
  const db = getDB();
  const id = document.getElementById('editingPromoId').value;
  const code = document.getElementById('promoCodeVal').value.trim();
  const isDef = document.getElementById('promoIsDefault').checked;
  if(!code) return alert('Promo Code required');
  if(isDef) db.promo_codes.forEach(p => p.is_default = false);
  let pId = id ? parseInt(id) : Date.now();
  if(id) {
    const p = db.promo_codes.find(x => x.id === pId);
    p.code = code;
    p.is_default = isDef;
    db.bank_details = db.bank_details.filter(b => b.promo_code_id !== pId);
  } else {
    db.promo_codes.push({ id: pId, code, is_default: isDef, usage_count: 0 });
  }
  const cards = document.querySelectorAll('#promoBanksContainer .bank-card');
  cards.forEach(c => {
    const bName = c.querySelector('.b-name').value;
    const bAcc = c.querySelector('.b-acc').value;
    const bNum = c.querySelector('.b-num').value;
    const bBranch = c.querySelector('.b-branch').value;
    if(bName && bNum) {
      db.bank_details.push({
        id: Date.now() + Math.random(),
        promo_code_id: pId,
        bank_name: bName, account_name: bAcc, account_number: bNum, branch: bBranch
      });
    }
  });
  closeModal('promoModal');
  renderPromos();
  alert('Promo code saved successfully.');
};

// 6. Leaderboard Logic
function renderLeaderboard() {
  const db = getDB();
  const sorted = [...db.promo_codes].sort((a,b) => b.usage_count - a.usage_count);
  const html = sorted.map((p, idx) => {
    let rankHtml = `<strong>#${idx+1}</strong>`;
    if(idx === 0) rankHtml = `<i class="fas fa-medal" style="color:#fbbf24; font-size:1.2rem;"></i>`;
    if(idx === 1) rankHtml = `<i class="fas fa-medal" style="color:#94a3b8; font-size:1.2rem;"></i>`;
    if(idx === 2) rankHtml = `<i class="fas fa-medal" style="color:#b45309; font-size:1.2rem;"></i>`;
    return `
      <tr>
        <td>${rankHtml}</td>
        <td style="font-weight:600">${p.code}</td>
        <td><span style="color:var(--success); font-weight:bold">${p.usage_count}</span></td>
      </tr>
    `;
  }).join('');
  document.getElementById('leaderboardBody').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 7. SIGNALS & NOTIFICATIONS MANAGEMENT
// ═══════════════════════════════════════════════════════════

function formatSignalTime(isoStr) {
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function renderSignals() {
  const tbody = document.getElementById('signalsTableBody');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Loading...</td></tr>';

  try {
    const signals = await window.db.getSignals();
    if (!signals || signals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">No signals yet. Click "Push Trade Signal" or "Push Notification" to send one.</td></tr>';
      return;
    }

    tbody.innerHTML = signals.map(s => {
      let typeHtml, detailsHtml;

      if (s.type === 'notification') {
        typeHtml = '<span class="badge" style="background:rgba(99,102,241,0.15); color:#818cf8;">Notification</span>';
        detailsHtml = `<span style="color:var(--text)">${s.message || '-'}</span>`;
      } else {
        const isLong = (s.direction || '').toUpperCase() === 'LONG';
        const dirColor = isLong ? '#22c55e' : '#ef4444';
        const dirIcon = isLong ? 'fa-arrow-up' : 'fa-arrow-down';
        typeHtml = `<span class="badge" style="background:${isLong ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}; color:${dirColor};">
          <i class="fas ${dirIcon}"></i> ${s.market} Signal
        </span>`;
        detailsHtml = `
          <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
            <strong style="color:var(--primary)">${s.pair || '-'}</strong>
            <span style="background:${isLong ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}; color:${dirColor}; padding:2px 6px; border-radius:4px; font-size:0.75rem; font-weight:700;">${s.direction}</span>
            ${s.leverage ? `<span style="font-size:0.8rem; color:var(--text-muted)">${s.leverage}</span>` : ''}
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
            Entry: <b style="color:#fff">${s.entry || '-'}</b> &nbsp; TP: <b style="color:#22c55e">${s.tp || '-'}</b> &nbsp; SL: <b style="color:#ef4444">${s.sl || '-'}</b>
          </div>
          ${s.message ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">📝 ${s.message}</div>` : ''}
        `;
      }

      return `
        <tr>
          <td>${typeHtml}</td>
          <td>${detailsHtml}</td>
          <td style="font-size:0.85rem; color:var(--text-muted); white-space:nowrap;">${formatSignalTime(s.created_at)}</td>
          <td class="text-right">
            <div class="flex-row" style="justify-content:flex-end;">
              <button class="btn btn-sm btn-outline" onclick="editSignal(${s.id})"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deleteSignalById(${s.id})"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch(e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--danger)">Error loading signals</td></tr>';
  }
}

// Open Signal/Notification modal
window.openSignalModal = function(type, existingData = null) {
  document.getElementById('signalType').value = type;

  const tradeFields = document.getElementById('tradeSignalFields');
  if (type === 'signal') {
    tradeFields.style.display = 'block';
    document.getElementById('signalModalTitle').innerHTML = '<i class="fas fa-bolt" style="color:var(--primary)"></i> Push Trade Signal';
  } else {
    tradeFields.style.display = 'none';
    document.getElementById('signalModalTitle').innerHTML = '<i class="fas fa-comment-dots" style="color:var(--primary)"></i> Push Notification';
  }

  if (existingData) {
    document.getElementById('editingSignalId').value = existingData.id;
    document.getElementById('sigMarket').value = (existingData.market || 'CRYPTO').toUpperCase();
    document.getElementById('sigDirection').value = (existingData.direction || 'LONG').toUpperCase();
    document.getElementById('sigPair').value = existingData.pair || '';
    document.getElementById('sigLeverage').value = existingData.leverage || '';
    document.getElementById('sigEntry').value = existingData.entry || '';
    document.getElementById('sigTp').value = existingData.tp || '';
    document.getElementById('sigSl').value = existingData.sl || '';
    document.getElementById('sigMessage').value = existingData.message || '';
  } else {
    document.getElementById('editingSignalId').value = '';
    document.getElementById('sigMarket').value = 'CRYPTO';
    document.getElementById('sigDirection').value = 'LONG';
    document.getElementById('sigPair').value = '';
    document.getElementById('sigLeverage').value = '';
    document.getElementById('sigEntry').value = '';
    document.getElementById('sigTp').value = '';
    document.getElementById('sigSl').value = '';
    document.getElementById('sigMessage').value = '';
  }

  openModal('signalModal');
};

// Edit existing signal
window.editSignal = async function(id) {
  try {
    const signals = await window.db.getSignals();
    const sig = signals.find(s => s.id === id);
    if (!sig) return alert('Signal not found');
    openSignalModal(sig.type, sig);
  } catch(e) {
    console.error(e);
    alert('Error loading signal for edit.');
  }
};

// Save (create or update) signal
window.saveSignal = async function() {
  const type = document.getElementById('signalType').value;
  const editId = document.getElementById('editingSignalId').value;
  const message = document.getElementById('sigMessage').value.trim();

  let signalData = {
    type,
    message,
    created_at: new Date().toISOString()
  };

  if (type === 'signal') {
    signalData.market = document.getElementById('sigMarket').value;
    signalData.direction = document.getElementById('sigDirection').value;
    signalData.pair = document.getElementById('sigPair').value.trim();
    signalData.leverage = document.getElementById('sigLeverage').value.trim();
    signalData.entry = document.getElementById('sigEntry').value.trim();
    signalData.tp = document.getElementById('sigTp').value.trim();
    signalData.sl = document.getElementById('sigSl').value.trim();

    if (!signalData.pair) return alert('Please enter a Coin/Pair');
  } else {
    if (!message) return alert('Please enter a message');
  }

  const btn = document.querySelector('#signalModal .btn-primary');
  const ogText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pushing...';
  btn.disabled = true;

  try {
    if (editId) {
      // For edit: delete old then create new (simple approach for mock)
      await window.db.deleteSignal(parseInt(editId));
    }
    await window.db.createSignal(signalData);

    closeModal('signalModal');
    await renderSignals();
    
    // Show success toast
    showToast(type === 'signal' 
      ? `✅ ${signalData.market} Signal pushed: ${signalData.pair} ${signalData.direction}`
      : '✅ Notification pushed successfully!');
  } catch(e) {
    console.error(e);
    alert('Error pushing signal: ' + e.message);
  } finally {
    btn.innerHTML = ogText;
    btn.disabled = false;
  }
};

// Delete signal
window.deleteSignalById = async function(id) {
  if (!confirm('Are you sure you want to delete this signal?')) return;
  try {
    await window.db.deleteSignal(id);
    await renderSignals();
    showToast('🗑️ Signal deleted successfully');
  } catch(e) {
    console.error(e);
    alert('Error deleting signal');
  }
};

// Simple toast
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 30px; right: 30px; z-index: 9999;
    background: #18181b; border: 1px solid var(--primary, #f7931a);
    color: #fff; padding: 16px 24px; border-radius: 10px;
    font-size: 0.95rem; font-weight: 500; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: fadeIn 0.3s ease;
  `;
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Init
function initDashboard() {
  renderPackages();
}

