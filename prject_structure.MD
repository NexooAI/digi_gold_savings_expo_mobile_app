# Digi Gold Savings Expo Mobile App - Project Structure Diagram

## 🏗️ Project Overview
**Technology Stack:** React Native + Expo + TypeScript + NativeWind (Tailwind CSS) + Zustand State Management

**Architecture:** Multi-brand White-label Mobile Application for Gold Savings & Investment

---

## 📁 Root Directory Structure

```
digi_gold_savings_expo_mobile_app/
├── 📱 Mobile App Core
│   ├── 📄 app.config.js                 # Expo configuration
│   ├── 📄 app.plugin.js                 # Custom Expo plugins
│   ├── 📄 package.json                  # Dependencies & scripts
│   ├── 📄 metro.config.js               # Metro bundler config
│   ├── 📄 tailwind.config.js            # Tailwind CSS configuration
│   ├── 📄 tsconfig.json                 # TypeScript configuration
│   └── 📄 index.js                      # App entry point
│
├── 🤖 Platform Specific
│   ├── 📁 android/                      # Android native code
│   └── 📁 credentials/                  # Platform credentials
│       └── 📁 akilajewellers/
│           └── 📄 google-services.json
│
├── 🎨 Assets & Resources
│   └── 📁 assets/
│       ├── 📁 images/                   # Global brand images
│       ├── 📁 sound/                    # Audio files
│       └── 📄 splashscreen_logo.png
│
├── 🔧 Build & Configuration Scripts
│   ├── 📄 brand-asset-manager.js        # Brand asset management
│   ├── 📄 credentials-manager.js        # Credentials handling
│   ├── 📄 enhanced-brand-switcher.js    # Brand switching logic
│   ├── 📄 set-brand.js                  # Brand configuration
│   └── 📁 scripts/                      # Build scripts
│       ├── 📄 build-brand.js
│       ├── 📄 test-akila-brand.js
│       └── 📄 test-brand-config.js
│
└── 📚 Documentation
    ├── 📄 README.md
    ├── 📄 WHITELABEL_GUIDE.md
    ├── 📄 API_LOGGING_GUIDE.md
    └── 📄 FCM_TESTING_GUIDE.md
```

---

## 🏢 Multi-Brand Architecture

```
📁 src/brands/
├── 🏪 akilajewellers/                   # Akila Jewellers Brand
│   ├── 📁 assets/
│   │   ├── 📁 images/                   # Brand-specific images
│   │   └── 📄 splashscreen_logo.png
│   ├── 📁 config/
│   │   ├── 📄 app.config.js             # Brand app config
│   │   ├── 📄 assets.js                 # Asset mappings
│   │   ├── 📄 home-styles.json          # UI styling
│   │   └── 📄 theme.js                  # Brand theme
│   ├── 📁 locales/
│   │   ├── 📄 en.json                   # English translations
│   │   ├── 📄 mal.json                  # Malayalam translations
│   │   └── 📄 ta.json                   # Tamil translations
│   └── 📁 pages/
│       └── 📄 HomePage.tsx              # Brand-specific home page
│
├── 💎 dc-jewellers/                     # DC Jewellers Brand
│   ├── 📁 assets/
│   ├── 📁 config/
│   ├── 📁 locales/
│   └── 📁 pages/
│
├── 🧪 demo-jewellers/                   # Demo Brand
│   ├── 📁 assets/
│   ├── 📁 config/
│   ├── 📁 locales/
│   └── 📁 pages/
│
├── 🏛️ srimurugan/                       # Srimurugan Brand
│   ├── 📁 config/
│   └── 📁 pages/
│
└── 🏛️ srimurugangoldhouse/              # Srimurugan Gold House Brand
    ├── 📁 assets/
    ├── 📁 config/
    ├── 📁 locales/
    └── 📁 pages/
```

---

## 🎯 Core Application Structure

