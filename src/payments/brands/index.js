// Export all brand screens
export { default as AkilaJewellersScreen } from './AkilaJewellers/Screen';
export { default as DCJewellersScreen } from './DCJewellers/Screen';
export { default as SrimuruganScreen } from './Srimurugan/Screen';

// Export all brand configurations
export { default as AkilaJewellersConfig } from './AkilaJewellers/Config';
export { default as DCJewellersConfig } from './DCJewellers/Config';
export { default as SrimuruganConfig } from './Srimurugan/Config';

// Export all configurations as an object for easy access
export const BrandConfigs = {
  AkilaJewellers: require('./AkilaJewellers/Config').default,
  DCJewellers: require('./DCJewellers/Config').default,
  Srimurugan: require('./Srimurugan/Config').default,
};

// Export all screens as an object for easy access
export const BrandScreens = {
  AkilaJewellers: require('./AkilaJewellers/Screen').default,
  DCJewellers: require('./DCJewellers/Screen').default,
  Srimurugan: require('./Srimurugan/Screen').default,
}; 