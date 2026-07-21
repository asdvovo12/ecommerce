# بناء التطبيق (ملف يترفع على المتاجر) — من غير جهاز قوي

البناء بيحصل **في السحابة** عن طريق EAS Build. جهازك مالوش دعوة.

## المطلوب مرة واحدة
1. اعمل حساب مجاني على https://expo.dev
2. تحتاج جهاز أو لاب توب بسيط عليه Node.js (أي جهاز، حتى الضعيف، لأن البناء نفسه على سيرفرات Expo).
   - لو مفيش جهاز خالص: استخدم **GitHub Codespaces** أو **Gitpod** (بيئة أون لاين مجانية فيها terminal).

## خطوات البناء
```bash
# 1) ثبّت أدوات Expo
npm install -g eas-cli

# 2) جوّا فولدر المشروع
npm install
eas login          # بالحساب بتاع expo.dev
eas init           # بيربط المشروع ويحط projectId تلقائياً

# 3) نسخة تجريبية للموبايل (APK يتثبّت مباشرة وتجرّب عليه Stripe والكاميرا)
eas build --profile preview --platform android

# 4) نسخة الإنتاج للمتاجر
eas build --profile production --platform android   # ملف .aab لـ Google Play
eas build --profile production --platform ios       # ملف .ipa لـ App Store (يحتاج حساب Apple)
```

لمّا البناء يخلص، EAS بيديك **لينك تحمّل منه الملف** (.apk / .aab / .ipa).

## رفع على المتاجر
```bash
eas submit --profile production --platform android   # Google Play
eas submit --profile production --platform ios       # App Store
```

## مهم قبل بناء الإنتاج
- غيّر `com.ecommerce.app` في `app.json` لاسم حزمة خاص بيك/بالعميل (مثلاً `com.clientname.shop`).
- تأكد إن `API_BASE_URL` في `config.js` بيشاور على السيرفر المستضاف (مش localhost).
- حوّل مفاتيح Stripe/PayPal لـ live.
