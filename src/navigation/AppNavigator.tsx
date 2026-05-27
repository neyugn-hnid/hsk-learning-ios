import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { APP_COLORS } from "@/config";
import { LessonsScreen } from "@/screens/LessonsScreen";
import { LessonsLevelScreen } from "@/screens/LessonsLevelScreen";
import { LessonDetailScreen } from "@/screens/LessonDetailScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { RoadmapScreen } from "@/screens/RoadmapScreen";
import { RoadmapPhaseScreen } from "@/screens/RoadmapPhaseScreen";
import { RoadmapDetailScreen } from "@/screens/RoadmapDetailScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";

export type RootStackParamList = {
  AuthLogin: undefined;
  AuthRegister: undefined;
  MainTabs: undefined;
  LessonsLevel: { level: string };
  LessonDetail: { lessonId: string; title: string };
  RoadmapPhase: { phase: string };
  RoadmapDetail: { roadmapId: string; title: string };
};

export type MainTabParamList = {
  Lessons: undefined;
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
            route.name === "Lessons"
              ? focused
                ? "book"
                : "book-outline"
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
      <Tab.Screen name="Lessons" component={LessonsScreen} options={{ title: "Bài học" }} />
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
          <Stack.Screen name="LessonsLevel" component={LessonsLevelScreen} options={({ route }) => ({ title: route.params.level })} />
          <Stack.Screen name="LessonDetail" component={LessonDetailScreen} options={({ route }) => ({ title: route.params.title })} />
          <Stack.Screen name="RoadmapPhase" component={RoadmapPhaseScreen} options={({ route }) => ({ title: route.params.phase })} />
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
