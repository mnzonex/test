// notifications.js — Real-time signal notifications sidebar

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
      if (badge) badge.style.display = 'none';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
  }

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Check if db is available
  if (!window.db) {
    notifList.innerHTML = `
      <div style="text-align:center; padding:30px;">
        <i class="fas fa-database" style="font-size:2rem; color:var(--tx3); margin-bottom:15px; display:block;"></i>
        <p style="color:var(--tx3);">Database not connected</p>
        <p style="color:var(--tx3); font-size:0.8rem; margin-top:5px;">Configure Supabase to enable signals</p>
      </div>
    `;
    return;
  }

  // Load Signals
  async function loadSignals() {
    try {
      const signals = await window.db.getSignals();
      renderSignals(signals);
    } catch (e) {
      console.error('Error loading signals:', e);
      notifList.innerHTML = `
        <div style="text-align:center; padding:30px;">
          <i class="fas fa-exclamation-triangle" style="font-size:1.5rem; color:#ef4444; margin-bottom:12px; display:block;"></i>
          <p style="color:var(--tx2); font-size:0.9rem;">Failed to load signals</p>
          <p style="color:var(--tx3); font-size:0.8rem; margin-top:5px;">Please check your connection and try again</p>
          <button onclick="location.reload()" style="margin-top:15px; background:var(--soft); border:1px solid var(--bd); color:var(--or); padding:8px 16px; border-radius:8px; cursor:pointer; font-family:inherit; font-size:0.85rem;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }

  function formatTime(isoString) {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Unknown';
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Unknown';
    }
  }

  function renderSignals(signals) {
    if (!signals || signals.length === 0) {
      notifList.innerHTML = `
        <div style="text-align:center; padding:30px;">
          <i class="fas fa-bell-slash" style="font-size:1.5rem; color:var(--tx3); margin-bottom:12px; display:block;"></i>
          <p style="color:var(--tx3);">No signals yet</p>
          <p style="color:var(--tx3); font-size:0.8rem; margin-top:5px;">New signals will appear here in real-time</p>
        </div>
      `;
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
            <div class="notif-msg" style="background:var(--primary-alpha, rgba(247,147,26,0.1)); color:white; font-size:1rem;">
               <i class="fas fa-info-circle" style="color:var(--or);"></i> ${s.message || 'No message'}
            </div>
          </div>
        `;
      } else {
        // Trade Signal
        const isLong = (s.direction || '').toLowerCase() === 'long';
        const dirClass = isLong ? 'dir-long' : 'dir-short';
        const sideClass = isLong ? 'is-long' : 'is-short';

        return `
          <div class="notif-card ${sideClass}">
            <div class="notif-time">
              <span class="notif-market">${s.market || 'SIGNAL'}</span>
              <span>${formatTime(s.created_at)}</span>
            </div>
            <div class="notif-title">
              ${s.pair || '-'} <span class="dir-badge ${dirClass}">${s.direction || '-'}</span> ${s.leverage ? `<span style="font-size:0.75rem; color:var(--tx2)">${s.leverage}</span>` : ''}
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
  try {
    window.db.subscribeToSignals(async (payload) => {
      // Re-fetch everything and update badge
      await loadSignals();
      if (sidebar && !sidebar.classList.contains('open')) {
        if (badge) {
          badge.style.display = 'block';
          let c = parseInt(badge.innerText || '0');
          badge.innerText = c + 1;
        }
      }
    });
  } catch (e) {
    console.error('Error subscribing to signals:', e);
  }
});
