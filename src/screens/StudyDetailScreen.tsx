import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_COLORS } from "@/config";
import rawChineseSentences from "@/data/chinese-sentences.json";
import { fetchLessonDetail } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import type { LessonDetail, Vocabulary } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "StudyDetail">;

type ChineseExampleSentence = {
  lesson: number;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  vocabulary: string[];
};

const CHINESE_SENTENCES = rawChineseSentences as ChineseExampleSentence[];
const CHINESE_FONT_FAMILY = "NotoSerifSC";

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function findChineseExample(lessonNo: number, vocabulary: Vocabulary) {
  const sameLesson = CHINESE_SENTENCES.filter((sentence) => sentence.lesson === lessonNo);
  const word = vocabulary.chinese.trim();
  const exact = (sentences: ChineseExampleSentence[]) =>
    sentences.find((sentence) => sentence.vocabulary.includes(word));
  const related = (sentences: ChineseExampleSentence[]) =>
    sentences.find((sentence) =>
      sentence.vocabulary.some((term) => term.includes(word) || word.includes(term)),
    );
  const inSentence = (sentences: ChineseExampleSentence[]) =>
    sentences.find((sentence) => sentence.hanzi.includes(word));

  return exact(sameLesson) ??
    exact(CHINESE_SENTENCES) ??
    related(sameLesson) ??
    related(CHINESE_SENTENCES) ??
    inSentence(sameLesson) ??
    inSentence(CHINESE_SENTENCES) ??
    null;
}

