import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { APP_COLORS } from "@/config";
import { LanguageHomeScreen } from "@/screens/LanguageHomeScreen";
import { StudyDetailScreen } from "@/screens/StudyDetailScreen";
import { HSK30Screen } from "@/screens/HSK30Screen";
import { EnglishLessonsScreen } from "@/screens/EnglishLessonsScreen";
import { EnglishLessonDetailScreen } from "@/screens/EnglishLessonDetailScreen";
import { HanziPracticeScreen } from "@/screens/HanziPracticeScreen";
import { EnglishPracticeScreen } from "@/screens/EnglishPracticeScreen";

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  StudyDetail: { lessonId: string; title: string };
  HanziPractice: { lessonId: string; title: string };
  EnglishLessonDetail: { lessonId: string; title: string };
  EnglishPractice: { lessonId: string; title: string };
};

export type MainTabParamList = {
  Home: undefined;
  HSK30: undefined;
  English: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: APP_COLORS.primary,
        tabBarInactiveTintColor: APP_COLORS.muted,
        tabBarStyle: route.name === "Home"
          ? { display: "none" }
          : {
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
            route.name === "Home"
              ? focused
                ? "home"
                : "home-outline"
              : route.name === "HSK30"
              ? focused
                ? "sparkles"
                : "sparkles-outline"
              : focused
                ? "globe"
                : "globe-outline";

          return <Ionicons name={iconName} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={LanguageHomeScreen} options={{ title: "Khám phá" }} />
      <Tab.Screen name="HSK30" component={HSK30Screen} options={{ title: "Tiếng Trung" }} />
      <Tab.Screen name="English" component={EnglishLessonsScreen} options={{ title: "Tiếng Anh" }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: APP_COLORS.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="StudyDetail" component={StudyDetailScreen} options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen name="HanziPractice" component={HanziPracticeScreen} options={{ title: "Luyện tập tiếng Trung" }} />
      <Stack.Screen name="EnglishLessonDetail" component={EnglishLessonDetailScreen} options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen name="EnglishPractice" component={EnglishPracticeScreen} options={{ title: "Luyện từ tiếng Anh" }} />
    </Stack.Navigator>
  );
}
