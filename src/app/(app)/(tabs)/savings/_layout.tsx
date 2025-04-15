import { Stack } from 'expo-router';

export default function SavingsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="SavingsDetail" 
        options={{ title: 'Savings Details', headerShown: false }} 
      />
      
    </Stack>
  );
}