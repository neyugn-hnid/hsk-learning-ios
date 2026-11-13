import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_COLORS } from "@/config";
import { findEnglishLesson, type EnglishWord } from "@/data/english";
import { RootStackParamList } from "@/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "EnglishLessonDetail">;

const ENGLISH_ACCENT = "#2563eb";

export function EnglishLessonDetailScreen({ route }: Props) {
  const lesson = findEnglishLesson(route.params.lessonId);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const word = lesson?.words[index];

  useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
  }, [route.params.lessonId]);

  function speakUS(text: string | undefined) {
    if (!text) return;
    void Speech.stop();
    Speech.speak(text, { language: "en-US", rate: 0.88 });
  }

  function move(offset: number) {
    if (!lesson?.words.length) return;
    setIndex((current) => (current + offset + lesson.words.length) % lesson.words.length);
    setIsFlipped(false);
  }

  if (!lesson || !word) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Không tìm thấy bài học này.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {isFlipped ? (
        <View style={[styles.wordCard, styles.backFace]}>
          <View style={styles.faceHeader}>
            <Text style={styles.faceLabel}>MẶT SAU</Text>
            <Text style={styles.progressText}>{index + 1} / {lesson.words.length}</Text>
          </View>

          <Text style={styles.backWord}>{word.word}</Text>

          <View style={styles.usPronunciationBox}>
            <Text style={styles.sectionEyebrow}>PHIÊN ÂM</Text>
            <Text style={styles.usPronunciation}>{formatUsIpa(word)}</Text>
            <View pointerEvents="box-none" style={styles.audioButtonSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Nghe phát âm US của ${word.word}`}
                style={({ pressed }) => [styles.audioButton, pressed && styles.audioButtonPressed]}
                onPress={() => speakUS(word.word)}
              >
                <Ionicons name="volume-high" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionEyebrow}>NGHĨA TIẾNG VIỆT</Text>
            <Text style={styles.meaning}>{word.meaning_vi}</Text>
          </View>

          {word.example_en ? (
            <View style={styles.exampleSection}>
              <View style={styles.exampleHeading}>
                <Text style={styles.sectionEyebrow}>VÍ DỤ</Text>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={ENGLISH_ACCENT} />
              </View>
              <Text style={styles.exampleEnglish}>{word.example_en}</Text>
              {word.example_vi ? <Text style={styles.exampleVietnamese}>{word.example_vi}</Text> : null}
            </View>
          ) : null}

          <Pressable style={styles.flipBackButton} onPress={() => setIsFlipped(false)}>
            <Ionicons name="return-up-back-outline" size={17} color={ENGLISH_ACCENT} />
            <Text style={styles.flipBackText}>Chạm để xem lại mặt trước</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Thẻ từ ${word.word}. Chạm để lật thẻ.`}
          style={({ pressed }) => [styles.wordCard, styles.frontFace, pressed && styles.pressed]}
          onPress={() => setIsFlipped(true)}
        >
          <View style={styles.faceHeader}>
            <Text style={styles.faceLabel}>THẺ TỪ VỰNG · {lesson.level}</Text>
            <Text style={styles.progressText}>{index + 1} / {lesson.words.length}</Text>
          </View>

          <View style={styles.frontCenter}>
            <Text style={styles.word}>{word.word}</Text>
            <Text style={styles.partOfSpeech}>{word.part_of_speech.join(" · ")}</Text>
            <View style={styles.frontUsPronunciation}>
              <Text style={styles.frontUsValue}>{formatUsIpa(word)}</Text>
            </View>
          </View>

          <View style={styles.flipHint}>
            <Ionicons name="sync-outline" size={17} color={ENGLISH_ACCENT} />
            <Text style={styles.flipHintText}>Chạm thẻ để lật xem nghĩa và ví dụ</Text>
          </View>
        </Pressable>
      )}

      <View style={styles.navigationRow}>
        <Pressable style={styles.navigationButton} onPress={() => move(-1)}>
          <Ionicons name="chevron-back" size={20} color={APP_COLORS.text} />
          <Text style={styles.navigationText}>Từ trước</Text>
        </Pressable>
        <Pressable style={[styles.navigationButton, styles.nextButton]} onPress={() => move(1)}>
          <Text style={styles.nextText}>Từ tiếp</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function formatUsIpa(word: EnglishWord) {
  const values = word.pronunciation_ipa?.us ?? [];
  return values.length ? values.join(" · ") : "Chưa có phiên âm";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 20, gap: 14, paddingBottom: 36 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  notFoundText: { color: APP_COLORS.muted, fontWeight: "700" },
  progressText: { color: APP_COLORS.muted, fontSize: 12, fontWeight: "800" },
  wordCard: { backgroundColor: "#fff", borderRadius: 28, padding: 22, borderWidth: 1, borderColor: APP_COLORS.border },
  frontFace: { minHeight: 390, justifyContent: "space-between", overflow: "hidden" },
  backFace: { gap: 17, borderColor: "#DCE7FC", backgroundColor: "#fff" },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  faceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faceLabel: { color: ENGLISH_ACCENT, fontSize: 10, letterSpacing: 1.3, fontWeight: "900" },
  frontCenter: { alignItems: "center", paddingVertical: 25 },
  word: { color: APP_COLORS.text, fontSize: 42, lineHeight: 51, fontWeight: "900", textAlign: "center" },
  partOfSpeech: { marginTop: 8, color: APP_COLORS.muted, fontWeight: "700" },
  frontUsPronunciation: { marginTop: 26, maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: "#F2F6FF" },
  frontUsValue: { flexShrink: 1, color: APP_COLORS.text, fontSize: 17, fontWeight: "700", textAlign: "center" },
  flipHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EEF1F5" },
  flipHintText: { color: ENGLISH_ACCENT, fontSize: 12, fontWeight: "800" },
  backWord: { color: APP_COLORS.text, fontSize: 25, fontWeight: "900" },
  usPronunciationBox: { position: "relative", padding: 14, paddingRight: 60, borderRadius: 16, borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#F2F6FF" },
  audioButtonSlot: { position: "absolute", top: 0, right: 14, bottom: 0, width: 32, justifyContent: "center" },
  audioButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: ENGLISH_ACCENT },
  audioButtonPressed: { opacity: 0.78 },
  sectionEyebrow: { color: APP_COLORS.muted, fontSize: 10, letterSpacing: 1, fontWeight: "900" },
  usPronunciation: { marginTop: 6, color: ENGLISH_ACCENT, fontSize: 19, lineHeight: 26, fontWeight: "800" },
  detailSection: { gap: 7 },
  meaning: { color: APP_COLORS.text, fontSize: 17, lineHeight: 25, fontWeight: "800" },
  exampleSection: { paddingTop: 15, borderTopWidth: 1, borderTopColor: "#EEF1F5", gap: 8 },
  exampleHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exampleEnglish: { color: APP_COLORS.text, fontSize: 16, lineHeight: 24, fontWeight: "700" },
  exampleVietnamese: { color: APP_COLORS.muted, fontSize: 14, lineHeight: 21 },
  flipBackButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 4 },
  flipBackText: { color: ENGLISH_ACCENT, fontSize: 12, fontWeight: "800" },
  navigationRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  navigationButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: APP_COLORS.border, backgroundColor: "#fff" },
  nextButton: { backgroundColor: ENGLISH_ACCENT, borderColor: ENGLISH_ACCENT },
  navigationText: { color: APP_COLORS.text, fontWeight: "800" },
  nextText: { color: "#fff", fontWeight: "900" },
});
