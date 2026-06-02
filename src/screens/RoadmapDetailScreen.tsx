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
import { useAuth } from "@/context/AuthContext";
import { fetchRoadmapDetail } from "@/lib/api";
import { RootStackParamList } from "@/navigation/AppNavigator";
import type { RoadmapDetail } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "RoadmapDetail">;
type RoadmapTab = "vocabulary" | "translation" | "hanzi" | "practice";
type PracticeMode = "meaning" | "pinyin" | "recognition" | "listening";
type PracticeQuestion = {
  chinese: string;
  pinyin: string;
  question: string;
  options: string[];
  answer: string;
};

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function RoadmapDetailScreen({ route }: Props) {
  const { token } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<RoadmapTab>("vocabulary");
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [translationAnswer, setTranslationAnswer] = useState("");
  const [checkedTranslation, setCheckedTranslation] = useState(false);
  const [hanziAnswer, setHanziAnswer] = useState("");
  const [checkedHanzi, setCheckedHanzi] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("meaning");
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    void load();
  }, [route.params.roadmapId, token]);

  useEffect(() => {
    setIndex(0);
    setShowMeaning(false);
    setTranslationAnswer("");
    setCheckedTranslation(false);
    setHanziAnswer("");
    setCheckedHanzi(false);
    setPracticeAnswer("");
    setShuffleKey((k) => k + 1);
  }, [tab]);

  useEffect(() => {
    setIndex(0);
    setPracticeAnswer("");
    setShuffleKey((k) => k + 1);
  }, [practiceMode]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetchRoadmapDetail(token, route.params.roadmapId);
      setRoadmap(response.roadmap);
    } finally {
      setLoading(false);
    }
  }

  const rawVocab = roadmap?.vocabulary ?? [];
  const rawPhrases = roadmap?.phrases ?? [];

  const shuffledVocab = useMemo(() => {
    return shuffleItems(rawVocab);
  }, [rawVocab, shuffleKey]);

  const practiceQuestions = useMemo<PracticeQuestion[]>(() => {
    const practiceItems = shuffleItems([...rawVocab, ...rawPhrases]);
    return practiceItems.map((item) => {
      const distractors = practiceItems
        .filter((candidate) => candidate.chinese !== item.chinese)
        .map((candidate) => {
          if (practiceMode === "pinyin") return candidate.pinyin;
          if (practiceMode === "recognition" || practiceMode === "listening") return candidate.chinese;
          return candidate.meaningVi;
        })
        .filter(Boolean);
      const answer =
        practiceMode === "pinyin"
          ? item.pinyin
          : practiceMode === "recognition" || practiceMode === "listening"
            ? item.chinese
            : item.meaningVi;
      const question =
        practiceMode === "pinyin"
          ? `"${item.chinese}" đọc pinyin là gì?`
          : practiceMode === "listening"
            ? "Nghe và chọn chữ Hán đúng"
            : practiceMode === "recognition"
              ? `Chữ Hán nào có pinyin "${item.pinyin}"?`
              : `"${item.chinese}" nghĩa là gì?`;

      return {
        chinese: item.chinese,
        pinyin: item.pinyin,
        question,
        options: shuffleItems(Array.from(new Set([answer, ...distractors])).slice(0, 4)),
        answer,
      };
    });
  }, [practiceMode, rawPhrases, rawVocab, shuffleKey]);

  const currentPractice = practiceQuestions[index];
  const practiceCorrect = !!practiceAnswer && practiceAnswer === currentPractice?.answer;

  const pronunciationTargetText =
    tab === "vocabulary" || tab === "translation" || tab === "hanzi"
      ? shuffledVocab[index]?.chinese || ""
      : tab === "practice"
        ? currentPractice?.chinese || ""
        : "";
  const pronunciation = usePronunciationRecorder(pronunciationTargetText);

  useEffect(() => {
    if (tab === "practice" && practiceMode === "listening" && currentPractice?.chinese) {
      speakChinese(currentPractice.chinese);
    }
  }, [currentPractice?.chinese, index, practiceMode, tab]);

  if (loading || !roadmap) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  const items =
    tab === "vocabulary" || tab === "translation" || tab === "hanzi"
      ? shuffledVocab
      : [];
  const item = items[index];
  const normalizedUserMeaning = translationAnswer.trim().toLowerCase();
  const normalizedCorrectMeaning = (item?.meaningVi || "").trim().toLowerCase();
  const translationCorrect =
    checkedTranslation &&
    normalizedUserMeaning.length > 0 &&
    (normalizedUserMeaning === normalizedCorrectMeaning ||
      normalizedCorrectMeaning.includes(normalizedUserMeaning) ||
      normalizedUserMeaning.includes(normalizedCorrectMeaning));
  const normalizedUserHanzi = hanziAnswer.trim();
  const normalizedCorrectHanzi = (item?.chinese || "").trim();
  const hanziCorrect =
    checkedHanzi &&
    normalizedUserHanzi.length > 0 &&
    normalizedUserHanzi === normalizedCorrectHanzi;

  function speakChinese(text?: string | null) {
    if (!text) return;
    void Speech.stop();
    Speech.speak(text, {
      language: "zh-CN",
      rate: 0.9,
    });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        <Pressable style={[styles.tab, tab === "vocabulary" && styles.tabActive]} onPress={() => setTab("vocabulary")}>
          <Text style={[styles.tabText, tab === "vocabulary" && styles.tabTextActive]}>Từ vựng</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "translation" && styles.tabActive]} onPress={() => setTab("translation")}>
          <Text style={[styles.tabText, tab === "translation" && styles.tabTextActive]}>Dịch nghĩa</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "hanzi" && styles.tabActive]} onPress={() => setTab("hanzi")}>
          <Text style={[styles.tabText, tab === "hanzi" && styles.tabTextActive]}>Chữ Hán</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "practice" && styles.tabActive]} onPress={() => setTab("practice")}>
          <Text style={[styles.tabText, tab === "practice" && styles.tabTextActive]}>Luyện tập</Text>
        </Pressable>
      </ScrollView>

      {tab === "practice" && currentPractice ? (
        <View style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quizModeRow}>
            {[
              { key: "pinyin", label: "Pinyin" },
              { key: "meaning", label: "Nghĩa" },
              { key: "recognition", label: "Chữ Hán" },
              { key: "listening", label: "Nghe" },
            ].map((mode) => (
              <Pressable
                key={mode.key}
                style={[styles.quizModeTab, practiceMode === mode.key && styles.quizModeTabActive]}
                onPress={() => setPracticeMode(mode.key as PracticeMode)}
              >
                <Text style={[styles.quizModeText, practiceMode === mode.key && styles.quizModeTextActive]}>
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.quizQuestion}>{currentPractice.question}</Text>

          <View style={styles.optionList}>
            {currentPractice.options.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.optionButton,
                  practiceAnswer === option && styles.optionButtonActive,
                ]}
                onPress={() => setPracticeAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            ))}
          </View>

          {practiceAnswer ? (
            <View style={[styles.feedback, practiceCorrect ? styles.translationGood : styles.translationWarn]}>
              <Text style={styles.feedbackText}>
                {practiceCorrect ? "Đúng rồi." : `Chưa đúng. Đáp án: ${currentPractice.answer}`}
              </Text>
              {practiceCorrect ? (
                <Text style={styles.feedbackPinyin}>Pinyin: {currentPractice.pinyin}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionsPractice}>
            <SmallButton
              icon="chevron-back"
              onPress={() => {
                setIndex((prev) => (prev - 1 + practiceQuestions.length) % practiceQuestions.length);
                setPracticeAnswer("");
              }}
            />
            <SmallButton icon="volume-medium" onPress={() => speakChinese(currentPractice.chinese)} primary large />
            <SmallButton
              icon="chevron-forward"
              onPress={() => {
                setIndex((prev) => (prev + 1) % practiceQuestions.length);
                setPracticeAnswer("");
              }}
            />
          </View>
        </View>
      ) : item ? (
        <View style={{ gap: 16 }}>
          <View style={styles.card}>
            <Text style={styles.hanzi}>{tab === "hanzi" ? "?" : item.chinese}</Text>
            <Text style={styles.pinyin}>{item.pinyin}</Text>
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
                      Đáp án: {item.meaningVi}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.hiddenBox}>
                    <Text style={styles.subtle}>Xem câu rồi tự nhập nghĩa tiếng Việt.</Text>
                  </View>
                )}
              </>
            ) : tab === "hanzi" ? (
              <>
                <View style={styles.translationBox}>
                  <Text style={styles.translationPrompt}>Nghĩa: {item.meaningVi}</Text>
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
                      Đáp án: {item.chinese}
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
                <Text style={styles.meaning}>{item.meaningVi}</Text>
              </View>
            ) : (
              <View style={styles.hiddenBox}>
                <Text style={styles.subtle}>Ẩn nghĩa để tự ôn trước</Text>
              </View>
            )}
            <View style={styles.actions}>
              <PronunciationMicButton
                onPress={pronunciation.onPress}
                busy={pronunciation.busy}
                isRecording={pronunciation.isRecording}
              />
              <SmallButton icon="chevron-back" onPress={() => {
                setIndex((prev) => (prev - 1 + items.length) % items.length);
                setShowMeaning(false);
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
                <SmallButton icon={showMeaning ? "eye-off" : "eye"} onPress={() => setShowMeaning((prev) => !prev)} primary large />
              )}
              <SmallButton icon="chevron-forward" onPress={() => {
                setIndex((prev) => (prev + 1) % items.length);
                setShowMeaning(false);
                setTranslationAnswer("");
                setCheckedTranslation(false);
                setHanziAnswer("");
                setCheckedHanzi(false);
              }} />
              <SmallButton icon="volume-medium" onPress={() => speakChinese(item.chinese)} primary />
            </View>
          </View>
          <PronunciationResultPanel
            result={pronunciation.result}
            durationMs={pronunciation.durationMs}
          />
        </View>
      ) : (
        <Text style={styles.empty}>Chưa có dữ liệu trong tab này.</Text>
      )}
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
    <Pressable
      style={[styles.button, large && styles.buttonLarge, primary && styles.buttonPrimary, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
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
  hero: { backgroundColor: APP_COLORS.primary, borderRadius: 28, padding: 22 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900" },
  heroText: { color: "#fee2e2", marginTop: 8, lineHeight: 22 },
  tabRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 2 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: APP_COLORS.border },
  tabActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  tabText: { color: APP_COLORS.muted, fontWeight: "700" },
  tabTextActive: { color: APP_COLORS.primaryDark },
  quizModeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 8, paddingRight: 2 },
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
  hiddenBox: { marginTop: 24, borderRadius: 22, borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", padding: 18 },
  translationBox: { marginTop: 18, gap: 12 },
  translationPrompt: { color: APP_COLORS.primaryDark, fontWeight: "700", textAlign: "center" },
  translationInput: { borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", fontSize: 16, color: APP_COLORS.text },
  translationResult: { marginTop: 12, borderRadius: 18, padding: 14, gap: 4 },
  translationGood: { backgroundColor: "#ecfdf5" },
  translationWarn: { backgroundColor: "#fff7ed" },
  translationResultTitle: { color: APP_COLORS.text, fontWeight: "900", fontSize: 18 },
  translationResultText: { color: APP_COLORS.text, lineHeight: 20 },
  subtle: { color: APP_COLORS.muted, textAlign: "center" },
  actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6, marginTop: 22 },
  actionsPractice: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 28, marginTop: 22 },
  button: { width: 48, height: 48, borderRadius: 999, borderWidth: 1, borderColor: APP_COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  buttonLarge: { width: 56, height: 56 },
  buttonPrimary: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary, shadowColor: APP_COLORS.primary, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  buttonDisabled: { opacity: 0.45 },
  quizQuestion: { marginTop: 16, fontSize: 24, fontWeight: "900", color: APP_COLORS.text, lineHeight: 32 },
  optionList: { gap: 10, marginTop: 18 },
  optionButton: { borderWidth: 1, borderColor: APP_COLORS.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, backgroundColor: "#fff" },
  optionButtonActive: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  optionText: { color: APP_COLORS.text, fontWeight: "700" },
  feedback: { marginTop: 16, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  feedbackText: { fontWeight: "800", color: APP_COLORS.text },
  feedbackPinyin: { marginTop: 6, fontSize: 20, fontWeight: "900", color: APP_COLORS.primaryDark },
  empty: { color: APP_COLORS.muted, textAlign: "center" },
});
