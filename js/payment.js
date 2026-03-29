// payment.js — Beautiful in-page error handling (no alerts)

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('package');
  const promoCode = urlParams.get('promo');

  const loadingState = document.getElementById('loadingState');
  const paymentContent = document.getElementById('paymentContent');

  // Show error in-page (beautiful error display)
  function showPaymentError(message, showBackBtn = true) {
    loadingState.innerHTML = `
      <div class="payment-error-card">
        <div class="pe-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3>Something went wrong</h3>
        <p>${message}</p>
        ${showBackBtn ? '<a href="plans.html" class="btn btn-ghost" style="margin-top:15px;"><i class="fas fa-arrow-left"></i> Back to Plans</a>' : ''}
      </div>
    `;
  }

  // Validate URL params
  if (!packageId || !promoCode) {
    showPaymentError('Missing package or promo code information. Please select a plan first.');
    return;
  }

  try {
    const pkg = await window.db.getPackageDetails(packageId);
    const promo = await window.db.getPromoCodeDetails(promoCode);

    if (!pkg) {
      showPaymentError('Package not found. The selected package may no longer be available.');
      return;
    }
    if (!promo) {
      showPaymentError('Invalid Promo Code. The promo code you entered is not valid. Please check and try again.');
      return;
    }

    document.getElementById('pkgName').innerText = pkg.name;
    document.getElementById('promoCodeDisplay').innerText = promoCode.toUpperCase();

    const bankDetails = promo.bank_details || [];

    if (bankDetails.length === 0) {
      document.getElementById('bankDetailsContainer').innerHTML = `
        <div class="no-bank-card">
          <i class="fas fa-info-circle" style="font-size:1.5rem; color:var(--or); margin-bottom:10px;"></i>
          <p style="color:var(--tx2)">No payment methods available for this promo code.</p>
          <p style="color:var(--tx3); font-size:0.85rem;">Please contact support via WhatsApp for payment instructions.</p>
        </div>
      `;
    } else {
      const bankHtml = bankDetails.map(b => {
        // Detect if it's Binance/Crypto or a regular bank
        const isCrypto = (b.bank_name || '').toLowerCase().includes('binance') ||
                         (b.bank_name || '').toLowerCase().includes('crypto') ||
                         (b.bank_name || '').toLowerCase().includes('pay id') ||
                         (b.bank_name || '').toLowerCase().includes('usdt');
        const icon = isCrypto ? 'fab fa-bitcoin' : 'fas fa-university';
        const acLabel = isCrypto ? 'Binance ID / Pay ID' : 'Account No';

        return `
          <div class="bank-card fadeUp">
            <h4><i class="${icon}"></i> ${b.bank_name || 'Payment Method'}</h4>
            ${b.account_name ? `<div class="detail-row"><span class="detail-label">Account Name</span><span class="detail-value">${b.account_name}</span></div>` : ''}
            ${b.account_number ? `<div class="detail-row"><span class="detail-label">${acLabel}</span><span class="detail-value">${b.account_number} <button class="copy-btn" onclick="copyToClipboard('${b.account_number}', this)"><i class="fas fa-copy"></i></button></span></div>` : ''}
            ${b.branch ? `<div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${b.branch}</span></div>` : ''}
          </div>
        `;
      }).join('');

      document.getElementById('bankDetailsContainer').innerHTML = bankHtml;
    }

    // Set WhatsApp link (REAL Support Number extracted from legacy files)
    const wMsg = encodeURIComponent(`Hello! I want to purchase ${pkg.name || 'VIP'} using Promo Code: ${promoCode.toUpperCase()}.\n\nHere is my payment receipt:`);
    document.getElementById('whatsappLink').href = `https://wa.me/94729190799?text=${wMsg}`;

    loadingState.style.display = 'none';
    paymentContent.style.display = 'block';
    paymentContent.style.animation = 'fadeUp 0.6s var(--ease) forwards';

  } catch (e) {
    console.error('Payment page error:', e);
    showPaymentError(e.message || 'Failed to load payment details. Please check your internet connection and try again.');
  }
});

// Copy to clipboard with visual feedback
window.copyToClipboard = function(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check" style="color:var(--green)"></i>';
    btn.style.color = 'var(--green)';
    setTimeout(() => {
      btn.innerHTML = originalIcon;
      btn.style.color = '';
    }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check" style="color:var(--green)"></i>';
    setTimeout(() => { btn.innerHTML = originalIcon; }, 2000);
  });
};
