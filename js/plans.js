// plans.js

let currentPackage = null;
const modal = document.getElementById('promoModal');
const promoInput = document.getElementById('promoCodeInput');

// 1. Fetch packages to show group links and attach them to DOM
document.addEventListener('DOMContentLoaded', async () => {
  const packageIds = ['crypto', 'forex', 'all', 'free']; // Note we used 'all' in HTML button
  
  for (const pid of packageIds) {
    let internalId = pid;
    if (pid === 'all') internalId = 'all'; // Keep it 'all' mapping to package id 'all'
    
    try {
      const pkg = await window.db.getPackageDetails(internalId);
      if (pkg && pkg.links && pkg.links.length > 0) {
        const container = document.getElementById(`group-links-${pid === 'all' ? 'all-in-one' : pid}`);
        if (container) {
          container.innerHTML = pkg.links.map(link => `
            <a href="${link}" class="group-link" target="_blank" rel="noopener">
              <i class="fas fa-link"></i> ${new URL(link).hostname} Group
            </a>
          `).join('');
        }
      }
    } catch (e) {
      console.warn('Could not load links for ' + pid, e);
    }
  }
});

// 2. Modal open/close logic
window.openPromoModal = function(packageId) {
  currentPackage = packageId;
  promoInput.value = ''; // clear previous
  modal.classList.add('active');
  promoInput.focus();
};

window.closePromoModal = function() {
  modal.classList.remove('active');
  currentPackage = null;
};

// Also close modal when clicking outside
modal.addEventListener('click', (e) => {
  if (e.target === modal) window.closePromoModal();
});

// 3. Submit logic
window.submitPromoCode = function() {
  const code = promoInput.value.trim();
  if (!code) {
    alert('Please enter a valid promo code.');
    return;
  }
  
  if (!currentPackage) return;
  
  // Directly navigate to payment page. The payment page will validate the promo code.
  window.location.href = `payment.html?package=${currentPackage}&promo=${encodeURIComponent(code)}`;
};

// 4. Default promo code logic
window.useDefaultPromoCode = async function() {
  if (!currentPackage) return;
  
  const btn = document.querySelector('.btn-ghost');
  const ogText = btn.innerHTML;
  btn.innerHTML = 'Loading...';
  
  try {
    const defaultPromo = await window.db.getDefaultPromoCode();
    if (defaultPromo && defaultPromo.code) {
      window.location.href = `payment.html?package=${currentPackage}&promo=${encodeURIComponent(defaultPromo.code)}`;
    } else {
      alert('No default promo code found.');
      btn.innerHTML = ogText;
    }
  } catch (e) {
    console.error(e);
    alert('Error fetching default promo code.');
    btn.innerHTML = ogText;
  }
};
