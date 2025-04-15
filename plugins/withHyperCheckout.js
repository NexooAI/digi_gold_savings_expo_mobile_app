// Create a file called 'plugins/withHyperCheckout.js'

const fs = require('fs');
const path = require('path');
const { withProjectBuildGradle, withAppBuildGradle, withMainApplication } = require('@expo/config-plugins');

function withHyperCheckout(config) {
  // Step 1: Add the HDFC SDK dependency to app build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      
      // Add the dependency to the dependencies block
      if (!buildGradle.includes('com.hdfc:hypercheckout')) {
        const withDependency = buildGradle.replace(
          /dependencies\s*{/,
          `dependencies {
    // HDFC HyperCheckout SDK
    implementation 'com.hdfc:hypercheckout:x.y.z' // Replace with actual version`
        );
        config.modResults.contents = withDependency;
      }
    }
    return config;
  });

  // Step 2: Modify MainApplication.java to include your package
  config = withMainApplication(config, (config) => {
    const mainApplication = config.modResults.contents;
    
    // Add the import statement if it doesn't exist
    if (!mainApplication.includes('import com.yourapp.HyperCheckoutPackage;')) {
      const withImport = mainApplication.replace(
        /import com.facebook.react.ReactApplication;/,
        `import com.facebook.react.ReactApplication;
import com.yourapp.HyperCheckoutPackage;`
      );
      
      // Add the package to the getPackages method
      const withPackage = withImport.replace(
        /protected List<ReactPackage> getPackages\(\) {[\s\S]*?new ReanimatedPackage\(\),?/m,
        (match) => `${match}
            new HyperCheckoutPackage(),`
      );
      
      config.modResults.contents = withPackage;
    }
    
    return config;
  });

  // Step 3: Create the native module files
  config = withProjectBuildGradle(config, (config) => {
    // The config plugin runs during prebuild, so now is the time to create our Java files
    const projectRoot = config.modRequest.projectRoot;
    const javaPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'yourapp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(javaPath)) {
      fs.mkdirSync(javaPath, { recursive: true });
    }
    
    // Write the HyperCheckoutModule.java file
    const modulePath = path.join(javaPath, 'HyperCheckoutModule.java');
    if (!fs.existsSync(modulePath)) {
      fs.writeFileSync(modulePath, `package com.yourapp;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

// Import the HDFC HyperCheckout SDK
// Note: Import the actual SDK classes based on their documentation
import com.hdfc.hypercheckout.HyperCheckout;
import com.hdfc.hypercheckout.listener.PaymentResponseListener;
import com.hdfc.hypercheckout.model.PaymentRequest;
import com.hdfc.hypercheckout.model.PaymentResponse;

public class HyperCheckoutModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private HyperCheckout hyperCheckout;

    public HyperCheckoutModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        // Initialize the HyperCheckout SDK
        this.hyperCheckout = HyperCheckout.getInstance();
    }

    @Override
    public String getName() {
        return "HyperCheckoutModule";
    }

    @ReactMethod
    public void initialize(String merchantId, String accessCode, Boolean isTestMode, Promise promise) {
        try {
            // Initialize the SDK with merchant credentials
            hyperCheckout.initialize(reactContext, merchantId, accessCode, isTestMode);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startPayment(ReadableMap paymentDetails, final Promise promise) {
        try {
            // Create payment request from the provided details
            PaymentRequest paymentRequest = new PaymentRequest.Builder()
                .setOrderId(paymentDetails.getString("orderId"))
                .setAmount(paymentDetails.getString("amount"))
                .setCurrency(paymentDetails.getString("currency"))
                .setCustomerEmail(paymentDetails.getString("email"))
                .setCustomerPhone(paymentDetails.getString("phone"))
                // Add additional parameters as required by the SDK
                .build();

            // Start the payment process
            hyperCheckout.startPayment(getCurrentActivity(), paymentRequest, new PaymentResponseListener() {
                @Override
                public void onPaymentSuccess(PaymentResponse response) {
                    WritableMap result = Arguments.createMap();
                    result.putString("status", "success");
                    result.putString("transactionId", response.getTransactionId());
                    // Add other response parameters as needed
                    promise.resolve(result);
                }

                @Override
                public void onPaymentFailure(PaymentResponse response) {
                    WritableMap result = Arguments.createMap();
                    result.putString("status", "failure");
                    result.putString("errorCode", response.getErrorCode());
                    result.putString("errorMessage", response.getErrorMessage());
                    promise.resolve(result);
                }

                @Override
                public void onPaymentCancelled() {
                    WritableMap result = Arguments.createMap();
                    result.putString("status", "cancelled");
                    promise.resolve(result);
                }
            });
        } catch (Exception e) {
            promise.reject("PAYMENT_ERROR", e.getMessage());
        }
    }
}`);
    }
    
    // Write the HyperCheckoutPackage.java file
    const packagePath = path.join(javaPath, 'HyperCheckoutPackage.java');
    if (!fs.existsSync(packagePath)) {
      fs.writeFileSync(packagePath, `package com.yourapp;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class HyperCheckoutPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new HyperCheckoutModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}`);
    }
    
    return config;
  });

  return config;
}

module.exports = withHyperCheckout;