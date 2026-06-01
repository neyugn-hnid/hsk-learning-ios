import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from "react-native";
import { APP_COLORS } from "@/config";
import { PronunciationMicButton, PronunciationResultPanel, usePronunciationRecorder } from "@/components/PronunciationRecorder";
import { fetchLessonDetail } from "@/lib/api";
import { RootStackParamList } from "@/navigation/AppNavigator";
import type { LessonDetail } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "StudyDetail">;
type QuizMode = "meaning" | "pinyin" | "recognition";
type PracticeQuestion = {
  type: "MEANING" | "PINYIN" | "CHAR_RECOGNITION" | "HANZI_WRITING";
  question: string;
  options: string[];
  answer: string;
  promptPinyin?: string | null;
};

const CORRECT_SOUND_URI =
  "data:audio/wav;base64,UklGRiQPAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAPAAAAABkAXwDBACYBcgGKAVsB3AAVABn/B/4J/Un87/sW/Mv8Bv6s/40BcQMWBT4GtQZcBi0FPgO+APb9Ovvk+Ej3pfYh9774Wfuu/l0C9wUHCSULAQxwC3MJNQYPAnr9/vgr9X/yWvHy8UP0GfgK/YUC5weGDMwPRhG3EB4OuwkGBKf9W/fo8f3tH+yX7GnvT/TC+gMCOwmJDyUUdRYiFiQTxg2eBn7+WPYo79DpAech5zzqBfDb99YA7AkEEiEYfRugG3UYTRLTCQAA+/X07AfmE+Ke4crkRetb9AD/9QnuE7QbTiAiIQQeQxecDSsCR/ZW66/iYt0g3CLfG+ZJ8ID8Uwk+Fc8e2iSYJsIjnhz0Ef4EP/dX6tPf/ti31lLZlOCu61v5AwjsFWghEinyK58pTyLRFnQI5vj86YDd99Rx0WzT99rj5sf13wVHFSsiBSvILgMt7CVZGqgLl/sL7Nvel9VW0ZrSPNlz5O3y8QKdEhYgxCmBLr8tkye6HHwOiP6/7gHh7da00fXRqNcf4iDwAADgD+EdWCgLLkwuEyn/HkEReAGE8UbjbdhB0n/RPNbq32PtD/0TDY0bxCZmLaouaSolIfUTaQRY9KflFNr90jjR+9TV3bnqIfo5Ch0ZCSWULNoulCwJJR0ZOQoh+rnq1d371DjR/dIU2qflWPRpBPUTJSFpKqouZi3EJo0bEw0P/WPt6t881n/RQdJt2EbjhPF4AUER/x4TKUwuCy5YKOEd4A8AACDwH+Ko1/XRtNHt1gHhv+6I/nwOuhyTJ78tgS7EKRYgnRLxAu3yc+Q82ZrSVtGX1dveC+yX+6gLWRrsJQMtyC4FKysiRxXfBcf14+b32mzTJtFr1Nfca+mr+MgI3BceJBos4C4aLB4k3BfICKv4a+nX3GvUJtFs0/fa4+bH9d8FRxUrIgUryC4DLewlWRqoC5f7C+zb3pfVVtGa0jzZc+Tt8vECnRIWIMQpgS6/LZMnuhx8Doj+v+4B4e3WtNH10ajXH+Ig8AAA4A/hHVgoCy5MLhMp/x5BEXgBhPFG423YQdJ/0TzW6t9j7Q/9Ew2NG8QmZi2qLmkqJSH1E2kEWPSn5RTa/dI40fvU1d256iH6OQodGQkllCzaLpUrKSOVFlUHOPck6OLb5tMg0ebT4tsk6Dj3VQeVFikjlSvaLpQsCSUdGTkKIfq56tXd+9Q40f3SFNqn5Vj0aQT1EyUhaSqqLmYtxCaNGxMND/1j7erfPNZ/0UHSbdhG44TxeAFBEf8eEylMLgsuWCjhHeAPAAAg8B/iqNf10bTR7dYB4b/uiP58Drockye/LYEuxCkWIJ0S8QLt8nPkPNma0lbRl9Xb3gvsl/uoC1ka7CUDLcguBSsrIkcV3wXH9ePm99ps0ybRa9TX3Gvpq/jICNwXHiQaLOAuGiweJNwXyAir+Gvp19xr1CbRbNMy2zPn+PW6BZ0U4yAjKXEseyqNI4kYyArz+8rt9+HU2UvWtdfW3eXnpPSJAvAPRhs9I/ImBiamIIUXxAvR/jPyZuen39XbUdz84Djp/vMAAM8LCRaBHWEhRiFEHeQVFAwFAQv2buxJ5WnhMeGY5CXrBfQg/kEIOBH9F88bShxyGa4TuQuQAk35BPGs6vfmRuac6KPtsvTr/E0F3wzAEkoWIhc/FesQuQpvA/H7HfXA727sfuv77KfwA/Zh/PoCCAnYDeMQ3BG3EKgmkA/L9sPh49MDxzPCn8Sf07/eB/EsBvAVSCakLigzrC+8J4wYwA07/svvI+N72H/aR9hb4b/pJ/UQABQM7BawGOwfoBswFGwQVAgAAHv6k/Lf7Zvup+2j8fP21/uf/5wCdAfoBAAK+AU4BzQBZAAkA7P8=";

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function StudyDetailScreen({ route }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"vocabulary" | "translation" | "hanzi" | "quiz">("vocabulary");
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [quizResponse, setQuizResponse] = useState("");
  const [translationAnswer, setTranslationAnswer] = useState("");
  const [checkedTranslation, setCheckedTranslation] = useState(false);
  const [hanziAnswer, setHanziAnswer] = useState("");
  const [checkedHanzi, setCheckedHanzi] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("meaning");

  useEffect(() => {
    void load();
  }, [route.params.lessonId]);

  useEffect(() => {
    setIndex(0);
    setShowMeaning(false);
    setQuizResponse("");
    setTranslationAnswer("");
    setCheckedTranslation(false);
    setHanziAnswer("");
    setCheckedHanzi(false);
  }, [tab]);

  useEffect(() => {
    setIndex(0);
    setQuizResponse("");
  }, [quizMode]);

  async function load() {
    try {
      setLoading(true);
      const response = await fetchLessonDetail(route.params.lessonId);
      setLesson(response.lesson);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }

  const shuffledVocabularies = useMemo(
    () => shuffleItems(lesson?.vocabularies ?? []),
    [lesson?.id],
  );
  const shuffledQuizzes = useMemo(
    () => shuffleItems(lesson?.quizzes ?? []),
    [lesson?.id],
  );
  const generatedQuizzes = useMemo<PracticeQuestion[]>(() => {
    return shuffledVocabularies.map((vocab) => {
      const distractorValues = shuffledVocabularies
        .filter((item) => item.chinese !== vocab.chinese)
        .map((item) => {
          if (quizMode === "pinyin") return item.pinyin;
          if (quizMode === "recognition") return item.chinese;
          return item.meaningVi;
        })
        .filter(Boolean);
      const answer =
        quizMode === "pinyin"
          ? vocab.pinyin
          : quizMode === "recognition"
            ? vocab.chinese
            : vocab.meaningVi;
      const options = shuffleItems(Array.from(new Set([answer, ...distractorValues])).slice(0, 4));

      return {
        type:
          quizMode === "pinyin"
            ? "PINYIN"
            : quizMode === "recognition"
              ? "CHAR_RECOGNITION"
              : "MEANING",
        question:
          quizMode === "pinyin"
            ? `"${vocab.chinese}" đọc pinyin là gì?`
            : quizMode === "recognition"
              ? `Chữ Hán nào có nghĩa "${vocab.meaningVi}"?`
              : `"${vocab.chinese}" nghĩa là gì?`,
        options,
        answer,
        promptPinyin: vocab.pinyin,
      };
    });
  }, [quizMode, shuffledVocabularies]);
  const practiceQuestions: PracticeQuestion[] = shuffledQuizzes.length && quizMode === "meaning" ? shuffledQuizzes : generatedQuizzes;
  const currentVocab = shuffledVocabularies[index];
  const currentQuiz = practiceQuestions[index];
  const isWritingQuiz = currentQuiz?.type === "HANZI_WRITING";
  const quizSpeechText =
    currentQuiz?.promptPinyin ||
    (currentQuiz?.type === "CHAR_RECOGNITION" ? currentQuiz.answer : null) ||
    "";
  const hasQuizAnswer = quizResponse.trim().length > 0;
  const quizCorrect = hasQuizAnswer && quizResponse.trim() === (currentQuiz?.answer || "").trim();
  const normalizedUserMeaning = translationAnswer.trim().toLowerCase();
  const normalizedCorrectMeaning = (currentVocab?.meaningVi || "").trim().toLowerCase();
  const translationCorrect =
    checkedTranslation &&
    normalizedUserMeaning.length > 0 &&
    (normalizedUserMeaning === normalizedCorrectMeaning ||
      normalizedCorrectMeaning.includes(normalizedUserMeaning) ||
      normalizedUserMeaning.includes(normalizedCorrectMeaning));
  const normalizedUserHanzi = hanziAnswer.trim();
  const normalizedCorrectHanzi = (currentVocab?.chinese || "").trim();
  const hanziCorrect =
    checkedHanzi &&
    normalizedUserHanzi.length > 0 &&
    normalizedUserHanzi === normalizedCorrectHanzi;
  const pronunciationTargetText = currentVocab?.chinese || "";
  const quizPronunciationTargetText = currentQuiz?.answer || "";
  const pronunciation = usePronunciationRecorder(pronunciationTargetText);
  const quizPronunciation = usePronunciationRecorder(quizPronunciationTargetText);

  const activeCount = useMemo(() => {
    if (!lesson) return 0;
    if (tab === "vocabulary" || tab === "translation" || tab === "hanzi") {
      return shuffledVocabularies.length;
    }
    return practiceQuestions.length;
  }, [lesson, practiceQuestions.length, shuffledVocabularies.length, tab]);

  function next() {
    if (!activeCount) return;
    setIndex((prev) => (prev + 1) % activeCount);
    setShowMeaning(false);
    setQuizResponse("");
  }

  function prev() {
    if (!activeCount) return;
    setIndex((prev) => (prev - 1 + activeCount) % activeCount);
    setShowMeaning(false);
    setQuizResponse("");
  }

  function speakChinese(text?: string | null) {
    if (!text) return;
    void Speech.stop();
    Speech.speak(text, {
      language: "zh-CN",
      rate: 0.9,
    });
  }

  async function playCorrectSound() {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: CORRECT_SOUND_URI });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
        }
      });
      await sound.playAsync();
    } catch {
      // Feedback audio is best-effort so quiz interaction is never blocked.
    }
  }

  function answerQuiz(option: string) {
    setQuizResponse(option);
    if (!currentQuiz) return;

    if (option === currentQuiz.answer) {
      void playCorrectSound();
      return;
    }

    Vibration.vibrate(120);
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
      <View style={styles.tabRow}>
        {[
          { key: "vocabulary", label: "Từ Vựng" },
          { key: "translation", label: "Dịch Nghĩa" },
          { key: "hanzi", label: "Chữ Hán" },
          { key: "quiz", label: "Luyện Tập" },
        ].map((item) => (
          <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => setTab(item.key as typeof tab)}>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {(tab === "vocabulary" || tab === "translation" || tab === "hanzi") && currentVocab ? (
        <View style={{ gap: 16 }}>
          <View style={styles.card}>
            <Text style={styles.hanzi}>{tab === "hanzi" ? "?" : currentVocab.chinese}</Text>
            <Text style={styles.pinyin}>{currentVocab.pinyin}</Text>
            {tab === "translation" ? (
              <>
                <View style={styles.translationBox}>
                  <TextInput
                    style={styles.translationInput}
                    placeholder="Nhập nghĩa tiếng Việt"
                    value={translationAnswer}
                    onChangeText={(value) => {
                      setTranslationAnswer(value);
                      if (checkedTranslation) {
                        setCheckedTranslation(false);
                      }
                    }}
                  />
                </View>
                {checkedTranslation ? (
                  <View style={[styles.translationResult, translationCorrect ? styles.translationGood : styles.translationWarn]}>
                    <Text style={styles.translationResultTitle}>
                      {translationCorrect ? "Đúng rồi" : "Chưa khớp"}
                    </Text>
                    <Text style={styles.translationResultText}>
                      Đáp án: {currentVocab.meaningVi}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.hiddenBox}>
                    <Text style={styles.subtle}>Xem từ rồi tự nhập nghĩa tiếng Việt.</Text>
                  </View>
                )}
              </>
            ) : tab === "hanzi" ? (
              <>
                <View style={styles.translationBox}>
                  <Text style={styles.translationPrompt}>Nghĩa: {currentVocab.meaningVi}</Text>
                  <TextInput
                    style={styles.translationInput}
                    placeholder="Nhập chữ Hán"
                    value={hanziAnswer}
                    onChangeText={(value) => {
                      setHanziAnswer(value);
                      if (checkedHanzi) {
                        setCheckedHanzi(false);
                      }
                    }}
                  />
                </View>
                {checkedHanzi ? (
                  <View style={[styles.translationResult, hanziCorrect ? styles.translationGood : styles.translationWarn]}>
                    <Text style={styles.translationResultTitle}>
                      {hanziCorrect ? "Đúng rồi" : "Chưa khớp"}
                    </Text>
                    <Text style={styles.translationResultText}>
                      Đáp án: {currentVocab.chinese}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.hiddenBox}>
                    <Text style={styles.subtle}>Xem pinyin và nghĩa rồi tự nhập chữ Hán.</Text>
                  </View>
                )}
              </>
            ) : showMeaning ? (
              <View style={styles.meaningBox}>
                <Text style={styles.meaning}>{currentVocab.meaningVi}</Text>
                {!!currentVocab.meaningEn && <Text style={styles.subtle}>{currentVocab.meaningEn}</Text>}
              </View>
            ) : (
              <View style={styles.hiddenBox}>
                <Text style={styles.subtle}>Ẩn nghĩa để tự nhớ trước</Text>
              </View>
            )}
            <View style={styles.actions}>
              <PronunciationMicButton
                onPress={pronunciation.onPress}
                busy={pronunciation.busy}
                isRecording={pronunciation.isRecording}
              />
              <SmallButton icon="chevron-back" onPress={() => {
                prev();
                setTranslationAnswer("");
                setCheckedTranslation(false);
                setHanziAnswer("");
                setCheckedHanzi(false);
              }} />
              {tab === "translation" ? (
                <SmallButton icon="checkmark" onPress={() => setCheckedTranslation(true)} primary large disabled={!translationAnswer.trim()} />
              ) : tab === "hanzi" ? (
                <SmallButton icon="checkmark" onPress={() => setCheckedHanzi(true)} primary large disabled={!hanziAnswer.trim()} />
              ) : (
                <SmallButton icon={showMeaning ? "eye-off" : "eye"} onPress={() => setShowMeaning((prevState) => !prevState)} primary large />
              )}
              <SmallButton icon="chevron-forward" onPress={() => {
                next();
                setTranslationAnswer("");
                setCheckedTranslation(false);
                setHanziAnswer("");
                setCheckedHanzi(false);
              }} />
              <SmallButton icon="volume-medium" onPress={() => speakChinese(currentVocab.chinese)} primary />
            </View>
          </View>
          <PronunciationResultPanel
            result={pronunciation.result}
            durationMs={pronunciation.durationMs}
          />
        </View>
      ) : null}

      {tab === "quiz" && currentQuiz ? (
        <View style={styles.card}>
          <View style={styles.quizModeRow}>
            {[
              { key: "meaning", label: "Nghĩa" },
              { key: "pinyin", label: "Pinyin" },
              { key: "recognition", label: "Chữ Hán" },
            ].map((item) => (
              <Pressable
                key={item.key}
                style={[styles.quizModeTab, quizMode === item.key && styles.quizModeTabActive]}
                onPress={() => setQuizMode(item.key as QuizMode)}
              >
                <Text style={[styles.quizModeText, quizMode === item.key && styles.quizModeTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
         

          {isWritingQuiz ? (
            <TextInput
              style={[styles.input, { marginTop: 16 }]}
              value={quizResponse}
              onChangeText={(value) => {
                setQuizResponse(value);
                if (value.trim() === currentQuiz.answer.trim()) {
                  void playCorrectSound();
                }
              }}
              placeholder="Nhập chữ Hán"
            />
          ) : (
            <View style={{ gap: 10, marginTop: 16 }}>
              {currentQuiz.options.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.optionButton,
                    quizResponse === option && styles.optionButtonActive,
                  ]}
                  onPress={() => answerQuiz(option)}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {hasQuizAnswer ? (
            <View style={[styles.feedback, quizCorrect ? styles.feedbackGood : styles.feedbackWarn]}>
              <Text style={styles.feedbackText}>
                {quizCorrect ? "Đúng rồi." : `Chưa đúng. Đáp án: ${currentQuiz.answer}`}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionsquiz}>
            
            <SmallButton icon="chevron-back" onPress={prev} />
            <SmallButton icon="chevron-forward" onPress={next} />
            
          </View>
          <PronunciationResultPanel
            result={quizPronunciation.result}
            durationMs={quizPronunciation.durationMs}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

function SmallButton({
  icon,
  onPress,
  primary,
  large,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
  large?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable style={[styles.button, large && styles.buttonLarge, primary && styles.buttonPrimary, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
      <Ionicons
        name={icon}
        size={large ? 22 : 18}
        color={primary ? "#fff" : APP_COLORS.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 20, gap: 16 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tab: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  tabText: { color: APP_COLORS.muted, fontWeight: "700", lineHeight: 18 },
  tabTextActive: { color: APP_COLORS.primaryDark },
  quizModeRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  quizModeTab: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quizModeTabActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  quizModeText: { color: APP_COLORS.muted, fontWeight: "800" },
  quizModeTextActive: { color: "#fff" },
  card: { position: "relative", backgroundColor: "#fff", borderRadius: 32, borderWidth: 1, borderColor: APP_COLORS.border, paddingHorizontal: 22, paddingVertical: 28, minHeight: 440 },
  hanzi: { fontSize: 72, fontWeight: "900", color: APP_COLORS.primary, textAlign: "center", minHeight: 108, lineHeight: 88 },
  pinyin: { fontSize: 28, fontWeight: "800", color: APP_COLORS.text, textAlign: "center", marginTop: 18 },
  meaningBox: { marginTop: 24, borderRadius: 22, backgroundColor: "#fff7ed", padding: 18 },
  meaning: { fontSize: 24, fontWeight: "900", color: APP_COLORS.text, textAlign: "center" },
  translationBox: { marginTop: 18, gap: 12 },
  translationPrompt: { color: APP_COLORS.primaryDark, fontWeight: "700", textAlign: "center" },
  translationInput: { borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", fontSize: 16, color: APP_COLORS.text },
  translationResult: { marginTop: 12, borderRadius: 18, padding: 14, gap: 4 },
  translationGood: { backgroundColor: "#ecfdf5" },
  translationWarn: { backgroundColor: "#fff7ed" },
  translationResultTitle: { color: APP_COLORS.text, fontWeight: "900", fontSize: 18 },
  translationResultText: { color: APP_COLORS.text, lineHeight: 20 },
  subtle: { color: APP_COLORS.muted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  hiddenBox: { marginTop: 24, borderRadius: 22, borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", padding: 18 },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6, marginTop: 22 },
  actionsquiz: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 50, marginTop: 22 },
  button: { width: 48, height: 48, borderRadius: 999, borderWidth: 1, borderColor: APP_COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  buttonLarge: { width: 56, height: 56 },
  buttonPrimary: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary, shadowColor: APP_COLORS.primary, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  buttonDisabled: { opacity: 0.45 },
  quizType: { alignSelf: "flex-start", backgroundColor: "#0f172a", color: "#fff", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: "hidden", fontWeight: "800" },
  quizQuestion: { marginTop: 16, fontSize: 24, fontWeight: "900", color: APP_COLORS.text },
  optionButton: { borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#fff" },
  optionButtonActive: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  optionText: { color: APP_COLORS.text, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", fontSize: 18, fontWeight: "700" },
  feedback: { marginTop: 16, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  feedbackGood: { backgroundColor: "#ecfdf5" },
  feedbackWarn: { backgroundColor: "#fff7ed" },
  feedbackText: { fontWeight: "800", color: APP_COLORS.text },
});
