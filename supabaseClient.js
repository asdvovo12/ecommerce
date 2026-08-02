// supabaseClient.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// ===== 🔍 تشخيص مؤقت — امسح البلوك ده بعد ما نحل المشكلة =====
console.log('🔍 URL      =', JSON.stringify(SUPABASE_URL));
console.log('🔍 URL type =', typeof SUPABASE_URL);
console.log('🔍 KEY len  =', SUPABASE_ANON_KEY ? String(SUPABASE_ANON_KEY).length : 'MISSING');

(async () => {
  // 1) هل الجهاز نفسه عنده إنترنت؟
  try {
    const r = await fetch('https://www.google.com/generate_204');
    console.log('✅ الإنترنت شغال. status =', r.status);
  } catch (e) {
    console.log('❌ الجهاز نفسه مفيش عنده إنترنت:', e.message);
    return;
  }

  // 2) هل Supabase قابلة للوصول؟
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    console.log('✅ Supabase وصلت. status =', r.status);
  } catch (e) {
    console.log('❌ Supabase مش قابلة للوصول:', e.message);
  }
})();
// ===== نهاية التشخيص =====

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});