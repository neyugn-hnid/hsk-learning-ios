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

export function RoadmapDetailScreen({ route }: Props) {
  const { token } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"vocabulary" | "phrases" | "translation" | "hanzi">("vocabulary");
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [translationAnswer, setTranslationAnswer] = useState("");
  const [checkedTranslation, setCheckedTranslation] = useState(false);
  const [hanziAnswer, setHanziAnswer] = useState("");
  const [checkedHanzi, setCheckedHanzi] = useState(false);
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
    setShuffleKey((k) => k + 1);
  }, [tab]);

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
    const a = [...rawVocab];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [rawVocab, shuffleKey]);

  const shuffledPhrases = useMemo(() => {
    const a = [...rawPhrases];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, [rawPhrases, shuffleKey]);

  const pronunciationTargetText =
    tab === "vocabulary" || tab === "translation" || tab === "hanzi"
      ? shuffledVocab[index]?.chinese || ""
      : tab === "phrases"
        ? shuffledPhrases[index]?.chinese || ""
        : "";
  const pronunciation = usePronunciationRecorder(pronunciationTargetText);

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
      : shuffledPhrases;
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
      

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === "vocabulary" && styles.tabActive]} onPress={() => setTab("vocabulary")}>
          <Text style={[styles.tabText, tab === "vocabulary" && styles.tabTextActive]}>Từ vựng</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "phrases" && styles.tabActive]} onPress={() => setTab("phrases")}>
          <Text style={[styles.tabText, tab === "phrases" && styles.tabTextActive]}>Mẫu câu</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "translation" && styles.tabActive]} onPress={() => setTab("translation")}>
          <Text style={[styles.tabText, tab === "translation" && styles.tabTextActive]}>Dịch nghĩa</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "hanzi" && styles.tabActive]} onPress={() => setTab("hanzi")}>
          <Text style={[styles.tabText, tab === "hanzi" && styles.tabTextActive]}>Chữ Hán</Text>
        </Pressable>
      </View>

      {item ? (
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
  button: { width: 48, height: 48, borderRadius: 999, borderWidth: 1, borderColor: APP_COLORS.border, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  buttonLarge: { width: 56, height: 56 },
  buttonPrimary: { backgroundColor: APP_COLORS.primary, borderColor: APP_COLORS.primary, shadowColor: APP_COLORS.primary, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  buttonDisabled: { opacity: 0.45 },
  empty: { color: APP_COLORS.muted, textAlign: "center" },
});