```
📁 src/
├── 🧭 Navigation & Routing
│   ├── 📁 app/                          # Expo Router pages
│   │   ├── 📄 _layout.tsx               # Root layout
│   │   ├── 📄 index.tsx                 # Entry point
│   │   ├── 📄 intro.tsx                 # Onboarding
│   │   ├── 📄 login.tsx                 # Login screen
│   │   ├── 📁 (auth)/                   # Authentication flow
│   │   │   ├── 📄 _layout.tsx
│   │   │   ├── 📄 AuthScreen.tsx
│   │   │   ├── 📄 login.tsx
│   │   │   ├── 📄 register.tsx
│   │   │   ├── 📄 mpin.tsx
│   │   │   ├── 📄 mpin_verify.tsx
│   │   │   └── 📁 register/
│   │   │       └── 📄 complete.tsx
│   │   └── 📁 (app)/                    # Main app screens
│   │       ├── 📄 _layout.tsx
│   │       ├── 📁 (tabs)/               # Tab navigation
│   │       │   ├── 📄 _layout.tsx
│   │       │   ├── 📄 home/             # Home tab
│   │       │   │   ├── 📄 index.tsx
│   │       │   │   ├── 📄 live-rates.tsx
│   │       │   │   ├── 📄 schemes.tsx
│   │       │   │   ├── 📄 offers.tsx
│   │       │   │   ├── 📄 faq.tsx
│   │       │   │   ├── 📄 kyc.tsx
│   │       │   │   ├── 📄 our_stores.tsx
│   │       │   │   ├── 📄 refer_earn.tsx
│   │       │   │   ├── 📄 join_savings.tsx
│   │       │   │   ├── 📄 productsdetails.tsx
│   │       │   │   ├── 📄 payment-success.tsx
│   │       │   │   ├── 📄 payment-failure.tsx
│   │       │   │   └── 📁 (storeInfo)/
│   │       │   │       ├── 📄 about_us.tsx
│   │       │   │       └── 📄 contact_us.tsx
│   │       │   ├── 📄 gold_advance.tsx
│   │       │   ├── 📄 joinadvancegold.tsx
│   │       │   ├── 📄 notifications.tsx
│   │       │   ├── 📄 profile.tsx
│   │       │   └── 📁 savings/          # Savings module
│   │       │       ├── 📄 index.tsx
│   │       │       └── 📄 SavingsDetail.tsx
│   │       └── 📁 components/           # Screen-specific components
│   │           ├── 📄 Alert.tsx
│   │           ├── 📄 AppHeader.tsx
│   │           ├── 📄 EnhancedLoader.tsx
│   │           ├── 📄 FlashBanner.tsx
│   │           ├── 📄 FlashNews.tsx
│   │           ├── 📄 FlashOffer.tsx
│   │           ├── 📄 ImageSlider.tsx
│   │           ├── 📄 LiveRateCard.tsx
│   │           ├── 📄 MapScreen.tsx
│   │           ├── 📄 MpinInput.tsx
│   │           ├── 📄 PhoneInputs.tsx
│   │           ├── 📄 Products.tsx
│   │           ├── 📄 SchemeCard.tsx
│   │           ├── 📄 SocialMediaCard.tsx
│   │           ├── 📄 StaticSchemesHorizontalScroll.tsx
│   │           ├── 📄 StatusView.tsx
│   │           ├── 📄 SupportContactCard.tsx
│   │           ├── 📄 VideoPlayer.tsx
│   │           └── 📄 YouTubeVideo.tsx
│   │
│   ├── 📁 common/components/navigation/ # Navigation components
│   │   ├── 📄 CustomBottomBar.tsx
│   │   ├── 📄 DrawerContent.tsx
│   │   ├── 📄 TabBarIcon.tsx
│   │   └── 📄 TabNavigator.tsx
│   └── 📄 config/navigation.ts          # Navigation configuration
│
├── 🎨 UI Components & Layout
│   ├── 📁 components/                   # Shared UI components
│   │   ├── 📄 AppLayoutWrapper.tsx
│   │   ├── 📄 AuthGuard.tsx
│   │   ├── 📄 BaseHomePage.tsx
│   │   ├── 📄 BrandedHomePage.tsx
│   │   ├── 📄 DrawerContentLayout.tsx
│   │   ├── 📄 FloatingHomeButton.tsx
│   │   └── 📄 KeyboardAwareWrapper.tsx
│   ├── 📁 shared/components/
│   │   ├── 📄 BrandedHeader.tsx
│   │   └── 📄 BrandTest.tsx
│   └── 📁 _styles/
│       └── 📄 registerStyles.ts
│
├── 🔧 Core Configuration
│   ├── 📁 core/config/
│   │   └── 📄 BrandConfig.js            # Brand configuration system
│   ├── 📁 constants/
│   │   ├── 📄 theme.config.js           # Theme configuration
│   │   └── 📄 theme.js                  # Global theme
│   └── 📁 config/
│       └── 📄 navigation.ts             # Navigation setup
│
├── 🌐 Internationalization
│   ├── 📄 i18n.ts                       # i18n configuration
│   ├── 📁 locales/                      # Global translations
│   │   ├── 📄 en.json                   # English
│   │   ├── 📄 mal.json                  # Malayalam
│   │   └── 📄 ta.json                   # Tamil
│   └── 📁 contexts/
│       ├── 📄 LanguageContext.tsx
│       ├── 📄 LanguageProvider.tsx
│       └── 📄 LanguageSwitcher.tsx
│
├── 🔄 State Management
│   ├── 📁 contexts/
│   │   └── 📄 AuthContext.tsx           # Authentication context
│   └── 📁 store/
│       ├── 📄 appState.ts               # App state management
│       └── 📄 global.store.ts           # Global Zustand store
│
├── 🌐 API & Services
│   ├── 📁 services/
│   │   ├── 📄 api.ts                    # Base API configuration
│   │   ├── 📄 apiWithLoader.ts          # API with loading states
│   │   ├── 📄 loadingServices.ts        # Loading service utilities
│   │   ├── 📄 notification.ts           # Notification service
│   │   ├── 📄 NotificationService.ts    # Enhanced notification service
│   │   └── 📄 payment.service.ts        # Payment processing
│   └── 📁 types/
│       └── 📄 payment.types.ts          # Payment type definitions
│
├── 🛠️ Utilities & Helpers
│   ├── 📁 utils/
│   │   ├── 📄 apiLogger.ts              # API logging utilities
│   │   ├── 📄 brandStyles.ts            # Brand styling utilities
│   │   ├── 📄 imageUtils.ts             # Image processing utilities
│   │   └── 📄 paymentUtils.ts           # Payment utility functions
│   └── 📁 hooks/                        # Custom React hooks
│       ├── 📄 useFirstLaunch.ts         # First launch detection
│       ├── 📄 useKeyboardVisibility.ts  # Keyboard visibility
│       ├── 📄 useNotificationBadge.ts   # Notification badge
│       ├── 📄 useOtpAutoFetch.ts        # OTP auto-fetch
│       ├── 📄 usePaymentSocket.ts       # Payment socket connection
│       └── 📄 useResponsiveLayout.ts    # Responsive layout
│
└── 📝 Type Definitions
    ├── 📁 @types/
    │   └── 📄 navigation.d.ts           # Navigation type definitions
    └── 📄 global.d.ts                   # Global type definitions
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Components     │───▶│   API Services  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  State Store    │◀───│  Context API    │◀───│  Backend APIs   │
│   (Zustand)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UI Updates     │    │  Navigation     │    │  Notifications  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🎨 Brand Customization System

```
┌─────────────────────────────────────────────────────────────┐
│                    Brand Configuration                      │
├─────────────────────────────────────────────────────────────┤
│  📁 brands/[brand-name]/                                    │
│  ├── 📄 config/theme.js          # Brand colors & styling   │
│  ├── 📄 config/assets.js         # Brand-specific assets    │
│  ├── 📄 config/home-styles.json  # UI component styles      │
│  ├── 📁 assets/images/           # Brand images & logos      │
│  ├── 📁 locales/                 # Brand translations       │
│  └── 📁 pages/HomePage.tsx       # Custom home page         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Dynamic Brand Loading                       │
├─────────────────────────────────────────────────────────────┤
│  • Brand switching at runtime                               │
│  • Asset replacement                                        │
│  • Theme application                                        │
│  • Translation loading                                      │
│  • Component customization                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Build & Deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Development    │───▶│   Staging       │───▶│   Production    │
│     (Local)     │    │   (Testing)     │    │   (Live)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘

