import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { APP_COLORS } from "@/config";
import { HSK20Screen } from "@/screens/HSK20Screen";
import { StudyDetailScreen } from "@/screens/StudyDetailScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { RoadmapScreen } from "@/screens/RoadmapScreen";
import { RoadmapDetailScreen } from "@/screens/RoadmapDetailScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { HSK30Screen } from "@/screens/HSK30Screen";

export type RootStackParamList = {
  AuthLogin: undefined;
  AuthRegister: undefined;
  MainTabs: undefined;
  StudyDetail: { lessonId: string; title: string };
  RoadmapDetail: { roadmapId: string; title: string };
};

export type MainTabParamList = {
  HSK20: undefined;
  HSK30: undefined;
  Roadmap: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: APP_COLORS.primary,
        tabBarInactiveTintColor: APP_COLORS.muted,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: APP_COLORS.border,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontWeight: "700",
          fontSize: 12,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === "HSK20"
              ? focused
                ? "book"
                : "book-outline"
              : route.name === "HSK30"
                ? focused
                  ? "sparkles"
                  : "sparkles-outline"
              : route.name === "Roadmap"
                ? focused
                  ? "map"
                  : "map-outline"
                : focused
                  ? "person-circle"
                  : "person-circle-outline";

          return <Ionicons name={iconName} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HSK20" component={HSK20Screen} options={{ title: "HSK 2.0" }} />
      <Tab.Screen name="HSK30" component={HSK30Screen} options={{ title: "HSK 3.0" }} />
      <Tab.Screen name="Roadmap" component={RoadmapScreen} options={{ title: "Lộ trình" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Tài khoản" }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background }}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={{ marginTop: 12, color: APP_COLORS.muted }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: APP_COLORS.background },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="StudyDetail" component={StudyDetailScreen} options={({ route }) => ({ title: route.params.title })} />
          <Stack.Screen name="RoadmapDetail" component={RoadmapDetailScreen} options={({ route }) => ({ title: route.params.title })} />
        </>
      ) : (
        <>
          <Stack.Screen name="AuthLogin" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuthRegister" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
