import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "@/config";
import { fetchHsk30Lessons } from "@/lib/api";
import { MainTabParamList, RootStackParamList } from "@/navigation/AppNavigator";
import type { LessonSummary } from "@/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "HSK30">,
  NativeStackScreenProps<RootStackParamList>
>;

function getLevelRank(level: string) {
  const match = level.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortLevels(levels: string[]) {
  return levels.sort((a, b) => getLevelRank(a) - getLevelRank(b) || a.localeCompare(b));
}

export function HSK30Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [allLessons, setAllLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const levels = useMemo(
    () => sortLevels(Array.from(new Set(allLessons.map((item) => item.level).filter(Boolean)))),
    [allLessons],
  );

  useEffect(() => {
    void loadLessons();
  }, [selectedLevel]);

  async function loadLessons(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const allResponse = await fetchHsk30Lessons();
      const availableLevels = sortLevels(Array.from(new Set(allResponse.lessons.map((item) => item.level).filter(Boolean))));
      const effectiveLevel = selectedLevel ?? availableLevels[0];
      const response = await fetchHsk30Lessons({
        level: effectiveLevel,
        q: query,
      });
      setAllLessons(allResponse.lessons);
      setLessons(response.lessons);
      if (!selectedLevel && effectiveLevel) {
        setSelectedLevel(effectiveLevel);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerBar}>
          <View style={styles.headerText}>
            <Text style={styles.title}>HSK 3.0</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={20} color={APP_COLORS.primaryDark} />
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={APP_COLORS.muted} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm bài học..."
            returnKeyType="search"
            onSubmitEditing={() => void loadLessons()}
          />
          {query ? (
            <Pressable
              onPress={() => {
                setQuery("");
                void loadLessons();
              }}
            >
              <Ionicons name="close" size={18} color={APP_COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
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
          ListHeaderComponent={
            <View style={styles.filterRow}>
              {levels.map((level) => (
                <Pressable
                  key={level}
                  style={[styles.filterPill, selectedLevel === level && styles.filterPillActive]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={[styles.filterText, selectedLevel === level && styles.filterTextActive]}>{level}</Text>
                </Pressable>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("StudyDetail", { lessonId: item.id, title: item.title })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.badge}>{item.level}</Text>
                <Text style={styles.order}>Buổi {item.orderNo}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description || "Bài học HSK 3.0."}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{item.vocabularyCount} từ vựng</Text>
                <Ionicons name="arrow-forward" size={18} color={APP_COLORS.primaryDark} />
              </View>
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
  header: { paddingHorizontal: 20, paddingBottom: 10, gap: 14 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  headerText: { flex: 1 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: APP_COLORS.dangerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "900", color: APP_COLORS.text },
  subtitle: { marginTop: 6, color: APP_COLORS.muted },
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
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  filterPillActive: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  filterText: { color: APP_COLORS.muted, fontWeight: "800" },
  filterTextActive: { color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: APP_COLORS.border },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  badge: {
    backgroundColor: "#fef2f2",
    color: APP_COLORS.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
  },
  order: { color: APP_COLORS.muted, fontWeight: "800" },
  cardTitle: { marginTop: 16, fontSize: 20, fontWeight: "800", color: APP_COLORS.text },
  cardDesc: { marginTop: 8, color: APP_COLORS.muted, lineHeight: 20 },
  cardFooter: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMeta: { color: APP_COLORS.muted, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted },
});
