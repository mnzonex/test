// ═══════════════════════════════════════════════════════════
// ADMIN DASHBOARD — SUPABASE CONFIGURATION
// Add your Supabase URL and Anon Key here
// ═══════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://lejavosqltjokxginkcf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlamF2b3NxbHRqb2t4Z2lua2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDExNDksImV4cCI6MjA5MDM3NzE0OX0.xjJXWJfgtkG_njsaDUIaW2vM4o7p9-2ME9ljf4F-MbA';

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

async function updatePackageLinks(packageId, links) {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  const { error } = await supabaseClient
    .from('packages')
    .update({ links })
    .eq('id', packageId);
  if (error) throw error;
}

async function getAllPromoCodes() {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  const { data, error } = await supabaseClient
    .from('promo_codes')
    .select('*, bank_details(*)')
    .order('usage_count', { ascending: false });
  if (error) throw error;
  return data;
}

async function savePromoCodeToDB(promoData, bankDetailsArray) {
  if (!supabaseClient) throw new Error("Supabase is not configured.");
  let promoId;
  
  if (promoData.id) {
    const { data, error } = await supabaseClient
      .from('promo_codes')
      .update({ code: promoData.code.trim().toUpperCase(), is_default: promoData.is_default })
      .eq('id', promoData.id)
      .select().single();
    if (error) throw error;
    promoId = data.id;
    await supabaseClient.from('bank_details').delete().eq('promo_code_id', promoId);
  } else {
    if (promoData.is_default) {
      await supabaseClient.from('promo_codes').update({ is_default: false }).eq('is_default', true);
    }
    const { data, error } = await supabaseClient
      .from('promo_codes')
      .insert([{ code: promoData.code.trim().toUpperCase(), is_default: promoData.is_default }])
      .select().single();
    if (error) throw error;
    promoId = data.id;
  }

  if (bankDetailsArray.length > 0) {
    const bankRows = bankDetailsArray.map(b => ({ ...b, promo_code_id: promoId }));
    const { error: bankErr } = await supabaseClient.from('bank_details').insert(bankRows);
    if (bankErr) throw bankErr;
  }
  return promoId;
}

// Global API
window.db = {
  getPromoCodeDetails,
  getDefaultPromoCode,
  getPackageDetails,
  getAllPackages,
  updatePackageLinks,
  getAllPromoCodes,
  savePromoCodeToDB
};
