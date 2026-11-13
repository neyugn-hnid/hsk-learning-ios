import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "@/navigation/AppNavigator";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f8fafc",
    card: "#ffffff",
    primary: "#dc2626",
    text: "#0f172a",
    border: "#e2e8f0",
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSerifSC: require("./assets/fonts/NotoSerifSC-Semibold-HSK.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
