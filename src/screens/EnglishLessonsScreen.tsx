import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "@/config";
import { ENGLISH_LEVELS, getEnglishLessons, type EnglishLevel, type EnglishLesson } from "@/data/english";
import { MainTabParamList, RootStackParamList } from "@/navigation/AppNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "English">,
  NativeStackScreenProps<RootStackParamList>
>;

const LEVELS: EnglishLevel[] = ["A1", "A2", "B1", "B2"];

const LESSON_ICONS = [
  "people-outline",
  "home-outline",
  "restaurant-outline",
  "briefcase-outline",
  "airplane-outline",
  "heart-outline",
] as const;

const LESSON_PALETTES = [
  { background: "#EFF6FF", foreground: "#2563EB" },
  { background: "#ECFEFF", foreground: "#0891B2" },
  { background: "#F5F3FF", foreground: "#7C3AED" },
  { background: "#FFF7ED", foreground: "#EA580C" },
  { background: "#ECFDF5", foreground: "#059669" },
  { background: "#FDF2F8", foreground: "#DB2777" },
] as const;

export function EnglishLessonsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<EnglishLesson>>(null);
  const [selectedLevel, setSelectedLevel] = useState<EnglishLevel>("A1");
  const [query, setQuery] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const allLessons = useMemo(() => getEnglishLessons(selectedLevel), [selectedLevel]);
  const levelInfo = ENGLISH_LEVELS.find((item) => item.level === selectedLevel);
  const lessons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return allLessons;

    return allLessons.filter((lesson) => {
      const lessonText = `${lesson.title} ${lesson.topics.join(" ")}`.toLocaleLowerCase();
      return lessonText.includes(normalizedQuery) || lesson.words.some((word) =>
        `${word.word} ${word.meaning_vi} ${word.example_en ?? ""}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      );
    });
  }, [allLessons, query]);

  function openLesson(lesson: EnglishLesson) {
    navigation.navigate("EnglishLessonDetail", { lessonId: lesson.id, title: lesson.title });
  }

  function openPractice(lesson: EnglishLesson) {
    navigation.navigate("EnglishPractice", { lessonId: lesson.id, title: lesson.title });
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.heroCard}>
          <View style={styles.heroDecoration} />
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Mở rộng vốn từ{`\n`}tiếng Anh</Text>
            <View style={styles.heroIcon}>
              <Ionicons name="book-outline" size={24} color="#BFDBFE" />
            </View>
          </View>
          
          <Text style={styles.heroSubtitle}>Học theo lộ trình CEFR, từ căn bản đến nâng cao.</Text>
          
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={APP_COLORS.muted} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm bài học, chủ đề hoặc từ vựng..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} accessibilityLabel="Xóa tìm kiếm">
              <Ionicons name="close" size={18} color={APP_COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={lessons}
        keyExtractor={(item) => item.id}
        onScroll={(event) => setShowScrollToTop(event.nativeEvent.contentOffset.y > 280)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Bài học</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countNumber}>{lessons.length}</Text>
                <Text style={styles.countLabel}>bài</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelRow}>
              {LEVELS.map((level) => (
                <Pressable
                  key={level}
                  style={[styles.levelPill, selectedLevel === level && styles.levelPillActive]}
                  onPress={() => setSelectedLevel(level)}
                >
                  <Text style={[styles.levelText, selectedLevel === level && styles.levelTextActive]}>{level}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const paletteIndex = (Math.max(item.number, 1) - 1) % LESSON_PALETTES.length;
          const palette = LESSON_PALETTES[paletteIndex];
          const icon = LESSON_ICONS[paletteIndex];
          const title = item.title.replace(/^Bài\s+\d+\s*:\s*/i, "");

          return (
            <View style={styles.lessonCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Học từ vựng: ${title}`}
                style={({ pressed }) => [styles.lessonContent, pressed && styles.cardPressed]}
                onPress={() => openLesson(item)}
              >
                <View style={styles.cardHeading}>
                  
                  <View style={styles.cardMain}>
                    
                    <Text style={styles.lessonTitle} numberOfLines={2}>{title}</Text>
                  </View>
                </View>
                <View style={styles.topicLine}>
                  <Ionicons name="pricetag-outline" size={14} color={ENGLISH_ACCENT} />
                  <Text style={styles.topics} numberOfLines={2}>{item.topics.join(" · ")}</Text>
                </View>
              </Pressable>
              <View style={styles.cardFooter}>
                <View style={styles.wordMeta}>
                  <Ionicons name="book-outline" size={16} color={ENGLISH_ACCENT} />
                  <Text style={styles.wordCount}>{item.total_words} từ vựng</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Luyện từ tiếng Anh: ${title}`}
                    style={({ pressed }) => [styles.practiceButton, pressed && styles.cardPressed]}
                    onPress={() => openPractice(item)}
                  >
                    <Ionicons name="create-outline" size={16} color={ENGLISH_ACCENT} />
                    <Text style={styles.practiceButtonText}>Luyện tập</Text>
                  </Pressable>
                  
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Không tìm thấy bài học hoặc từ phù hợp.</Text>}
      />
      {showScrollToTop ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cuộn lên đầu danh sách bài học"
          style={({ pressed }) => [styles.scrollToTopButton, pressed && styles.scrollToTopButtonPressed]}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={20} color={ENGLISH_ACCENT} />
        </Pressable>
      ) : null}
    </View>
  );
}

const ENGLISH_ACCENT = "#2563eb";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F7FB" },
  header: { paddingHorizontal: 18, paddingBottom: 8, gap: 14 },
  heroCard: { position: "relative", overflow: "hidden", padding: 21, borderRadius: 28, backgroundColor: "#172554" },
  heroDecoration: { position: "absolute", width: 170, height: 170, right: -58, top: -72, borderRadius: 85, backgroundColor: "#1E40AF" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  heroBadgeText: { color: "#DBEAFE", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  heroIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  heroTitle: { marginTop: 14, color: "#fff", fontSize: 27, lineHeight: 32, fontWeight: "900" },
  heroSubtitle: { marginTop: 7, maxWidth: 290, color: "#BFDBFE", fontSize: 13, lineHeight: 19 },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 17 },
  heroFooterText: { color: "#DBEAFE", fontSize: 11, fontWeight: "800" },
  heroDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#93C5FD" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#E8ECF2", borderRadius: 18, paddingHorizontal: 15, backgroundColor: "#fff", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  search: { flex: 1, paddingVertical: 13, backgroundColor: "#fff", color: APP_COLORS.text },
  listContent: { paddingHorizontal: 18, paddingTop: 13, paddingBottom: 32, gap: 12 },
  listHeader: { gap: 13, marginBottom: 2 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionEyebrow: { color: ENGLISH_ACCENT, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { marginTop: 3, color: APP_COLORS.text, fontSize: 22, fontWeight: "900" },
  countBadge: { flexDirection: "row", alignItems: "baseline", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#fff" },
  countNumber: { color: APP_COLORS.text, fontSize: 15, fontWeight: "900" },
  countLabel: { color: APP_COLORS.muted, fontSize: 11, fontWeight: "700" },
  levelRow: { flexDirection: "row", gap: 8, paddingRight: 18 },
  levelPill: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8ECF2" },
  levelPillActive: { backgroundColor: ENGLISH_ACCENT, borderColor: ENGLISH_ACCENT, shadowColor: ENGLISH_ACCENT, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  levelText: { color: APP_COLORS.muted, fontSize: 13, fontWeight: "800" },
  levelTextActive: { color: "#fff" },
  lessonCard: { padding: 16, borderRadius: 23, borderWidth: 1, borderColor: "#E8ECF2", backgroundColor: "#fff", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.045, shadowRadius: 12, elevation: 2 },
  lessonContent: { borderRadius: 16 },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: 13 },
  lessonIcon: { width: 56, height: 56, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  cardMain: { flex: 1 },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelBadge: { backgroundColor: "#EFF6FF", color: ENGLISH_ACCENT, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: "hidden", fontSize: 10, fontWeight: "900" },
  lessonNumber: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  lessonTitle: { marginTop: 7, fontSize: 16, fontWeight: "900", lineHeight: 21, color: APP_COLORS.text },
  topicLine: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 13 },
  topics: { flex: 1, color: APP_COLORS.muted, fontSize: 13, lineHeight: 19 },
  cardFooter: { marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EEF1F5", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  wordMeta: { flexDirection: "row", alignItems: "center", gap: 7 },
  wordCount: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "800" },
  practiceButton: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#F2F6FF" },
  practiceButtonText: { color: ENGLISH_ACCENT, fontSize: 11, fontWeight: "900" },
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