export function StudyDetailScreen({ route }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    void load();
  }, [route.params.lessonId]);

  async function load() {
    try {
      setLoading(true);
      const response = await fetchLessonDetail(route.params.lessonId);
      setLesson(response.lesson);
      setIndex(0);
      setIsFlipped(false);
    } finally {
      setLoading(false);
    }
  }

  const shuffledVocabularies = useMemo(
    () => shuffleItems(lesson?.vocabularies ?? []),
    [lesson?.id],
  );
  const currentVocab = shuffledVocabularies[index];
  const currentExample = useMemo(
    () => {
      if (!currentVocab) return null;

      const fallback = lesson ? findChineseExample(lesson.orderNo, currentVocab) : null;
      const hanzi = currentVocab.exampleChinese?.trim() || fallback?.hanzi || "";
      if (!hanzi) return null;

      return {
        hanzi,
        pinyin: currentVocab.examplePinyin?.trim() || fallback?.pinyin || "",
        vietnamese: currentVocab.exampleMeaning?.trim() || fallback?.vietnamese || "",
      };
    },
    [currentVocab, lesson?.orderNo],
  );
  const count = shuffledVocabularies.length;

  function next() {
    if (!count) return;
    setIndex((current) => (current + 1) % count);
    setIsFlipped(false);
  }

  function previous() {
    if (!count) return;
    setIndex((current) => (current - 1 + count) % count);
    setIsFlipped(false);
  }

  function speakChinese(text?: string | null) {
    if (!text) return;
    void Speech.stop();
    Speech.speak(text, { language: "zh-CN", rate: 0.9 });
  }

  if (loading || !lesson) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {currentVocab ? (
        <View style={styles.study}>
          {isFlipped ? (
            <View style={[styles.flashcard, styles.backFace]}>
              <View style={styles.cardHeader}>
                <Text style={styles.faceLabel}>MẶT SAU</Text>
                <Text style={styles.counter}>{index + 1} / {count}</Text>
              </View>

              <Text style={styles.backHanzi}>{currentVocab.chinese}</Text>

              <View style={styles.pinyinBox}>
                <Text style={styles.sectionLabel}>PINYIN</Text>
                <Text style={styles.backPinyin}>{currentVocab.pinyin}</Text>
                <View pointerEvents="box-none" style={styles.audioButtonSlot}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={"Nghe phát âm " + currentVocab.chinese}
                    style={({ pressed }) => [styles.audioButton, pressed && styles.audioButtonPressed]}
                    onPress={() => speakChinese(currentVocab.chinese)}
                  >
                    <Ionicons name="volume-high" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.meaningBox}>
                <Text style={styles.sectionLabel}>NGHĨA TIẾNG VIỆT</Text>
                <Text style={styles.meaning}>{currentVocab.meaningVi}</Text>
              </View>

              {currentExample ? (
                <View style={styles.exampleBox}>
                  <View style={styles.exampleHeader}>
                    <Text style={styles.sectionLabel}>VÍ DỤ</Text>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={APP_COLORS.primary} />
                  </View>
                  <Text style={styles.exampleHanzi}>{currentExample.hanzi}</Text>
                  <Text style={styles.examplePinyin}>{currentExample.pinyin}</Text>
                  <Text style={styles.exampleVietnamese}>{currentExample.vietnamese}</Text>
                </View>
              ) : (
                <View style={styles.exampleBox}>
                  <Text style={styles.sectionLabel}>VÍ DỤ</Text>
                  <Text style={styles.missingExample}>Chưa có câu ví dụ cho từ này.</Text>
                </View>
              )}

              <Pressable style={styles.flipBackButton} onPress={() => setIsFlipped(false)}>
                <Ionicons name="return-up-back-outline" size={17} color={APP_COLORS.primaryDark} />
                <Text style={styles.flipBackText}>Chạm để xem lại mặt trước</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Thẻ từ " + currentVocab.chinese + ", pinyin " + currentVocab.pinyin + ". Chạm để lật thẻ."}
              style={({ pressed }) => [styles.flashcard, styles.frontFace, pressed && styles.pressed]}
              onPress={() => setIsFlipped(true)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.faceLabel}>THẺ TỪ VỰNG · {lesson.level}</Text>
                <Text style={styles.counter}>{index + 1} / {count}</Text>
              </View>

              <View style={styles.wordBlock}>
                <Text style={styles.frontHanzi}>{currentVocab.chinese}</Text>
                <Text style={styles.frontPinyin}>{currentVocab.pinyin}</Text>
              </View>

              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={17} color={APP_COLORS.primary} />
                <Text style={styles.flipHintText}>Chạm thẻ để xem nghĩa và ví dụ</Text>
              </View>
            </Pressable>
          )}

          <View style={styles.navigation}>
            <Pressable style={styles.navigationButton} onPress={previous}>
              <Ionicons name="chevron-back" size={20} color={APP_COLORS.text} />
              <Text style={styles.navigationText}>Từ trước</Text>
            </Pressable>
            <Pressable style={[styles.navigationButton, styles.nextButton]} onPress={next}>
              <Text style={styles.nextText}>Từ tiếp</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Bài học này chưa có từ vựng.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 20, paddingBottom: 36 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  study: { gap: 14 },
  flashcard: { borderRadius: 30, padding: 22, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: "#fff" },
  frontFace: { minHeight: 390, justifyContent: "space-between", alignItems: "center", overflow: "hidden" },
  backFace: { gap: 17, borderColor: APP_COLORS.border, backgroundColor: "#fff" },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  audioButtonPressed: { opacity: 0.78 },
  cardHeader: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faceLabel: { color: APP_COLORS.primaryDark, fontSize: 10, letterSpacing: 1.2, fontWeight: "900" },
  counter: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "800" },
  wordBlock: { alignItems: "center", paddingVertical: 28 },
  frontHanzi: { fontFamily: CHINESE_FONT_FAMILY, color: APP_COLORS.primary, fontSize: 84, lineHeight: 100, fontWeight: "600", textAlign: "center" },
  frontPinyin: { marginTop: 8, color: APP_COLORS.text, fontSize: 24, fontWeight: "800", textAlign: "center" },
  flipHint: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EEF1F5" },
  flipHintText: { color: APP_COLORS.primaryDark, fontSize: 12, fontWeight: "800" },
  backHanzi: { fontFamily: CHINESE_FONT_FAMILY, color: APP_COLORS.text, fontSize: 34, lineHeight: 42, fontWeight: "600" },
  pinyinBox: { width: "100%", position: "relative", padding: 14, paddingRight: 60, borderRadius: 16, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: "#F8FAFC" },
  sectionLabel: { color: APP_COLORS.muted, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  backPinyin: { marginTop: 6, color: APP_COLORS.primaryDark, fontSize: 21, lineHeight: 29, fontWeight: "900" },
  audioButtonSlot: { position: "absolute", top: 0, right: 14, bottom: 0, width: 32, justifyContent: "center" },
  audioButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: APP_COLORS.primary },
  meaningBox: { gap: 7 },
  meaning: { color: APP_COLORS.text, fontSize: 19, lineHeight: 27, fontWeight: "900" },
  exampleBox: { paddingTop: 15, borderTopWidth: 1, borderTopColor: "#EEF1F5", gap: 8 },
  exampleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exampleHanzi: { fontFamily: CHINESE_FONT_FAMILY, color: APP_COLORS.text, fontSize: 22, lineHeight: 31, fontWeight: "600" },
  examplePinyin: { color: APP_COLORS.primaryDark, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  exampleVietnamese: { color: APP_COLORS.muted, fontSize: 14, lineHeight: 21 },
  missingExample: { color: APP_COLORS.muted, marginTop: 6, lineHeight: 20 },
  flipBackButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 1 },
  flipBackText: { color: APP_COLORS.primaryDark, fontSize: 12, fontWeight: "800" },
  navigation: { flexDirection: "row", gap: 12 },
  navigationButton: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 16, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: "#fff" },
  navigationText: { color: APP_COLORS.text, fontWeight: "800" },
  nextButton: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary },
  nextText: { color: "#fff", fontWeight: "900" },
  empty: { alignItems: "center", padding: 26 },
  emptyText: { color: APP_COLORS.muted, fontWeight: "700" },
});
