import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
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

const TOPIC_ICONS = [
  "chatbubbles-outline",
  "people-outline",
  "restaurant-outline",
  "time-outline",
  "home-outline",
  "briefcase-outline",
] as const;

const TOPIC_PALETTES = [
  { background: "#FFF1F2", foreground: "#BE123C" },
  { background: "#EFF6FF", foreground: "#1D4ED8" },
  { background: "#ECFDF5", foreground: "#047857" },
  { background: "#FFF7ED", foreground: "#C2410C" },
  { background: "#F5F3FF", foreground: "#6D28D9" },
  { background: "#FEFCE8", foreground: "#A16207" },
] as const;

export function HSK30Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<LessonSummary>>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [allLessons, setAllLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

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
        <View style={styles.heroCard}>
          <View style={styles.heroDecoration} />
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Học tiếng Trung{`\n`}qua chủ đề</Text>
            <View style={styles.heroIcon}>
              <Ionicons name="school-outline" size={24} color="#FECACA" />
            </View>
          </View>
          
          <Text style={styles.heroSubtitle}>Bắt đầu học từ vựng và luyện tập ngay.</Text>
          
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={APP_COLORS.muted} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm chủ đề hoặc mô tả..."
            placeholderTextColor="#94A3B8"
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
          ref={listRef}
          data={lessons}
          keyExtractor={(item) => item.id}
          onScroll={(event) => setShowScrollToTop(event.nativeEvent.contentOffset.y > 280)}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadLessons(true)} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Chủ đề học</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{lessons.length}</Text>
                  <Text style={styles.countLabel}>bài</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {levels.map((level) => (
                  <Pressable
                    key={level}
                    style={[styles.filterPill, selectedLevel === level && styles.filterPillActive]}
                    onPress={() => setSelectedLevel(level)}
                  >
                    <Text style={[styles.filterText, selectedLevel === level && styles.filterTextActive]}>
                      {level.replace(/(HSK)\s*(\d+)/i, "$1 $2")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => {
            const paletteIndex = (Math.max(item.orderNo, 1) - 1) % TOPIC_PALETTES.length;
            const palette = TOPIC_PALETTES[paletteIndex];
            const icon = TOPIC_ICONS[paletteIndex];
            const title = item.title.replace(/^Chủ đề\s+\d+\s*:\s*/i, "");

            return (
              <View style={styles.topicCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Học từ vựng: ${title}`}
                  style={({ pressed }) => [styles.topicContent, pressed && styles.cardPressed]}
                  onPress={() => navigation.navigate("StudyDetail", { lessonId: item.id, title: item.title })}
                >
                  <View style={styles.cardHeading}>
                    <View style={styles.cardMain}>
                      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description || "Từ vựng và mẫu câu thiết yếu theo chủ đề."}
                  </Text>
                </Pressable>
                <View style={styles.cardFooter}>
                  <View style={styles.vocabularyMeta}>
                    <Ionicons name="book-outline" size={16} color={APP_COLORS.primaryDark} />
                    <Text style={styles.cardMeta}>{item.vocabularyCount} từ vựng</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mở luyện tập tiếng Trung: ${title}`}
                      style={({ pressed }) => [styles.practiceButton, pressed && styles.cardPressed]}
                      onPress={() => navigation.navigate("HanziPractice", { lessonId: item.id, title: item.title })}
                    >
                      <Ionicons name="create-outline" size={16} color={APP_COLORS.primaryDark} />
                      <Text style={styles.practiceButtonText}>Luyện tập</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có bài học phù hợp.</Text>}
        />
      )}
      {!loading && showScrollToTop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cuộn lên đầu danh sách chủ đề"
          style={({ pressed }) => [styles.scrollToTopButton, pressed && styles.scrollToTopButtonPressed]}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={20} color={APP_COLORS.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },
  header: { paddingHorizontal: 18, paddingBottom: 8, gap: 14 },
  heroCard: { position: "relative", overflow: "hidden", padding: 21, borderRadius: 28, backgroundColor: "#7F1D1D" },
  heroDecoration: { position: "absolute", width: 170, height: 170, right: -58, top: -72, borderRadius: 85, backgroundColor: "#991B1B" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.13)" },
  heroBadgeText: { color: "#FEE2E2", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  heroIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  heroTitle: { marginTop: 14, color: "#fff", fontSize: 27, lineHeight: 32, fontWeight: "900" },
  heroSubtitle: { marginTop: 7, maxWidth: 290, color: "#FECACA", fontSize: 13, lineHeight: 19 },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 17 },
  heroFooterText: { color: "#FEE2E2", fontSize: 12, fontWeight: "800" },
  heroDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#FDA4AF" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8ECF2",
    borderRadius: 18,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  search: { flex: 1, paddingVertical: 13, color: APP_COLORS.text, backgroundColor: "#fff" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingHorizontal: 18, paddingTop: 13, paddingBottom: 32, gap: 12 },
  listHeader: { gap: 13, marginBottom: 2 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionEyebrow: { color: APP_COLORS.primaryDark, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { marginTop: 3, color: APP_COLORS.text, fontSize: 22, fontWeight: "900" },
  countBadge: { flexDirection: "row", alignItems: "baseline", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#fff" },
  countText: { color: APP_COLORS.text, fontSize: 15, fontWeight: "900" },
  countLabel: { color: APP_COLORS.muted, fontSize: 11, fontWeight: "700" },
  filterRow: { flexDirection: "row", gap: 8, paddingRight: 18 },
  filterPill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8ECF2",
  },
  filterPillActive: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary, shadowColor: APP_COLORS.primary, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  filterText: { color: APP_COLORS.muted, fontSize: 13, fontWeight: "800" },
  filterTextActive: { color: "#fff" },
  topicCard: { padding: 16, borderRadius: 23, borderWidth: 1, borderColor: "#E8ECF2", backgroundColor: "#fff", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.045, shadowRadius: 12, elevation: 2 },
  topicContent: { borderRadius: 16 },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: 13 },
  topicIcon: { width: 56, height: 56, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  cardMain: { flex: 1 },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: { overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#FEF2F2", color: APP_COLORS.primaryDark, fontSize: 10, fontWeight: "900" },
  topicNumber: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  cardTitle: {  color: APP_COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "900" },
  cardDesc: { marginTop: 13, color: APP_COLORS.muted, fontSize: 13, lineHeight: 19 },
  cardFooter: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF1F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  vocabularyMeta: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardMeta: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "800" },
  practiceButton: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FFF7F5" },
  practiceButtonText: { color: APP_COLORS.primaryDark, fontSize: 11, fontWeight: "900" },
  arrowButton: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scrollToTopButton: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF2",
    shadowColor: "#334155",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  scrollToTopButtonPressed: { opacity: 0.75 },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted, fontWeight: "600" },
});
