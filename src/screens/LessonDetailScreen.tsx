import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { APP_COLORS } from "@/config";
import { PronunciationMicButton, PronunciationResultPanel, usePronunciationRecorder } from "@/components/PronunciationRecorder";
import { fetchLessonDetail } from "@/lib/api";
import { RootStackParamList } from "@/navigation/AppNavigator";
import type { LessonDetail } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "LessonDetail">;

export function LessonDetailScreen({ route }: Props) {
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

  async function load() {
    try {
      setLoading(true);
      const response = await fetchLessonDetail(route.params.lessonId);
      setLesson(response.lesson);
    } finally {
      setLoading(false);
    }
  }

  const currentVocab = lesson?.vocabularies[index];
  const currentQuiz = lesson?.quizzes[index];
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
  const pronunciationTargetText = lesson?.vocabularies[index]?.chinese || "";
  const quizPronunciationTargetText = currentQuiz?.answer || "";
  const pronunciation = usePronunciationRecorder(pronunciationTargetText);
  const quizPronunciation = usePronunciationRecorder(quizPronunciationTargetText);

  const activeCount = useMemo(() => {
    if (!lesson) return 0;
    if (tab === "vocabulary" || tab === "translation" || tab === "hanzi") {
      return lesson.vocabularies.length;
    }
    return lesson.quizzes.length;
  }, [lesson, tab]);

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
          { key: "vocabulary", label: "Từ vựng" },
          { key: "translation", label: "Dịch nghĩa" },
          { key: "hanzi", label: "Chữ Hán" },
          { key: "quiz", label: "Quiz" },
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

          <Text style={styles.quizQuestion}>{currentQuiz.question}</Text>
         

          {isWritingQuiz ? (
            <TextInput
              style={[styles.input, { marginTop: 16 }]}
              value={quizResponse}
              onChangeText={setQuizResponse}
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
                  onPress={() => setQuizResponse(option)}
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
  tabRow: { flexDirection: "row", gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: APP_COLORS.border },
  tabActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  tabText: { color: APP_COLORS.muted, fontWeight: "700" },
  tabTextActive: { color: APP_COLORS.primaryDark },
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
