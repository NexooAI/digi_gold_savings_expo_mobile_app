const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidNotificationPermissions = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    
    // Add permissions
    androidManifest.permission = androidManifest.permission || [];
    androidManifest.permission.push({
      $: {
        'android:name': 'android.permission.POST_NOTIFICATIONS',
      },
    });

    return config;
  });
};

module.exports = withAndroidNotificationPermissions; 