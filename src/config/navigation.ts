// config/navigation.ts
export type RootStackParamList = {
    '(public)': undefined;
    '(app)': undefined;
    '(auth)': undefined;
    '(products)': undefined;
    // Add other screen params
  };
  
  declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootStackParamList {}
    }
  }