// admin.js — KILLERS VIP Admin Dashboard

// ═══════════════════════════════════════════
// 1. LOGIN
// ═══════════════════════════════════════════
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
    setTimeout(() => {
      document.getElementById('loginError').style.display = 'none';
    }, 3000);
  }
};

window.logout = function() {
  isLoggedIn = false;
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('loginKey').value = '';
  document.getElementById('loginPass').value = '';
};

// Allow Enter key to submit login
document.addEventListener('DOMContentLoaded', () => {
  ['loginKey', 'loginPass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });
});

// ═══════════════════════════════════════════
// 2. TAB NAVIGATION
// ═══════════════════════════════════════════
window.switchTab = function(tabId, el) {
  document.querySelectorAll('.tab-section').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pageTitle').innerText = el.innerText;

  if (tabId === 'packages') renderPackages();
  if (tabId === 'promocodes') renderPromos();
  if (tabId === 'leaderboard') renderLeaderboard();
};

// ═══════════════════════════════════════════
// 3. MODAL CONTROLS
// ═══════════════════════════════════════════
window.closeModal = function(id) {
  document.getElementById(id).classList.remove('active');
};
window.openModal = function(id) {
  document.getElementById(id).classList.add('active');
};

// ═══════════════════════════════════════════
// TOAST SYSTEM (replaces all alerts)
// ═══════════════════════════════════════════
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  const colors = {
    success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', icon: '#22c55e' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', icon: '#ef4444' },
    warning: { bg: 'rgba(247,147,26,0.15)', border: 'rgba(247,147,26,0.4)', icon: '#f7931a' },
    info: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', icon: '#818cf8' }
  };
  const c = colors[type] || colors.success;
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

  toast.style.cssText = `
    position: fixed; bottom: 30px; right: 30px; z-index: 9999;
    background: ${c.bg}; border: 1px solid ${c.border};
    color: #fff; padding: 16px 24px; border-radius: 12px;
    font-size: 0.95rem; font-weight: 500;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    backdrop-filter: blur(15px);
    display: flex; align-items: center; gap: 12px;
    animation: fadeIn 0.3s ease;
    max-width: 420px;
  `;
  toast.innerHTML = `<i class="fas ${icons[type]}" style="color:${c.icon}; font-size:1.1rem;"></i> <span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ═══════════════════════════════════════════
// 4. PACKAGES LOGIC
// ═══════════════════════════════════════════
async function renderPackages() {
  const container = document.getElementById('packagesList');
  container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:20px;">Loading packages...</div>';

  try {
    const packages = await window.db.getAllPackages();

    const html = packages.map(pkg => `
      <div class="card" style="margin-bottom:0">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <h4 style="color:var(--primary)">${pkg.name}</h4>
          <button class="btn btn-sm btn-outline" onclick="editPackage('${pkg.id}')">Edit Links</button>
        </div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px;">Price: <strong style="color:var(--primary)">${pkg.price} USDT</strong></div>
        <div>
          ${(pkg.links || []).map(l => {
            const icon = l.includes('t.me') || l.includes('telegram') ? '📱' :
                         l.includes('whatsapp') || l.includes('wa.me') ? '💬' : '🔗';
            return `<div style="font-size:0.85rem; padding:6px 0; border-bottom:1px dashed var(--border); display:flex; align-items:center; gap:6px;">${icon} ${l}</div>`;
          }).join('') || '<div style="color:var(--text-muted); font-size:0.85rem;">No links added yet</div>'}
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  } catch (e) {
    console.error('Error loading packages:', e);
    container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--danger); padding:20px;"><i class="fas fa-exclamation-triangle"></i> Failed to load packages. Please refresh.</div>';
  }
}

window.editPackage = async function(id) {
  try {
    const pkg = await window.db.getPackageDetails(id);
    if (!pkg) { showToast('Package not found', 'error'); return; }

    document.getElementById('editingPkgId').value = id;
    document.getElementById('pkgModalTitle').innerText = 'Edit Links: ' + pkg.name;
    const cont = document.getElementById('pkgLinksContainer');
    cont.innerHTML = '';
    (pkg.links || []).forEach((l, idx) => addPkgLinkRow(l, idx));
    openModal('packageModal');
  } catch (e) {
    console.error(e);
    showToast('Error loading package details', 'error');
  }
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

window.savePkgLinks = async function() {
  const id = document.getElementById('editingPkgId').value;
  const inputs = document.querySelectorAll('.pkg-link-input');
  const links = Array.from(inputs).map(inp => inp.value).filter(v => v.trim() !== '');

  const btn = document.querySelector('#packageModal .btn-primary');
  const ogText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    await window.db.updatePackageLinks(id, links);
    closeModal('packageModal');
    renderPackages();
    showToast('Package links updated successfully!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to save package links: ' + e.message, 'error');
  } finally {
    btn.innerHTML = ogText;
    btn.disabled = false;
  }
};

