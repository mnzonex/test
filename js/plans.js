// plans.js — Free groups = direct join, Paid = promo modal, No alerts (in-page toasts)

let currentPackage = null;
const modal = document.getElementById('promoModal');
const promoInput = document.getElementById('promoCodeInput');

// ═══════════════════════════════════════════
// TOAST NOTIFICATION SYSTEM (replaces alerts)
// ═══════════════════════════════════════════
function showToast(message, type = 'error') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    error: 'fas fa-exclamation-circle',
    success: 'fas fa-check-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  toast.innerHTML = `
    <i class="${iconMap[type] || iconMap.info}"></i>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

// ═══════════════════════════════════════════
// DETECT LINK TYPE & GENERATE BEAUTIFUL ICON
// ═══════════════════════════════════════════
function getLinkInfo(link) {
  try {
    const url = new URL(link);
    if (url.hostname.includes('t.me') || url.hostname.includes('telegram')) {
      return { icon: 'fab fa-telegram-plane', label: 'Telegram Group', color: '#229ED9' };
    }
    if (url.hostname.includes('whatsapp') || url.hostname.includes('wa.me')) {
      return { icon: 'fab fa-whatsapp', label: 'WhatsApp Group', color: '#25D366' };
    }
    if (url.hostname.includes('discord')) {
      return { icon: 'fab fa-discord', label: 'Discord Server', color: '#5865F2' };
    }
    return { icon: 'fas fa-link', label: 'Group Link', color: 'var(--or)' };
  } catch {
    return { icon: 'fas fa-link', label: 'Group Link', color: 'var(--or)' };
  }
}

// ═══════════════════════════════════════════
// LOAD VIP GROUP LINKS (for paid plans)
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  const paidPackages = ['crypto', 'forex', 'all'];

  for (const pid of paidPackages) {
    try {
      const pkg = await window.db.getPackageDetails(pid);
      if (pkg && pkg.links && pkg.links.length > 0) {
        const containerId = pid === 'all' ? 'group-links-all-in-one' : `group-links-${pid}`;
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = pkg.links.map(link => {
            const info = getLinkInfo(link);
            return `
              <a href="${link}" class="group-link-btn" target="_blank" rel="noopener" style="--link-color: ${info.color}">
                <i class="${info.icon}"></i>
                <span>${info.label}</span>
                <i class="fas fa-external-link-alt gl-arrow"></i>
              </a>
            `;
          }).join('');
        }
      }
    } catch (e) {
      console.warn('Could not load links for ' + pid, e);
    }
  }

  // ═══════════════════════════════════════════
  // LOAD FREE GROUP LINKS (direct join buttons)
  // ═══════════════════════════════════════════
  try {
    const freePkg = await window.db.getPackageDetails('free');
    const freeContainer = document.getElementById('free-group-buttons');

    if (freePkg && freePkg.links && freePkg.links.length > 0) {
      freeContainer.innerHTML = freePkg.links.map((link, idx) => {
        const info = getLinkInfo(link);
        return `
          <a href="${link}" class="free-join-btn" target="_blank" rel="noopener" style="--btn-color: ${info.color}; animation-delay: ${idx * 0.1}s">
            <div class="fjb-icon"><i class="${info.icon}"></i></div>
            <div class="fjb-text">
              <span class="fjb-label">${info.label}</span>
              <span class="fjb-sub">Tap to join free</span>
            </div>
            <div class="fjb-arrow"><i class="fas fa-arrow-right"></i></div>
          </a>
        `;
      }).join('');
    } else {
      freeContainer.innerHTML = '<p style="color:var(--tx2); text-align:center;">Free groups coming soon!</p>';
    }
  } catch (e) {
    console.warn('Could not load free group links', e);
    const freeContainer = document.getElementById('free-group-buttons');
    if (freeContainer) {
      freeContainer.innerHTML = `
        <div class="group-error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Could not load free groups. Please refresh the page.</span>
        </div>
      `;
    }
  }
});

// ═══════════════════════════════════════════
// PROMO MODAL (only for paid plans)
// ═══════════════════════════════════════════
window.openPromoModal = function(packageId) {
  currentPackage = packageId;
  promoInput.value = '';
  modal.classList.add('active');
  promoInput.focus();
};

window.closePromoModal = function() {
  modal.classList.remove('active');
  currentPackage = null;
};

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) window.closePromoModal();
});

// Submit promo code
window.submitPromoCode = function() {
  const code = promoInput.value.trim();
  if (!code) {
    showToast('Please enter a valid promo code.', 'warning');
    promoInput.focus();
    return;
  }

  if (!currentPackage) return;

  window.location.href = `payment.html?package=${currentPackage}&promo=${encodeURIComponent(code)}`;
};

// Use default promo code (continue without promo code)
window.useDefaultPromoCode = async function() {
  if (!currentPackage) return;

  const btn = document.querySelector('.btn-ghost');
  const ogText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  btn.disabled = true;

  try {
    const defaultPromo = await window.db.getDefaultPromoCode();
    if (defaultPromo && defaultPromo.code) {
      window.location.href = `payment.html?package=${currentPackage}&promo=${encodeURIComponent(defaultPromo.code)}`;
    } else {
      showToast('No default promo code found. Please enter a promo code or contact support.', 'error');
      btn.innerHTML = ogText;
      btn.disabled = false;
    }
  } catch (e) {
    console.error(e);
    showToast('Could not fetch default promo code. Please try again later.', 'error');
    btn.innerHTML = ogText;
    btn.disabled = false;
  }
};

// Enter key to submit promo
promoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') window.submitPromoCode();
});
