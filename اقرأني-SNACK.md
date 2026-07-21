# تشغيل التطبيق على Expo Snack (من غير terminal ولا VS Code)

جهازك ضعيف ومفيش terminal في Snack؟ تمام. ده اللي تعمله بالظبط.

## الخلاصة أول حاجة
- التطبيق نفسه (الواجهة + تسجيل الدخول + المنتجات + الكارت) **يشتغل على Snack** بعد التعديل اللي عملته.
- الدفع (Stripe / PayPal) **مش هيشتغل على Snack** لأنه محتاج سيرفر (server.js) شغال، و Snack مفيهوش سيرفر ولا terminal.

## ليه المفاتيح كانت بتضيع؟
ملف `.env` **Snack بيتجاهله تماماً**. فكل المفاتيح كانت بتطلع فاضية → Supabase والدخول والدفع بيبوظوا.
أنا حليتها: حطيت المفاتيح **العامة (Public) بس** جوه `config.js` مباشرة، فالتطبيق دلوقتي بيلاقيها من غير `.env`.

## أنواع المفاتيح (مهم تفهمها)
| المفتاح | فين مكانه الصح | آمن في التطبيق؟ |
|---|---|---|
| Supabase URL + anon key | داخل التطبيق (config.js) | ✅ آمن |
| Stripe **Publishable** key (pk_...) | داخل التطبيق (config.js) | ✅ آمن |
| EmailJS service/template/public id | داخل التطبيق (config.js) | ✅ آمن |
| Stripe **Secret** key (sk_...) | على السيرفر بس (server.js) | ❌ ممنوع في التطبيق |
| PayPal Client Secret | على السيرفر بس (server.js) | ❌ ممنوع في التطبيق |

القاعدة: أي مفتاح فيه كلمة **secret** يفضل على السيرفر لوحده، عمرك ما تحطه في كود التطبيق.

## خطوات التشغيل على Snack
1. افتح https://snack.expo.dev
2. من القايمة: **Import** → **Import from Git / Upload** وارفع الـ zip ده، أو اسحب الملفات جوه المشروع.
3. استنى لحد ما Snack ينزل الـ packages لوحده (مش محتاج terminal).
4. من على اليمين اختار **My Device** (وافتح تطبيق Expo Go على موبايلك وامسح الكود) أو **Android/iOS** أو **Web**.
5. هيفتح معاك: السبلاش → تسجيل الدخول → المنتجات → الكارت. كله شغال.

> ملاحظة: `@stripe/stripe-react-native` و `expo-camera` (سكانر الكارت) محتاجين كود native، فدول ممكن ما يشتغلوش على Snack. عشان تجربهم لازم **Development Build** (EAS) أو تشغّل على جهاز حقيقي ببناء كامل.

## لو عايز الدفع يشتغل فعلاً (بدون جهازك)
محتاج ترفع `server.js` على استضافة مجانية عندها terminal في السحابة:
- **Render.com** أو **Railway.app** أو **Replit** (كلهم مجاني للتجربة).
- ارفع ملفات المشروع، وفي إعدادات الموقع حط الـ Environment Variables:
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`
  - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
  - `RETURN_URL`, `CANCEL_URL`, `PORT`
- أمر التشغيل: `node server.js`
- هياخد لينك زي `https://your-app.onrender.com` — حطه في `config.js` مكان `API_BASE_URL` بدل `http://localhost:3000`.

كده التطبيق على Snack هيكلم السيرفر السحابي والدفع يشتغل، والمفاتيح السرية تفضل آمنة على السيرفر.

## تحذير أمان مهم
المفاتيح اللي كانت متكتوبة في المشروع (Supabase / Stripe / PayPal / EmailJS) اتسربت في الكود قبل كده.
قبل ما تبيع لأي حد بجد: **غيّر (rotate) المفاتيح دي كلها** من لوحات التحكم بتاعتها واعتبرها مكشوفة.