📦 Build Scripts:
├── npm run build:dc-jewellers
├── npm run build:akilajewellers  
├── npm run build:srimurugangoldhouse
├── npm run start:dc-jewellers
├── npm run start:akilajewellers
└── npm run start:srimurugangoldhouse
```

---

## 🔧 Key Features & Modules

### 💰 Core Features
- **Gold Savings Management** - Track and manage gold investments
- **Live Gold Rates** - Real-time gold price updates
- **Payment Processing** - Secure payment gateway integration
- **KYC Management** - Customer verification system
- **Multi-language Support** - English, Malayalam, Tamil
- **Push Notifications** - Real-time updates and alerts

### 🏪 Brand Management
- **White-label Architecture** - Multiple brand support
- **Dynamic Asset Loading** - Brand-specific images and themes
- **Customizable UI** - Brand-specific styling and layouts
- **Independent Configurations** - Per-brand settings

### 🔐 Security & Authentication
- **MPIN System** - Secure mobile PIN authentication
- **JWT Tokens** - Secure API communication
- **Biometric Authentication** - Fingerprint/Face ID support
- **Secure Storage** - Encrypted local data storage

### 📱 User Experience
- **Responsive Design** - Mobile-first approach
- **Offline Support** - Basic offline functionality
- **Smooth Animations** - Enhanced user interactions
- **Accessibility** - WCAG compliance features

---

## 🛠️ Development Workflow

```
1. 🎯 Brand Selection
   ├── Choose target brand (akilajewellers, dc-jewellers, etc.)
   ├── Run brand-specific start script
   └── Load brand configuration

