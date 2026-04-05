# MacroChef

`index.html` remains in the repo as the original website reference.

The Android app now lives in `android-app/` as a native Jetpack Compose project with bundled sample data. It no longer depends on loading the website in a `WebView`.

## Android app

1. Open `android-app/` in Android Studio.
2. Let Gradle sync and install any missing Android SDK components.
3. Run the `app` configuration on an emulator or Android device.

## Notes

- The Android app is self-contained and does not require the HTML file or network access at runtime.
- The app recreates the existing product flow in Compose: discover, detail, feed, upload, localiser, shopping, and ordering.
- `gradle-wrapper.properties` is included for Android Studio sync, but I could not generate the wrapper scripts and jar here because `gradle` and `java` are not installed locally in this environment.
