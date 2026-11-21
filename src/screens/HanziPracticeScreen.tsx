import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

function normalizePinyin(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function pinyinOptionOrder(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

type PracticeMode = "writing" | "pinyin";

export function HanziPracticeScreen({ route, navigation }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("writing");
  const [selectedPinyin, setSelectedPinyin] = useState<string | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [correctIndexes, setCorrectIndexes] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLeavingList, setIsLeavingList] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnToListTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingReturnToList = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError(false);
      setLesson(null);
      setIndex(0);
      setAnswer("");
      setFeedback(null);
      setPracticeMode("writing");
      setSelectedPinyin(null);
      setShowMeaning(false);
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
      if (returnToListTimer.current) clearTimeout(returnToListTimer.current);
      void Speech.stop();
    };
  }, [route.params.lessonId]);

  useEffect(() => {
    navigation.setOptions({ headerShown: !isComplete && !isLeavingList });
  }, [isComplete, isLeavingList, navigation]);

  const words = lesson?.vocabularies ?? [];
  const word = words[index];
  const progress = words.length ? (index + 1) / words.length : 0;
  const pinyinOptions = useMemo(() => {
    const correct = word?.pinyin?.trim();
    if (!correct) return [];

    const distractors = Array.from(new Set(
      words
        .map((item) => item.pinyin?.trim())
        .filter((pinyin): pinyin is string => Boolean(pinyin))
        .filter((pinyin) => normalizePinyin(pinyin) !== normalizePinyin(correct)),
    )).slice(0, 3);

    return [correct, ...distractors].sort((left, right) =>
      pinyinOptionOrder(`${word?.chinese}:${left}`) - pinyinOptionOrder(`${word?.chinese}:${right}`),
    );
  }, [word, words]);

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

  function answerPinyin(value: string) {
    if (!word?.pinyin || feedback === true) return;

    setSelectedPinyin(value);
    const isCorrect = normalizePinyin(value) === normalizePinyin(word.pinyin);
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

  function changePracticeMode(nextMode: PracticeMode) {
    if (nextMode === practiceMode) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setPracticeMode(nextMode);
    setIndex(0);
    setAnswer("");
    setSelectedPinyin(null);
    setFeedback(null);
    setShowPinyin(false);
    setShowMeaning(false);
    setCorrectIndexes([]);
    setIsComplete(false);
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
    setSelectedPinyin(null);
    setFeedback(null);
    setShowPinyin(false);
    setShowMeaning(false);
  }

  function restart() {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setIndex(0);
    setAnswer("");
    setSelectedPinyin(null);
    setFeedback(null);
    setShowPinyin(false);
    setShowMeaning(false);
    setCorrectIndexes([]);
    setIsComplete(false);
  }

  function speakWord() {
    if (!word?.chinese) return;
    void Speech.stop();
    Speech.speak(word.chinese, { language: "zh-CN", rate: 0.85 });
  }

  function finishReturnToLessonList() {
    if (!pendingReturnToList.current) return;
    pendingReturnToList.current = false;
    if (returnToListTimer.current) {
      clearTimeout(returnToListTimer.current);
      returnToListTimer.current = null;
    }
    navigation.reset({
      index: 0,
      routes: [{
        name: "MainTabs",
        state: {
          index: 1,
          routes: [{ name: "Home" }, { name: "HSK30" }],
        },
      }],
    });
  }

  function returnToLessonList() {
    pendingReturnToList.current = true;
    setIsLeavingList(true);
    setIsComplete(false);
    if (returnToListTimer.current) clearTimeout(returnToListTimer.current);
    returnToListTimer.current = setTimeout(finishReturnToLessonList, 350);
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
      {isLeavingList ? (
        <View style={styles.returningState}>
          <ActivityIndicator size="small" color={APP_COLORS.primary} />
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isComplete ? (
          <>
            <View style={styles.modeSelector} accessibilityRole="tablist">
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: practiceMode === "writing" }}
                style={[styles.modeTab, practiceMode === "writing" && styles.modeTabActive]}
                onPress={() => changePracticeMode("writing")}
              >
                <Ionicons name="create-outline" size={17} color={practiceMode === "writing" ? APP_COLORS.primaryDark : APP_COLORS.muted} />
                <Text style={[styles.modeTabText, practiceMode === "writing" && styles.modeTabTextActive]}>Viết chữ Hán</Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: practiceMode === "pinyin" }}
                style={[styles.modeTab, practiceMode === "pinyin" && styles.modeTabActive]}
                onPress={() => changePracticeMode("pinyin")}
              >
                <Ionicons name="list-outline" size={17} color={practiceMode === "pinyin" ? APP_COLORS.primaryDark : APP_COLORS.muted} />
                <Text style={[styles.modeTabText, practiceMode === "pinyin" && styles.modeTabTextActive]}>Trắc nghiệm </Text>
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
                    <Ionicons name="language-outline" size={16} color={APP_COLORS.primaryDark} />
                  </View>
                  <Text style={styles.cardLabel}>{practiceMode === "writing" ? "VIẾT TỪ TIẾNG TRUNG" : "TRẮC NGHIỆM PINYIN"}</Text>
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

              {practiceMode === "writing" ? (
                <>
                  <Text style={styles.meaningPrompt}>{word?.meaningVi || "Chưa có nghĩa tiếng Việt"}</Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPinyin ? "Ẩn gợi ý pinyin" : "Hiện gợi ý pinyin"}
                    style={[styles.pinyinHint, showPinyin && styles.pinyinHintActive]}
                    onPress={() => setShowPinyin((current) => !current)}
                  >
                    <Ionicons name={showPinyin ? "eye-off-outline" : "eye-outline"} size={15} color={APP_COLORS.primaryDark} />
                    <Text style={styles.pinyinHintText}>{showPinyin ? word?.pinyin : "Hiện pinyin"}</Text>
                  </Pressable>

                  <View style={styles.answerInputWrap}>
                    <TextInput
                      value={answer}
                      onChangeText={updateAnswer}
                      onSubmitEditing={() => checkAnswer()}
                      returnKeyType="done"
                      autoCapitalize="none"
                      autoCorrect={false}
                      accessibilityLabel="Nhập chữ Hán"
                      style={[
                        styles.answerInput,
                        feedback === true && styles.answerInputCorrect,
                        feedback === false && styles.answerInputIncorrect,
                      ]}
                    />
                    {!answer ? (
                      <View pointerEvents="none" style={styles.answerPlaceholderWrap}>
                        <Text accessible={false} style={styles.answerPlaceholder}>Nhập chữ Hán...</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : (
                <View style={styles.quizContent}>
                  <Text style={styles.quizHanzi}>{word?.chinese}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showMeaning ? "Ẩn nghĩa tiếng Việt" : "Hiện nghĩa tiếng Việt"}
                    style={[styles.pinyinHint, showMeaning && styles.pinyinHintActive]}
                    onPress={() => setShowMeaning((visible) => !visible)}
                  >
                    <Ionicons name={showMeaning ? "eye-off-outline" : "eye-outline"} size={15} color={APP_COLORS.primaryDark} />
                    <Text style={styles.pinyinHintText}>
                      {showMeaning ? word?.meaningVi || "Chưa có nghĩa tiếng Việt" : "Hiện nghĩa"}
                    </Text>
                  </Pressable>

                  {pinyinOptions.length ? (
                    <View style={styles.pinyinOptions}>
                      {pinyinOptions.map((option, optionIndex) => {
                        const isSelected = selectedPinyin === option;
                        const isCorrectOption = normalizePinyin(option) === normalizePinyin(word?.pinyin ?? "");
                        return (
                          <Pressable
                            key={`${option}-${optionIndex}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Chọn pinyin ${option}`}
                            disabled={feedback === true}
                            style={[
                              styles.pinyinOption,
                              feedback === false && isCorrectOption && styles.pinyinOptionCorrect,
                              feedback === true && isCorrectOption && styles.pinyinOptionCorrect,
                              feedback === false && isSelected && !isCorrectOption && styles.pinyinOptionIncorrect,
                            ]}
                            onPress={() => answerPinyin(option)}
                          >
                            <Text style={[
                              styles.pinyinOptionText,
                              feedback === false && isCorrectOption && styles.pinyinOptionTextCorrect,
                              feedback === true && isCorrectOption && styles.pinyinOptionTextCorrect,
                              feedback === false && isSelected && !isCorrectOption && styles.pinyinOptionTextIncorrect,
                            ]}>{option}</Text>
                            {feedback !== null && isCorrectOption ? (
                              <Ionicons name="checkmark-circle" size={19} color="#047857" style={styles.pinyinOptionStatus} />
                            ) : feedback === false && isSelected ? (
                              <Ionicons name="close-circle" size={19} color="#B91C1C" style={styles.pinyinOptionStatus} />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.inputHint}>Từ này chưa có pinyin để tạo câu hỏi.</Text>
                  )}
                </View>
              )}

            </View>

          </>
        ) : null}
      </ScrollView>
      )}

      <Modal
        transparent
        visible={isComplete}
        animationType="fade"
        onRequestClose={returnToLessonList}
        onDismiss={finishReturnToLessonList}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.completionCard}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-done" size={30} color="#047857" />
            </View>
            <Text style={styles.completionTitle}>Hoàn thành bài luyện tập!</Text>
            <Text style={styles.completionDescription}>
              {practiceMode === "writing" ? "Bạn đã viết đúng" : "Bạn đã chọn đúng"} {correctIndexes.length}/{words.length} từ trong bài.
            </Text>
            <Pressable style={styles.textButton} onPress={returnToLessonList}>
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
  modeTabActive: { backgroundColor: "#FFF1F2" },
  modeTabText: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "800" },
  modeTabTextActive: { color: APP_COLORS.primaryDark },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  returningState: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
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
  quizContent: { alignItems: "stretch", marginTop: 1 },
  quizHanzi: { marginTop: 10, color: APP_COLORS.text, fontFamily: CHINESE_FONT_FAMILY, fontSize: 56, lineHeight: 72, fontWeight: "700", textAlign: "center" },
  quizInstruction: { marginTop: 25, marginBottom: 12, color: APP_COLORS.text, fontSize: 14, fontWeight: "900", textAlign: "center" },
  pinyinOptions: { marginTop: 25, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 },
  pinyinOption: { width: "48%", minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 9, borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 15, backgroundColor: "#FBFCFE" },
  pinyinOptionCorrect: { borderColor: "#6EE7B7", backgroundColor: "#ECFDF5" },
  pinyinOptionIncorrect: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  pinyinOptionText: { flex: 1, color: APP_COLORS.text, fontSize: 16, fontWeight: "800", textAlign: "center" },
  pinyinOptionStatus: { position: "absolute", right: 10 },
  pinyinOptionTextCorrect: { color: "#047857" },
  pinyinOptionTextIncorrect: { color: "#B91C1C" },
  answerInputWrap: { position: "relative", marginTop: 18 },
  answerPlaceholderWrap: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" },
  answerPlaceholder: { color: "#94A3B8", fontSize: 16, fontWeight: "500", letterSpacing: 0.2 },
  answerInput: { minHeight: 54, paddingHorizontal: 16, borderWidth: 1.5, borderColor: APP_COLORS.border, borderRadius: 18, backgroundColor: "#FBFCFE", color: APP_COLORS.text, fontFamily: CHINESE_FONT_FAMILY, fontSize: 26, fontWeight: "700", textAlign: "center" },
  inputHint: { marginTop: 9, color: APP_COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  answerInputCorrect: { borderColor: "#34D399", backgroundColor: "#ECFDF5", color: "#047857" },
  answerInputIncorrect: { borderColor: "#F87171", backgroundColor: "#FEF2F2", color: "#B91C1C" },
  feedbackBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, padding: 11, borderRadius: 14 },
  feedbackCorrect: { backgroundColor: "#ECFDF5" },
  feedbackIncorrect: { backgroundColor: "#FEF2F2" },
  feedbackText: { fontSize: 13, fontWeight: "800" },
  feedbackTextCorrect: { color: "#047857" },
  feedbackTextIncorrect: { color: "#B91C1C" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: APP_COLORS.background },
  primaryButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 17, paddingHorizontal: 16, borderRadius: 16, backgroundColor: APP_COLORS.primary },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  completionCard: { width: "100%", maxWidth: 360, alignItems: "center", padding: 24, borderRadius: 25, borderWidth: 1, borderColor: APP_COLORS.primary, backgroundColor: "#fff" },
  completionIcon: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#D1FAE5" },
  completionTitle: { marginTop: 16, color: APP_COLORS.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  completionDescription: { marginTop: 7, color: APP_COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: "center" },
  secondaryButton: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: 4, paddingHorizontal: 22, borderRadius: 14, backgroundColor: "#FFF1F2" },
  secondaryButtonText: { color: APP_COLORS.primaryDark, fontWeight: "900" },
  textButton: { marginTop: 16, padding: 8 },
  textButtonLabel: { color: APP_COLORS.primaryDark, fontSize: 13, fontWeight: "800" },
});
