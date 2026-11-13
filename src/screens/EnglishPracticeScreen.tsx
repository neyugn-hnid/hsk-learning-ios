import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
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
import { findEnglishLesson } from "@/data/english";
import type { RootStackParamList } from "@/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "EnglishPractice">;

const ENGLISH_ACCENT = "#2563EB";

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’‘]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
}

export function EnglishPracticeScreen({ route, navigation }: Props) {
  const lesson = findEnglishLesson(route.params.lessonId);
  const words = lesson?.words ?? [];
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [correctIndexes, setCorrectIndexes] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const autoCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const word = words[index];

  useEffect(() => {
    setIndex(0);
    setAnswer("");
    setFeedback(null);
    setShowPronunciation(false);
    setCorrectIndexes([]);
    setIsComplete(false);

    return () => {
      if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      void Speech.stop();
    };
  }, [route.params.lessonId]);

  function moveTo(nextIndex: number) {
    if (autoCheckTimer.current) {
      clearTimeout(autoCheckTimer.current);
      autoCheckTimer.current = null;
    }
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    if (!words.length) return;
    if (nextIndex >= words.length) {
      setIsComplete(true);
      return;
    }
    setIndex(Math.max(0, nextIndex));
    setAnswer("");
    setFeedback(null);
    setShowPronunciation(false);
  }

  function checkAnswer(value = answer) {
    if (autoCheckTimer.current) {
      clearTimeout(autoCheckTimer.current);
      autoCheckTimer.current = null;
    }
    if (!word || !value.trim() || feedback === true) return;
    const isCorrect = normalizeAnswer(value) === normalizeAnswer(word.word);
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
    if (autoCheckTimer.current) {
      clearTimeout(autoCheckTimer.current);
      autoCheckTimer.current = null;
    }
    if (value.trim() && normalizeAnswer(value) === normalizeAnswer(word?.word ?? "")) {
      const answerToCheck = value;
      autoCheckTimer.current = setTimeout(() => {
        autoCheckTimer.current = null;
        checkAnswer(answerToCheck);
      }, 450);
    }
  }

  function restart() {
    if (autoCheckTimer.current) {
      clearTimeout(autoCheckTimer.current);
      autoCheckTimer.current = null;
    }
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setIndex(0);
    setAnswer("");
    setFeedback(null);
    setShowPronunciation(false);
    setCorrectIndexes([]);
    setIsComplete(false);
  }

  function speakWord() {
    if (!word?.word) return;
    void Speech.stop();
    Speech.speak(word.word, { language: "en-US", rate: 0.88 });
  }

  if (!lesson) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={34} color={ENGLISH_ACCENT} />
        <Text style={styles.emptyTitle}>Không tìm thấy bài học</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  if (!words.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="book-outline" size={34} color={ENGLISH_ACCENT} />
        <Text style={styles.emptyTitle}>Bài này chưa có từ vựng</Text>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const usPronunciations = word?.pronunciation_ipa?.us ?? [];
  const progress = words.length ? (index + 1) / words.length : 0;

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
                    <Ionicons name="language-outline" size={16} color={ENGLISH_ACCENT} />
                  </View>
                  <Text style={styles.cardLabel}>NHẬP TỪ TIẾNG ANH</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nghe phát âm tiếng Anh"
                  style={styles.audioButton}
                  onPress={speakWord}
                >
                  <Ionicons name="volume-high" size={19} color={ENGLISH_ACCENT} />
                </Pressable>
              </View>

              <Text style={styles.promptLabel}>TỪ NÀY CÓ NGHĨA LÀ</Text>
              <Text style={styles.meaningPrompt}>{word?.meaning_vi || "Chưa có nghĩa tiếng Việt"}</Text>
              {word?.part_of_speech?.length ? (
                <Text style={styles.partOfSpeech}>{word.part_of_speech.join(" · ")}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPronunciation ? "Ẩn gợi ý phiên âm" : "Hiện gợi ý phiên âm"}
                style={[styles.pronunciationHint, showPronunciation && styles.pronunciationHintActive]}
                onPress={() => setShowPronunciation((current) => !current)}
              >
                <Ionicons name={showPronunciation ? "eye-off-outline" : "eye-outline"} size={15} color={ENGLISH_ACCENT} />
                <Text style={styles.pronunciationHintText}>
                  {showPronunciation
                    ? usPronunciations.join(" · ") || "Chưa có phiên âm"
                    : "Hiện gợi ý phiên âm"}
                </Text>
              </Pressable>

              <TextInput
                value={answer}
                onChangeText={updateAnswer}
                onSubmitEditing={() => checkAnswer()}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Type the English word..."
                placeholderTextColor="#94A3B8"
                accessibilityLabel="Nhập từ tiếng Anh"
                style={[
                  styles.answerInput,
                  feedback === true && styles.answerInputCorrect,
                  feedback === false && styles.answerInputIncorrect,
                ]}
              />
              <Text style={styles.inputHint}>Nhập đúng từ để tự kiểm tra và chuyển sang từ tiếp theo.</Text>

              {feedback !== null ? (
                <View style={[styles.feedbackBox, feedback ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                  <Ionicons
                    name={feedback ? "checkmark-circle" : "close-circle"}
                    size={19}
                    color={feedback ? "#047857" : "#B91C1C"}
                  />
                  <Text style={[styles.feedbackText, feedback ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect]}>
                    {feedback ? `Chính xác! ${word?.word}` : "Chưa đúng, thử lại nhé."}
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
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12, backgroundColor: APP_COLORS.background },
  emptyTitle: { color: APP_COLORS.text, fontSize: 19, fontWeight: "900", textAlign: "center" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 4, paddingHorizontal: 22, borderRadius: 14, backgroundColor: "#EFF6FF" },
  secondaryButtonText: { color: ENGLISH_ACCENT, fontWeight: "900" },
  heroCard: { overflow: "hidden", padding: 20, borderRadius: 26, backgroundColor: "#172554" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" },
  levelBadgeText: { color: "#DBEAFE", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  heroIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.12)" },
  heroTitle: { marginTop: 13, color: "#fff", fontSize: 25, fontWeight: "900" },
  heroSubtitle: { marginTop: 5, color: "#BFDBFE", fontSize: 13, lineHeight: 19, fontWeight: "700" },
  progressSection: { gap: 8, paddingHorizontal: 2 },
  progressLabels: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { color: ENGLISH_ACCENT, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  progressCount: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "900" },
  progressTrack: { height: 8, overflow: "hidden", borderRadius: 99, backgroundColor: "#E7EAF0" },
  progressFill: { height: "100%", borderRadius: 99, backgroundColor: ENGLISH_ACCENT },
  practiceCard: { padding: 19, borderRadius: 25, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: "#fff", shadowColor: "#0F172A", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabelIcon: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#EFF6FF" },
  cardLabel: { color: ENGLISH_ACCENT, fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  audioButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#EFF6FF" },
  promptLabel: { marginTop: 24, color: APP_COLORS.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, textAlign: "center" },
  meaningPrompt: { marginTop: 7, color: APP_COLORS.text, fontSize: 25, lineHeight: 34, fontWeight: "900", textAlign: "center" },
  partOfSpeech: { marginTop: 6, color: APP_COLORS.muted, fontSize: 12, fontWeight: "700", textAlign: "center" },
  pronunciationHint: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#F8FAFC" },
  pronunciationHintActive: { backgroundColor: "#EFF6FF" },
  pronunciationHintText: { color: ENGLISH_ACCENT, fontSize: 12, fontWeight: "800" },
  answerInput: { minHeight: 60, marginTop: 18, paddingHorizontal: 16, borderWidth: 1.5, borderColor: APP_COLORS.border, borderRadius: 18, backgroundColor: "#FBFCFE", color: APP_COLORS.text, fontSize: 22, fontWeight: "700", textAlign: "center" },
  answerInputCorrect: { borderColor: "#34D399", backgroundColor: "#ECFDF5", color: "#047857" },
  answerInputIncorrect: { borderColor: "#F87171", backgroundColor: "#FEF2F2", color: "#B91C1C" },
  inputHint: { marginTop: 9, color: APP_COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  feedbackBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, padding: 11, borderRadius: 14 },
  feedbackCorrect: { backgroundColor: "#ECFDF5" },
  feedbackIncorrect: { backgroundColor: "#FEF2F2" },
  feedbackText: { fontSize: 13, fontWeight: "800" },
  feedbackTextCorrect: { color: "#047857" },
  feedbackTextIncorrect: { color: "#B91C1C" },
  navigationRow: { flexDirection: "row", gap: 11 },
  navigationButton: { minHeight: 50, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 16, backgroundColor: "#fff" },
  navigationButtonDisabled: { opacity: 0.55 },
  navigationText: { color: APP_COLORS.text, fontSize: 13, fontWeight: "800" },
  navigationTextDisabled: { color: "#A8B0BC" },
  nextButton: { borderColor: ENGLISH_ACCENT, backgroundColor: ENGLISH_ACCENT },
  nextButtonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  completionCard: { alignItems: "center", padding: 24, borderRadius: 25, borderWidth: 1, borderColor: "#A7F3D0", backgroundColor: "#fff" },
  completionIcon: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#D1FAE5" },
  completionTitle: { marginTop: 16, color: APP_COLORS.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  completionDescription: { marginTop: 7, color: APP_COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  primaryButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 17, paddingHorizontal: 16, borderRadius: 16, backgroundColor: ENGLISH_ACCENT },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  textButton: { marginTop: 16, padding: 8 },
  textButtonLabel: { color: ENGLISH_ACCENT, fontSize: 13, fontWeight: "800" },
});
