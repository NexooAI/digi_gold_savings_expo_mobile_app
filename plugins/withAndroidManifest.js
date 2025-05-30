const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidNotificationPermissions = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Add permissions
    androidManifest.permission = androidManifest.permission || [];
    
    // Add notification permission
    androidManifest.permission.push({
      $: {
        'android:name': 'android.permission.POST_NOTIFICATIONS',
      },
    });

    // Add SMS permissions for OTP auto-fetch
    androidManifest.permission.push({
      $: {
        'android:name': 'android.permission.RECEIVE_SMS',
      },
    });

    androidManifest.permission.push({
      $: {
        'android:name': 'android.permission.READ_SMS',
      },
    });

    return config;
  });
};

module.exports = withAndroidNotificationPermissions; 