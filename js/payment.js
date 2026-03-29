// payment.js

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const packageId = urlParams.get('package');
  const promoCode = urlParams.get('promo');

  if (!packageId || !promoCode) {
    window.location.href = 'plans.html';
    return;
  }

  try {
    const pkg = await window.db.getPackageDetails(packageId);
    const promo = await window.db.getPromoCodeDetails(promoCode);

    if (!pkg) throw new Error('Package not found');
    if (!promo) throw new Error('Invalid Promo Code');

    document.getElementById('pkgName').innerText = pkg.name;
    document.getElementById('promoCodeDisplay').innerText = promoCode.toUpperCase();

    const bankHtml = (promo.bank_details || []).map(b => `
      <div class="bank-card fadeUp">
        <h4><i class="fas fa-university"></i> ${b.bank_name || 'Bank'}</h4>
        ${b.account_name ? `<div class="detail-row"><span class="detail-label">Account Name</span><span class="detail-value">${b.account_name}</span></div>` : ''}
        ${b.account_number ? `<div class="detail-row"><span class="detail-label">Account No / ID</span><span class="detail-value">${b.account_number} <button class="copy-btn" onclick="navigator.clipboard.writeText('${b.account_number}')"><i class="fas fa-copy"></i></button></span></div>` : ''}
        ${b.branch ? `<div class="detail-row"><span class="detail-label">Branch</span><span class="detail-value">${b.branch}</span></div>` : ''}
      </div>
    `).join('');

    document.getElementById('bankDetailsContainer').innerHTML = bankHtml || '<p style="color:var(--tx2)">No payment details available for this promo code. Please contact support.</p>';

    // Set WhatsApp link
    const wMsg = encodeURIComponent(`Hello! I want to purchase ${pkg.name} using Promo Code: ${promoCode.toUpperCase()}.\n\nHere is my payment receipt:`);
    document.getElementById('whatsappLink').href = `https://wa.me/94760000000?text=${wMsg}`;

    document.getElementById('loadingState').style.display = 'none';
    const content = document.getElementById('paymentContent');
    content.style.display = 'block';
    
    // Add fade up animation
    content.style.animation = 'fadeUp 0.6s var(--ease) forwards';
  } catch (e) {
    console.error(e);
    document.getElementById('loadingState').innerHTML = `
      <div style="text-align:center;">
        <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:var(--or); margin-bottom:15px;"></i>
        <p style="color:var(--tx2); margin-bottom: 25px;">${e.message || 'Error loading payment details.'}</p>
        <a href="plans.html" class="btn btn-ghost">Return to Plans</a>
      </div>
    `;
  }
});
