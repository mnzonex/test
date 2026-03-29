// ═══════════════════════════════════════════════════════════
// SUPABASE CONFIGURATION — KILLERS VIP (Public Website)
// Add your Supabase URL and Anon Key here
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://lejavosqltjokxginkcf.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

let supabaseClient = null;

try {
  if (SUPABASE_URL !== 'https://lejavosqltjokxginkcf.supabase.co' && typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) { console.error("Supabase init error:", e); }

// ═══════════════════════════════════════════════════════════
// DATABASE FUNCTIONS
// ═══════════════════════════════════════════════════════════

async function getPromoCodeDetails(code) {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  const { data, error } = await supabaseClient
    .from('promo_codes')
    .select('*, bank_details(*)')
    .eq('code', code.trim().toUpperCase())
    .single();
  if (error) return null;
  return data;
}

async function getDefaultPromoCode() {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  const { data, error } = await supabaseClient
    .from('promo_codes')
    .select('*, bank_details(*)')
    .eq('is_default', true)
    .maybeSingle();
  return data;
}

async function getPackageDetails(packageId) {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  const { data, error } = await supabaseClient
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .single();
  if (error) throw error;
  return data;
}

async function getAllPackages() {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  const { data, error } = await supabaseClient
    .from('packages')
    .select('*')
    .order('price', { ascending: true });
  if (error) throw error;
  return data;
}

// Global API
window.db = {
  getPromoCodeDetails,
  getDefaultPromoCode,
  getPackageDetails,
  getAllPackages
};
