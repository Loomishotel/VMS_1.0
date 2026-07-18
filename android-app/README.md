# VMS Android Application Wrapper

This folder contains the Android wrapper for the Visitor Management System (VMS) application, configured using **Capacitor**. 

By keeping this wrapper in a separate folder (`android-app`) and referencing the built assets of the web dashboard, the **original web application codebase remains completely untouched**. 

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **Node.js** (v18+) & **npm**
2. **Android Studio** (with Android SDK & Command Line Tools)
3. A configured Android Virtual Device (AVD) emulator or a physical Android device with developer mode enabled.

---

## 📂 Architecture

- **`capacitor.config.json`**: Configures Capacitor to read the compiled web assets from `../apps/dashboard-ui/dist` rather than inside the web app itself.
- **`android/`**: The native Android Studio project wrapper. It is checked into Git, but all temporary build assets, local SDK configurations (`local.properties`), and copied web files are automatically gitignored.

---

## 🚀 Commands & Scripts

Run these commands from the root directory or within the `android-app` folder:

| Command | Location | Description |
|---------|----------|-------------|
| `npm run android:sync` | `android-app/` | Builds the frontend web app and syncs the static files to the Android native directory. |
| `npm run android:open` | `android-app/` | Builds the web app, syncs files, and opens the native project in **Android Studio**. |
| `npm run build:web` | `android-app/` | Triggers a production build of the `dashboard-ui` app. |
| `npm run cap:sync` | `android-app/` | Syncs the existing built assets and plugins from `apps/dashboard-ui/dist` into Android. |
| `npm run cap:open` | `android-app/` | Opens the Android project in **Android Studio** directly. |

---

## 📱 How to Run and Build the Android App

### Step 1: Initial Synchronisation
Run this command from the root of the workspace to make sure all packages are linked and the web assets are synced:
```bash
# Build the web app and sync it to the android project
npm run android:sync --workspace=vms-android
```

### Step 2: Open in Android Studio
To compile, run, and debug the native Android application:
```bash
# Open Android Studio with the android-app project
npm run android:open --workspace=vms-android
```
*Alternatively, you can open Android Studio and choose the `android-app/android` folder manually.*

### Step 3: Run on Emulator/Device
1. In Android Studio, wait for the Gradle sync to finish.
2. Select your target device (Emulator or connected physical device).
3. Click the **Run** button (green play icon) or press `Shift + F10` to build and run the app.

---

## 🔒 Security & API Server Configuration

The Android application is configured with `androidScheme: "https"`. 
- By default, all HTTP requests to your API Server (e.g. Supabase, Backend API) will run over HTTPS.
- Ensure that the `.env` configuration in the web dashboard points to the correct production or development backend endpoint that has HTTPS enabled.
