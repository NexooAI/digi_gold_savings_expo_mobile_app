import { Text } from 'react-native';
import CustomDrawerContent from '@/common/components/navigation/DrawerContent';
import { Drawer } from 'expo-router/drawer';

// Disable global font scaling for Text components
;(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

export default function AppLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false }}
      drawerContent={CustomDrawerContent}
    >
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
