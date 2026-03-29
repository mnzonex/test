// ═══════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION
// Add your Supabase URL and Anon Key here
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://bonpneqrztuwljzdwttv.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

let supabaseClient = null;

try {
  if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn('Supabase URL/Key not configured. Using mock data for demonstration.');
  }
} catch (e) {
  console.error("Supabase init error:", e);
}

// MOCK DATA FOR DEMONSTRATION IF SUPABASE NOT CONNECTED
const MOCK_DB = {
  promo_codes: [
    { id: 1, code: 'DEFAULT50', is_default: true, usage_count: 120 },
    { id: 2, code: 'VIP100', is_default: false, usage_count: 45 }
  ],
  bank_details: [
    { id: 1, promo_code_id: 1, bank_name: 'Commercial Bank', account_name: 'Killers Group', account_number: '1234567890', branch: 'Colombo' },
    { id: 2, promo_code_id: 1, bank_name: 'Binance', account_name: 'Killers Crypto', account_number: '12345678', branch: 'Pay ID' },
    { id: 3, promo_code_id: 2, bank_name: 'BOC', account_name: 'Killers VIP', account_number: '0987654321', branch: 'Kandy' }
  ],
  packages: [
    { id: 'crypto', name: 'Crypto VIP', price: 40, links: ['https://t.me/crypto1', 'https://t.me/crypto2'] },
    { id: 'forex', name: 'Forex VIP', price: 40, links: ['https://t.me/forex1'] },
    { id: 'all', name: 'All-in-One VIP', price: 60, links: ['https://t.me/all1'] },
    { id: 'free', name: 'Free Signals', price: 0, links: ['https://chat.whatsapp.com/free_link'] }
  ],
  signals: JSON.parse(localStorage.getItem('mockSignals') || '[]')
};

// If mock changes, sync to localStorage to mimic real-time
function saveMockSignals() {
  localStorage.setItem('mockSignals', JSON.stringify(MOCK_DB.signals));
  // Dispatch a storage event manually for same-window updates
  window.dispatchEvent(new Event('storage'));
}

async function getPromoCodeDetails(code) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('promo_codes')
      .select('*, bank_details(*)')
      .eq('code', code)
      .single();
      
    if (error) throw error;
    return data;
  } else {
    // Mock logic
    const promo = MOCK_DB.promo_codes.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (!promo) return null;
    promo.bank_details = MOCK_DB.bank_details.filter(b => b.promo_code_id === promo.id);
    return promo;
  }
}

async function getDefaultPromoCode() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('promo_codes')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .single();
      
    if (error) throw error;
    return data;
  } else {
    return MOCK_DB.promo_codes.find(p => p.is_default);
  }
}

async function getPackageDetails(packageId) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single();
    if (error) throw error;
    return data;
  } else {
    return MOCK_DB.packages.find(p => p.id === packageId) || null;
  }
}

async function getSignals() {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('signals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } else {
    return MOCK_DB.signals.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

async function createSignal(signalData) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('signals')
      .insert([signalData]);
    if (error) throw error;
    return data;
  } else {
    const sig = { id: Date.now(), ...signalData };
    if(!sig.created_at) sig.created_at = new Date().toISOString();
    MOCK_DB.signals.push(sig);
    saveMockSignals();
    return sig;
  }
}

async function deleteSignal(id) {
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('signals')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  } else {
    MOCK_DB.signals = MOCK_DB.signals.filter(s => s.id !== id);
    saveMockSignals();
    return true;
  }
}

function subscribeToSignals(callback) {
  if (supabaseClient) {
    const channel = supabaseClient.channel('public:signals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, payload => {
        callback(payload);
      })
      .subscribe();
    return () => supabaseClient.removeChannel(channel);
  } else {
    const listener = (e) => {
      // either native storage event or custom event
      if(e.type === 'storage' && (!e.key || e.key === 'mockSignals')) {
        MOCK_DB.signals = JSON.parse(localStorage.getItem('mockSignals') || '[]');
        callback({ eventType: 'SYNC' });
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }
}

// Attach to window
window.db = {
  getPromoCodeDetails,
  getDefaultPromoCode,
  getPackageDetails,
  getSignals,
  createSignal,
  deleteSignal,
  subscribeToSignals
};
