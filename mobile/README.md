# MacroChef Flutter Android App

Flutter MVP client for MacroChef.

## Configure API URL

Pass the deployed Render API URL at build/run time:

```bash
flutter run --dart-define=API_BASE_URL=https://your-render-service.onrender.com
```

## Debug Build

```bash
cd mobile
source ../scripts/flutter-env.sh
flutter clean
flutter pub get
flutter run --dart-define=API_BASE_URL=https://your-render-service.onrender.com
```

## Website Build

From the repo root:

```bash
API_BASE_URL=https://your-render-service.onrender.com npm run web:build
npm run web:serve
```

Deploy `mobile/build/web` as a static website. On Render, the root `render.yaml` includes a `macrochef-web` static site; set `API_BASE_URL` for that service to your deployed MacroChef API URL.

For local website dev from the repo root, run:

```bash
npm run dev
```

That starts the backend if needed and serves the built Flutter website at `http://127.0.0.1:5103`. Use `FORCE_WEB_BUILD=true npm run dev` when you want it to rebuild the Flutter web output first.

## Release Signing

Generate an upload keystore:

```bash
cd mobile/android
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
cp key.properties.example key.properties
```

Edit `android/key.properties` locally with your keystore passwords. Do not commit it.

## Signed AAB

```bash
cd mobile
source ../scripts/flutter-env.sh
flutter clean
flutter pub get
flutter build appbundle --release --dart-define=API_BASE_URL=https://your-render-service.onrender.com
```

The AAB will be generated under `build/app/outputs/bundle/release/`.

## Google Play Internal/Closed Testing Checklist

- Create app in Play Console.
- Upload the signed AAB.
- Fill app access and app content sections.
- Add a privacy policy URL.
- Complete the Data safety form for account info, profile info, friend relationships, and food/calorie data.
- Set up internal or closed testing track.
- Add testers.
- Submit for review.

Production release may require closed testing first depending on the developer account type.
