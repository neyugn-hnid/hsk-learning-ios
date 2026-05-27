import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { APP_COLORS } from "@/config";
import { fetchLessons } from "@/lib/api";
import { RootStackParamList } from "@/navigation/AppNavigator";
import type { LessonSummary } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "LessonsLevel">;

export function LessonsLevelScreen({ navigation, route }: Props) {
  const { level } = route.params;
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    void loadLessons();
  }, [level]);

  useFocusEffect(
    useCallback(() => {
      void loadLessons();
    }, [level, query]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={[styles.headerSearchButton, searchOpen && styles.headerSearchButtonActive]}
          onPress={() => {
            if (searchOpen && query.trim()) {
              void loadLessons();
              return;
            }
            if (searchOpen) {
              setQuery("");
            }
            setSearchOpen((prev) => !prev);
          }}
        >
          <Ionicons name="search" size={18} color={APP_COLORS.primaryDark} />
        </Pressable>
      ),
    });
  }, [navigation, query, searchOpen]);

  async function loadLessons(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetchLessons({ level, q: query });
      setLessons(response.lessons);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        {searchOpen ? (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={APP_COLORS.muted} />
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm bài học..."
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => void loadLessons()}
            />
            <Pressable
              onPress={() => {
                setQuery("");
                setSearchOpen(false);
                void loadLessons();
              }}
            >
              <Ionicons name="close" size={18} color={APP_COLORS.muted} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadLessons(true)} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("LessonDetail", { lessonId: item.id, title: item.title })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.badge}>{item.level}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description || "Bài học HSK."}</Text>
              <Text style={styles.cardMeta}>{item.vocabularyCount} từ vựng · {item.quizCount} quiz</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có bài học phù hợp.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  filters: { paddingHorizontal: 20, gap: 12, paddingTop: 14, paddingBottom: 6 },
  headerSearchButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  headerSearchButtonActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  search: { flex: 1, paddingVertical: 14, backgroundColor: "#fff" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 20, gap: 14 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: APP_COLORS.border },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  badge: {
    backgroundColor: "#fef2f2",
    color: APP_COLORS.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
  },
  cardTitle: { marginTop: 16, fontSize: 20, fontWeight: "800", color: APP_COLORS.text },
  cardDesc: { marginTop: 8, color: APP_COLORS.muted, lineHeight: 20 },
  cardMeta: { marginTop: 14, color: APP_COLORS.muted, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted },
});
