// notifications.js

document.addEventListener('DOMContentLoaded', async () => {

  // Append Sidebar if not exists
  if (!document.getElementById('notifSidebar')) {
    const sidebarHtml = `
      <div id="notifSidebar" class="notif-sidebar">
        <div class="notif-header">
          <h3><i class="fas fa-bell"></i> Latest Signals</h3>
          <button id="closeNotifBtn" class="close-notif"><i class="fas fa-times"></i></button>
        </div>
        <div class="notif-body" id="notifList">
          <p style="text-align:center; color:var(--tx3); margin-top:20px;">Loading signals...</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', sidebarHtml);
  }

  const bellBtn = document.getElementById('bellBtn');
  const sidebar = document.getElementById('notifSidebar');
  const closeBtn = document.getElementById('closeNotifBtn');
  const notifList = document.getElementById('notifList');
  const badge = document.getElementById('bellBadge');

  if (bellBtn) {
    bellBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      badge.style.display = 'none'; // Clear notification count on open
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
  }

  // Load Signals
  async function loadSignals() {
    try {
      const signals = await window.db.getSignals();
      renderSignals(signals);
    } catch (e) {
      console.error('Error loading signals:', e);
      notifList.innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load signals</p>`;
    }
  }

  function formatTime(isoString) {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  function renderSignals(signals) {
    if (!signals || signals.length === 0) {
      notifList.innerHTML = `<p style="text-align:center; color:var(--tx3); margin-top:20px;">No new notifications</p>`;
      return;
    }

    notifList.innerHTML = signals.map(s => {
      if (s.type === 'notification') {
        return `
          <div class="notif-card">
            <div class="notif-time">
              <span>System Notification</span>
              <span>${formatTime(s.created_at)}</span>
            </div>
            <div class="notif-msg" style="background:var(--primary-alpha); color:white; font-size:1rem;">
               <i class="fas fa-info-circle" style="color:var(--or);"></i> ${s.message}
            </div>
          </div>
        `;
      } else {
        // Trade Signal
        const isLong = s.direction?.toLowerCase() === 'long';
        const dirClass = isLong ? 'dir-long' : 'dir-short';
        const sideClass = isLong ? 'is-long' : 'is-short';
        
        return `
          <div class="notif-card ${sideClass}">
            <div class="notif-time">
              <span class="notif-market">${s.market}</span>
              <span>${formatTime(s.created_at)}</span>
            </div>
            <div class="notif-title">
              ${s.pair} <span class="dir-badge ${dirClass}">${s.direction}</span> ${s.leverage ? `<span style="font-size:0.75rem; color:var(--tx2)">${s.leverage}</span>` : ''}
            </div>
            <div class="notif-stats">
              <div class="n-stat"><span class="n-label">Entry</span><span class="n-val">${s.entry || '-'}</span></div>
              <div class="n-stat"><span class="n-label">Take Profit</span><span class="n-val val-green">${s.tp || '-'}</span></div>
              <div class="n-stat" style="grid-column: 1 / -1;"><span class="n-label">Stop Loss</span><span class="n-val val-red">${s.sl || '-'}</span></div>
            </div>
            ${s.message ? `<div class="notif-msg">${s.message}</div>` : ''}
          </div>
        `;
      }
    }).join('');
  }

  // Initial Load
  await loadSignals();

  // Listen for realtime updates
  window.db.subscribeToSignals(async (payload) => {
    // Re-fetch everything and update badge
    await loadSignals();
    if (!sidebar.classList.contains('open')) {
      badge.style.display = 'block';
      let c = parseInt(badge.innerText || '0');
      badge.innerText = c + 1;
    }
  });
});