2. 🔧 Development
   ├── Edit shared components in src/components/
   ├── Modify brand-specific code in src/brands/[brand]/
   ├── Update translations in locales/
   └── Test on device/simulator

3. 🧪 Testing
   ├── Unit tests for utilities
   ├── Integration tests for API services
   ├── UI tests for components
   └── Brand-specific testing

4. 🚀 Deployment
   ├── Build brand-specific APK/IPA
   ├── Configure app store metadata
   ├── Deploy to app stores
   └── Monitor analytics and crashes
```

---

## 📊 Technology Stack Summary

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React Native + Expo | Cross-platform mobile development |
| **Language** | TypeScript | Type-safe JavaScript |
| **Styling** | NativeWind (Tailwind CSS) | Utility-first CSS framework |
| **State Management** | Zustand | Lightweight state management |
| **Navigation** | Expo Router | File-based routing |
| **HTTP Client** | Axios | API communication |
| **Local Storage** | AsyncStorage + SecureStore | Data persistence |
| **Maps** | React Native Maps | Location services |
| **Charts** | React Native Chart Kit | Data visualization |
| **Notifications** | Expo Notifications | Push notifications |
| **Internationalization** | i18n-js | Multi-language support |

---

*This diagram represents the comprehensive architecture of the Digi Gold Savings Expo Mobile App, showcasing its multi-brand white-label capabilities and modular design.*