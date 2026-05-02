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