// ═══════════════════════════════════════════
// 5. PROMO CODES LOGIC (only "Default" — no "Standard")
// ═══════════════════════════════════════════
async function renderPromos() {
  const tbody = document.getElementById('promoTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Loading promo codes...</td></tr>';

  try {
    const promoCodes = await window.db.getAllPromoCodes();

    const html = promoCodes.map(p => {
      const banks = p.bank_details || [];
      return `
        <tr>
          <td style="font-weight:bold; color:var(--primary)">${p.code}</td>
          <td>${p.is_default ? '<span class="badge badge-primary">Default</span>' : '<span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">Custom</span>'}</td>
          <td>${p.usage_count || 0}</td>
          <td>${banks.length} Account(s)</td>
          <td class="text-right">
            <button class="btn btn-sm btn-outline" onclick="editPromo(${p.id})">Edit</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html || '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No promo codes found. Click "Add Promo Code" to create one.</td></tr>';
  } catch (e) {
    console.error('Error loading promo codes:', e);
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--danger)"><i class="fas fa-exclamation-triangle"></i> Failed to load promo codes</td></tr>';
  }
}

window.openPromoModal = async function(id = null) {
  document.getElementById('editingPromoId').value = id || '';

  if (id) {
    try {
      const promoCodes = await window.db.getAllPromoCodes();
      const p = promoCodes.find(x => x.id === id);
      if (!p) { showToast('Promo code not found', 'error'); return; }

      document.getElementById('promoModalTitle').innerText = 'Edit Promo Code';
      document.getElementById('promoCodeVal').value = p.code;
      document.getElementById('promoIsDefault').checked = p.is_default;
      const banks = p.bank_details || [];
      const cont = document.getElementById('promoBanksContainer');
      cont.innerHTML = '';
      banks.forEach(b => addBankForm(b));
    } catch (e) {
      console.error(e);
      showToast('Error loading promo code details', 'error');
      return;
    }
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
        <label>Bank Name / Wallet (e.g. BOC, Binance Pay ID)</label>
        <input type="text" class="form-control b-name" value="${b.bank_name || ''}" placeholder="e.g. Commercial Bank / Binance Pay ID">
      </div>
      <div class="form-group mb-3">
        <label>Account Name</label>
        <input type="text" class="form-control b-acc" value="${b.account_name || ''}" placeholder="e.g. Killers Group">
      </div>
      <div class="form-group mb-3">
        <label>Account Number / Binance ID</label>
        <input type="text" class="form-control b-num" value="${b.account_number || ''}" placeholder="e.g. 1234567890 or Binance UID">
      </div>
      <div class="form-group mb-3">
        <label>Branch (Optional)</label>
        <input type="text" class="form-control b-branch" value="${b.branch || ''}" placeholder="e.g. Colombo (leave empty for crypto)">
      </div>
    </div>
  `;
  cont.appendChild(d);
};

window.savePromoCode = async function() {
  const id = document.getElementById('editingPromoId').value;
  const code = document.getElementById('promoCodeVal').value.trim();
  const isDef = document.getElementById('promoIsDefault').checked;

  if (!code) { showToast('Promo Code is required', 'warning'); return; }

  // Collect bank details
  const bankDetailsArray = [];
  const cards = document.querySelectorAll('#promoBanksContainer .bank-card');
  cards.forEach(c => {
    const bName = c.querySelector('.b-name').value.trim();
    const bAcc = c.querySelector('.b-acc').value.trim();
    const bNum = c.querySelector('.b-num').value.trim();
    const bBranch = c.querySelector('.b-branch').value.trim();
    if (bName && bNum) {
      bankDetailsArray.push({ bank_name: bName, account_name: bAcc, account_number: bNum, branch: bBranch });
    }
  });

  const btn = document.querySelector('#promoModal .btn-primary');
  const ogText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    await window.db.savePromoCodeToDB(
      { id: id ? parseInt(id) : null, code, is_default: isDef },
      bankDetailsArray
    );
    closeModal('promoModal');
    renderPromos();
    showToast('Promo code saved successfully!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Failed to save promo code: ' + e.message, 'error');
  } finally {
    btn.innerHTML = ogText;
    btn.disabled = false;
  }
};

// ═══════════════════════════════════════════
// 6. LEADERBOARD
// ═══════════════════════════════════════════
async function renderLeaderboard() {
  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted)">Loading...</td></tr>';

  try {
    const promoCodes = await window.db.getAllPromoCodes();
    const sorted = [...promoCodes].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));

    const html = sorted.map((p, idx) => {
      let rankHtml = `<strong>#${idx + 1}</strong>`;
      if (idx === 0) rankHtml = `<i class="fas fa-medal" style="color:#fbbf24; font-size:1.2rem;"></i>`;
      if (idx === 1) rankHtml = `<i class="fas fa-medal" style="color:#94a3b8; font-size:1.2rem;"></i>`;
      if (idx === 2) rankHtml = `<i class="fas fa-medal" style="color:#b45309; font-size:1.2rem;"></i>`;
      return `
        <tr>
          <td>${rankHtml}</td>
          <td style="font-weight:600">${p.code}</td>
          <td><span style="color:var(--success); font-weight:bold">${p.usage_count || 0}</span></td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = html || '<tr><td colspan="3" style="text-align:center; color:var(--text-muted)">No promo codes yet</td></tr>';
  } catch (e) {
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--danger)">Failed to load leaderboard</td></tr>';
  }
}

// End of Dashboard Logic
function initDashboard() {
  renderPackages();
}

