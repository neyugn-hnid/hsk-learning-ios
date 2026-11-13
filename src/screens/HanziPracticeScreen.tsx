import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { APP_COLORS } from "@/config";
import { fetchLessonDetail } from "@/lib/api";
import type { RootStackParamList } from "@/navigation/AppNavigator";
import type { LessonDetail } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "HanziPractice">;

const CHINESE_FONT_FAMILY = "NotoSerifSC";

function normalizeHanzi(value: string) {
  return value.normalize("NFC").replace(/\s+/g, "").trim();
}

function containsOnlyHanzi(value: string) {
  return /^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+$/.test(value);
}

export function HanziPracticeScreen({ route, navigation }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [showPinyin, setShowPinyin] = useState(false);
  const [correctIndexes, setCorrectIndexes] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError(false);
      setLesson(null);
      setIndex(0);
      setAnswer("");
      setFeedback(null);
      setShowPinyin(false);
      setCorrectIndexes([]);
      setIsComplete(false);

      try {
        const response = await fetchLessonDetail(route.params.lessonId);
        if (active) setLesson(response.lesson);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      void Speech.stop();
    };
  }, [route.params.lessonId]);

  const words = lesson?.vocabularies ?? [];
  const word = words[index];
  const progress = words.length ? (index + 1) / words.length : 0;

  function checkAnswer(value = answer) {
    if (!word || !value.trim() || feedback === true) return;
    const isCorrect = normalizeHanzi(value) === normalizeHanzi(word.chinese);
    setFeedback(isCorrect);
    if (isCorrect) {
      setCorrectIndexes((current) => current.includes(index) ? current : [...current, index]);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      const answeredIndex = index;
      autoAdvanceTimer.current = setTimeout(() => {
        autoAdvanceTimer.current = null;
        moveTo(answeredIndex + 1);
      }, 650);
    }
  }

  function updateAnswer(value: string) {
    if (feedback === true) return;
    setAnswer(value);
    setFeedback(null);
    const normalizedAnswer = normalizeHanzi(value);
    const normalizedWord = normalizeHanzi(word?.chinese ?? "");
    if (normalizedAnswer && normalizedAnswer === normalizedWord) {
      checkAnswer(value);
    } else if (
      normalizedAnswer
      && containsOnlyHanzi(normalizedAnswer)
      && Array.from(normalizedAnswer).length >= Array.from(normalizedWord).length
    ) {
      setFeedback(false);
    }
  }

  function moveTo(nextIndex: number) {
    if (!words.length) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (nextIndex >= words.length) {
      setIsComplete(true);
      return;
    }
    setIndex(Math.max(0, nextIndex));
    setAnswer("");
    setFeedback(null);
    setShowPinyin(false);
  }

  function restart() {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setIndex(0);
    setAnswer("");
    setFeedback(null);
    setShowPinyin(false);
    setCorrectIndexes([]);
    setIsComplete(false);
  }

  function speakWord() {
    if (!word?.chinese) return;
    void Speech.stop();
    Speech.speak(word.chinese, { language: "zh-CN", rate: 0.85 });
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  if (loadError || !lesson) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={34} color={APP_COLORS.primary} />
        <Text style={styles.emptyTitle}>Không tải được bài học</Text>
        <Text style={styles.emptyDescription}>Hãy quay lại danh sách và mở bài luyện tập lần nữa.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  if (!words.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="book-outline" size={34} color={APP_COLORS.primary} />
        <Text style={styles.emptyTitle}>Bài này chưa có từ vựng</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isComplete ? (
          <View style={styles.completionCard}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-done" size={30} color="#047857" />
            </View>
            <Text style={styles.completionTitle}>Hoàn thành bài luyện tập!</Text>
            <Text style={styles.completionDescription}>
              Bạn đã viết đúng {correctIndexes.length}/{words.length} từ trong bài.
            </Text>
            <Pressable style={styles.primaryButton} onPress={restart}>
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Luyện lại</Text>
            </Pressable>
            <Pressable style={styles.textButton} onPress={() => navigation.goBack()}>
              <Text style={styles.textButtonLabel}>Về danh sách bài học</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressTitle}>TIẾN ĐỘ BÀI LUYỆN</Text>
                <Text style={styles.progressCount}>{index + 1} / {words.length}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>

            <View style={styles.practiceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLabelWrap}>
                  <View style={styles.cardLabelIcon}>
                    <Ionicons name="language-outline" size={16} color={APP_COLORS.primaryDark} />
                  </View>
                  <Text style={styles.cardLabel}>VIẾT TỪ TIẾNG TRUNG</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nghe phát âm từ"
                  style={styles.audioButton}
                  onPress={speakWord}
                >
                  <Ionicons name="volume-high" size={19} color={APP_COLORS.primary} />
                </Pressable>
              </View>

              <Text style={styles.promptLabel}>TỪ NÀY CÓ NGHĨA LÀ</Text>
              <Text style={styles.meaningPrompt}>{word?.meaningVi || "Chưa có nghĩa tiếng Việt"}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPinyin ? "Ẩn gợi ý pinyin" : "Hiện gợi ý pinyin"}
                style={[styles.pinyinHint, showPinyin && styles.pinyinHintActive]}
                onPress={() => setShowPinyin((current) => !current)}
              >
                <Ionicons name={showPinyin ? "eye-off-outline" : "eye-outline"} size={15} color={APP_COLORS.primaryDark} />
                <Text style={styles.pinyinHintText}>{showPinyin ? word?.pinyin : "Hiện gợi ý pinyin"}</Text>
              </Pressable>

              <TextInput
                value={answer}
                onChangeText={updateAnswer}
                onSubmitEditing={() => checkAnswer()}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Nhập chữ Hán..."
                placeholderTextColor="#94A3B8"
                accessibilityLabel="Nhập chữ Hán"
                style={[
                  styles.answerInput,
                  feedback === true && styles.answerInputCorrect,
                  feedback === false && styles.answerInputIncorrect,
                ]}
              />

              <Text style={styles.inputHint}>Nhập đúng chữ Hán để tự kiểm tra và chuyển sang từ tiếp theo.</Text>

              {feedback !== null ? (
                <View style={[styles.feedbackBox, feedback ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                  <Ionicons
                    name={feedback ? "checkmark-circle" : "close-circle"}
                    size={19}
                    color={feedback ? "#047857" : "#B91C1C"}
                  />
                  <Text style={[styles.feedbackText, feedback ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect]}>
                    {feedback ? `Chính xác! ${word?.chinese}` : "Chưa đúng, thử lại nhé."}
                  </Text>
                </View>
              ) : null}

            </View>

            <View style={styles.navigationRow}>
              <Pressable
                accessibilityRole="button"
                disabled={index === 0}
                style={[styles.navigationButton, index === 0 && styles.navigationButtonDisabled]}
                onPress={() => moveTo(index - 1)}
              >
                <Ionicons name="chevron-back" size={19} color={index === 0 ? "#A8B0BC" : APP_COLORS.text} />
                <Text style={[styles.navigationText, index === 0 && styles.navigationTextDisabled]}>Từ trước</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.navigationButton, styles.nextButton]}
                onPress={() => moveTo(index + 1)}
              >
                <Text style={styles.nextButtonText}>{index === words.length - 1 ? "Hoàn thành" : "Từ tiếp"}</Text>
                <Ionicons name={index === words.length - 1 ? "checkmark-done" : "chevron-forward"} size={19} color="#fff" />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 18, gap: 16, paddingBottom: 36 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12, backgroundColor: APP_COLORS.background },
  emptyTitle: { color: APP_COLORS.text, fontSize: 19, fontWeight: "900", textAlign: "center" },
  emptyDescription: { color: APP_COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  heroCard: { overflow: "hidden", padding: 20, borderRadius: 26, backgroundColor: "#7F1D1D" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.13)" },
  levelBadgeText: { color: "#FEE2E2", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  heroIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.12)" },
  heroTitle: { marginTop: 13, color: "#fff", fontSize: 25, fontWeight: "900" },
  heroSubtitle: { marginTop: 5, color: "#FECACA", fontSize: 13, lineHeight: 19, fontWeight: "700" },
  progressSection: { gap: 8, paddingHorizontal: 2 },
  progressLabels: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { color: APP_COLORS.primaryDark, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  progressCount: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "900" },
  progressTrack: { height: 8, overflow: "hidden", borderRadius: 99, backgroundColor: "#E7EAF0" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: APP_COLORS.primary },
  practiceCard: { padding: 19, borderRadius: 25, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: "#fff", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabelIcon: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#FFF1F2" },
  cardLabel: { color: APP_COLORS.primaryDark, fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  audioButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#FFF1F2" },
  promptLabel: { marginTop: 24, color: APP_COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, textAlign: "center" },
  meaningPrompt: { marginTop: 7, color: APP_COLORS.text, fontSize: 27, lineHeight: 36, fontWeight: "900", textAlign: "center" },
  pinyinHint: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F8FAFC" },
  pinyinHintActive: { backgroundColor: "#FFF1F2" },
  pinyinHintText: { color: APP_COLORS.primaryDark, fontSize: 12, fontWeight: "800" },
  answerInput: { minHeight: 64, marginTop: 18, paddingHorizontal: 16, borderWidth: 1.5, borderColor: APP_COLORS.border, borderRadius: 18, backgroundColor: "#FBFCFE", color: APP_COLORS.text, fontFamily: CHINESE_FONT_FAMILY, fontSize: 26, fontWeight: "700", textAlign: "center" },
  inputHint: { marginTop: 9, color: APP_COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  answerInputCorrect: { borderColor: "#34D399", backgroundColor: "#ECFDF5", color: "#047857" },
  answerInputIncorrect: { borderColor: "#F87171", backgroundColor: "#FEF2F2", color: "#B91C1C" },
  feedbackBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, padding: 11, borderRadius: 14 },
  feedbackCorrect: { backgroundColor: "#ECFDF5" },
  feedbackIncorrect: { backgroundColor: "#FEF2F2" },
  feedbackText: { fontSize: 13, fontWeight: "800" },
  feedbackTextCorrect: { color: "#047857" },
  feedbackTextIncorrect: { color: "#B91C1C" },
  primaryButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 17, paddingHorizontal: 16, borderRadius: 16, backgroundColor: APP_COLORS.primary },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  navigationRow: { flexDirection: "row", gap: 11 },
  navigationButton: { minHeight: 50, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 16, backgroundColor: "#fff" },
  navigationButtonDisabled: { opacity: 0.55 },
  navigationText: { color: APP_COLORS.text, fontSize: 13, fontWeight: "800" },
  navigationTextDisabled: { color: "#A8B0BC" },
  nextButton: { borderColor: APP_COLORS.primary, backgroundColor: APP_COLORS.primary },
  nextButtonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  completionCard: { alignItems: "center", padding: 24, borderRadius: 25, borderWidth: 1, borderColor: "#A7F3D0", backgroundColor: "#fff" },
  completionIcon: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#D1FAE5" },
  completionTitle: { marginTop: 16, color: APP_COLORS.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  completionDescription: { marginTop: 7, color: APP_COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 4, paddingHorizontal: 22, borderRadius: 14, backgroundColor: "#FFF1F2" },
  secondaryButtonText: { color: APP_COLORS.primaryDark, fontWeight: "900" },
  textButton: { marginTop: 16, padding: 8 },
  textButtonLabel: { color: APP_COLORS.primaryDark, fontSize: 13, fontWeight: "800" },
});
