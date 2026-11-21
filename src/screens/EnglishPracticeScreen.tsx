import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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
type PracticeMode = "typing" | "multipleChoice";

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’‘]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
}

function shuffle<T,>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function EnglishPracticeScreen({ route, navigation }: Props) {
  const lesson = findEnglishLesson(route.params.lessonId);
  const words = lesson?.words ?? [];
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("typing");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
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
    setPracticeMode("typing");
    setSelectedOption(null);
    setShowPronunciation(false);
    setCorrectIndexes([]);
    setIsComplete(false);

    return () => {
      if (autoCheckTimer.current) clearTimeout(autoCheckTimer.current);
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      void Speech.stop();
    };
  }, [route.params.lessonId]);

  useEffect(() => {
    navigation.setOptions({ headerShown: !isComplete });
  }, [isComplete, navigation]);

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
    setSelectedOption(null);
    setFeedback(null);
    setShowPronunciation(false);
  }

  function changePracticeMode(nextMode: PracticeMode) {
    if (nextMode === practiceMode) return;
    if (autoCheckTimer.current) {
      clearTimeout(autoCheckTimer.current);
      autoCheckTimer.current = null;
    }
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setPracticeMode(nextMode);
    setIndex(0);
    setAnswer("");
    setSelectedOption(null);
    setFeedback(null);
    setShowPronunciation(false);
    setCorrectIndexes([]);
    setIsComplete(false);
  }

  function chooseOption(value: string) {
    if (!word || feedback === true) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setSelectedOption(value);
    const isCorrect = normalizeAnswer(value) === normalizeAnswer(word.word);
    setFeedback(isCorrect);
    if (isCorrect) {
      setCorrectIndexes((current) => current.includes(index) ? current : [...current, index]);
      const answeredIndex = index;
      autoAdvanceTimer.current = setTimeout(() => {
        autoAdvanceTimer.current = null;
        moveTo(answeredIndex + 1);
      }, 650);
    }
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
    setSelectedOption(null);
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

  const usPronunciations = word?.pronunciation_ipa?.us ?? [];
  const progress = words.length ? (index + 1) / words.length : 0;
  const wordOptions = useMemo(() => {
    const correctWord = words[index]?.word?.trim();
    if (!correctWord) return [];
    const distractors = Array.from(new Map(
      words.map((item) => [normalizeAnswer(item.word), item.word.trim()]),
    ).entries())
      .filter(([normalized]) => normalized !== normalizeAnswer(correctWord))
      .map(([, candidate]) => candidate);
    return shuffle([correctWord, ...shuffle(distractors).slice(0, 3)]);
  }, [index, words]);

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

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isComplete ? (
          <>
            <View style={styles.modeSelector} accessibilityRole="tablist">
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: practiceMode === "typing" }}
                style={[styles.modeTab, practiceMode === "typing" && styles.modeTabActive]}
                onPress={() => changePracticeMode("typing")}
              >
                <Ionicons name="create-outline" size={17} color={practiceMode === "typing" ? ENGLISH_ACCENT : APP_COLORS.muted} />
                <Text style={[styles.modeTabText, practiceMode === "typing" && styles.modeTabTextActive]}>Điền từ</Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: practiceMode === "multipleChoice" }}
                style={[styles.modeTab, practiceMode === "multipleChoice" && styles.modeTabActive]}
                onPress={() => changePracticeMode("multipleChoice")}
              >
                <Ionicons name="list-outline" size={17} color={practiceMode === "multipleChoice" ? ENGLISH_ACCENT : APP_COLORS.muted} />
                <Text style={[styles.modeTabText, practiceMode === "multipleChoice" && styles.modeTabTextActive]}>Trắc nghiệm</Text>
              </Pressable>
            </View>

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
                  <Text style={styles.cardLabel}>
                    {practiceMode === "typing" ? "NHẬP TỪ TIẾNG ANH" : "TRẮC NGHIỆM TỪ VỰNG"}
                  </Text>
                </View>
                {practiceMode === "typing" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Nghe phát âm tiếng Anh"
                    style={styles.audioButton}
                    onPress={speakWord}
                  >
                    <Ionicons name="volume-high" size={19} color={ENGLISH_ACCENT} />
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.meaningPrompt}>{word?.meaning_vi || "Chưa có nghĩa tiếng Việt"}</Text>
              {word?.part_of_speech?.length ? (
                <Text style={styles.partOfSpeech}>{word.part_of_speech.join(" · ")}</Text>
              ) : null}

              {practiceMode === "typing" ? (
                <>
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
                        : "Hiện phiên âm"}
                    </Text>
                  </Pressable>

                  <View style={styles.answerInputWrap}>
                    <TextInput
                      value={answer}
                      onChangeText={updateAnswer}
                      onSubmitEditing={() => checkAnswer()}
                      returnKeyType="done"
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Nhập từ tiếng Anh"
                      style={[
                        styles.answerInput,
                        feedback === true && styles.answerInputCorrect,
                        feedback === false && styles.answerInputIncorrect,
                      ]}
                    />
                    {!answer ? (
                      <View pointerEvents="none" style={styles.answerPlaceholderWrap}>
                        <Text accessible={false} style={styles.answerPlaceholder}>Nhập từ tiếng Anh...</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : (
                <View style={styles.choiceOptions}>
                  {wordOptions.map((option, optionIndex) => {
                    const isSelected = selectedOption === option;
                    const isCorrectOption = normalizeAnswer(option) === normalizeAnswer(word?.word ?? "");
                    return (
                      <Pressable
                        key={`${option}-${optionIndex}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Chọn từ ${option}`}
                        accessibilityState={{ selected: isSelected, disabled: feedback === true }}
                        disabled={feedback === true}
                        style={[
                          styles.choiceOption,
                          feedback !== null && isCorrectOption && styles.choiceOptionCorrect,
                          feedback === false && isSelected && !isCorrectOption && styles.choiceOptionIncorrect,
                        ]}
                        onPress={() => chooseOption(option)}
                      >
                        <Text style={[
                          styles.choiceOptionText,
                          feedback !== null && isCorrectOption && styles.choiceOptionTextCorrect,
                          feedback === false && isSelected && !isCorrectOption && styles.choiceOptionTextIncorrect,
                        ]}>{option}</Text>
                        {feedback !== null && isCorrectOption ? (
                          <Ionicons name="checkmark-circle" size={19} color="#047857" />
                        ) : feedback === false && isSelected ? (
                          <Ionicons name="close-circle" size={19} color="#B91C1C" />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}

            </View>

          </>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={isComplete}
        animationType="fade"
        onRequestClose={() => navigation.goBack()}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.completionCard}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-done" size={30} color="#047857" />
            </View>
            <Text style={styles.completionTitle}>Hoàn thành bài luyện tập!</Text>
            <Text style={styles.completionDescription}>
              Bạn đã trả lời đúng {correctIndexes.length}/{words.length} từ trong bài.
            </Text>
            <Pressable style={styles.textButton} onPress={() => navigation.goBack()}>
              <Text style={styles.textButtonLabel}>Về danh sách bài học</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 18, gap: 16, paddingBottom: 36 },
  modeSelector: { flexDirection: "row", gap: 5, padding: 5, borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 17, backgroundColor: "#fff" },
  modeTab: { minHeight: 43, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 8, borderRadius: 12 },
  modeTabActive: { backgroundColor: "#EFF6FF" },
  modeTabText: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "800" },
  modeTabTextActive: { color: ENGLISH_ACCENT },
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
  choiceOptions: { marginTop: 23, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 },
  choiceOption: { width: "48%", minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 15, backgroundColor: "#FBFCFE" },
  choiceOptionCorrect: { borderColor: "#6EE7B7", backgroundColor: "#ECFDF5" },
  choiceOptionIncorrect: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  choiceOptionText: { flex: 1, color: APP_COLORS.text, fontSize: 14, fontWeight: "800", textAlign: "center" },
  choiceOptionTextCorrect: { color: "#047857" },
  choiceOptionTextIncorrect: { color: "#B91C1C" },
  answerInputWrap: { position: "relative", marginTop: 18 },
  answerPlaceholderWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  answerPlaceholder: { color: "#94A3B8", fontFamily: "serif", fontSize: 16, fontWeight: "500", letterSpacing: 0.2 },
  answerInput: { minHeight: 54, paddingHorizontal: 16, borderWidth: 1.5, borderColor: APP_COLORS.border, borderRadius: 18, backgroundColor: "#FBFCFE", color: APP_COLORS.text, fontFamily: "serif", fontSize: 22, fontWeight: "700", textAlign: "center" },
  answerInputCorrect: { borderColor: "#34D399", backgroundColor: "#ECFDF5", color: "#047857" },
  answerInputIncorrect: { borderColor: "#F87171", backgroundColor: "#FEF2F2", color: "#B91C1C" },
  inputHint: { marginTop: 9, color: APP_COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  feedbackBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, padding: 11, borderRadius: 14 },
  feedbackCorrect: { backgroundColor: "#ECFDF5" },
  feedbackIncorrect: { backgroundColor: "#FEF2F2" },
  feedbackText: { fontSize: 13, fontWeight: "800" },
  feedbackTextCorrect: { color: "#047857" },
  feedbackTextIncorrect: { color: "#B91C1C" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: APP_COLORS.background },
  completionCard: { width: "100%", maxWidth: 360, alignItems: "center", padding: 24, borderRadius: 25, borderWidth: 1, borderColor: ENGLISH_ACCENT, backgroundColor: "#fff" },
  completionIcon: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#D1FAE5" },
  completionTitle: { marginTop: 16, color: APP_COLORS.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  completionDescription: { marginTop: 7, color: APP_COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  textButton: { marginTop: 16, padding: 8 },
  textButtonLabel: { color: APP_COLORS.primaryDark, fontSize: 13, fontWeight: "800" },
});
