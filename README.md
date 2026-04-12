# MacroChef

`index.html` remains in the repo as the original website reference.

The Android app now lives in `android-app/` as a native Jetpack Compose project with bundled sample data. It no longer depends on loading the website in a `WebView`.

## Run locally

### Prerequisites

- Android Studio with the Android SDK installed
- Java 17+ available to Gradle, or use the JBR bundled with Android Studio
- An emulator or physical Android device

### Android Studio

1. Open [android-app](/home/vedantt_21/crucible/macro-chef/android-app) as the project root.
2. Let Gradle sync finish.
3. Make sure the run configuration is `app`, not `app.main`.
4. If Android Studio cannot find your SDK, create `android-app/local.properties` with:

```properties
sdk.dir=/path/to/Android/Sdk
```

5. Choose an emulator or connected device.
6. Press Run.

### Command line build

From the repo root:

```bash
cd android-app
./gradlew assembleDebug
```

The generated APK will be:

```text
app/build/outputs/apk/debug/app-debug.apk
```

### Install on a device

If `adb` can see your device:

```bash
cd android-app
./gradlew installDebug
```

Or install the APK manually:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.macrochef.app/.MainActivity
```

### Wireless device setup

For a real phone without a data cable:

1. Enable `Developer options`.
2. Enable `Wireless debugging`.
3. Pair the phone from Android Studio `Device Manager > Pair Devices Using Wi-Fi`, or use `adb pair`.
4. Confirm the device appears in `adb devices`.

## Notes

- The Android app is self-contained and does not require the HTML file or network access at runtime.
- The app recreates the existing product flow in Compose: discover, detail, feed, upload, localiser, shopping, and ordering.
- Open `android-app/`, not the repo root, in Android Studio.
