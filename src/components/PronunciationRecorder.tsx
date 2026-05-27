import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { APP_COLORS } from "@/config";

type ScoreResult = {
  score: number;
  feedback: string;
  transcript: string;
};

export function usePronunciationRecorder(_targetText: string) {
  return {
    isRecording: false,
    busy: false,
    result: null as ScoreResult | null,
    durationMs: null as number | null,
    onPress: async () => undefined,
  };
}

export function PronunciationMicButton({
  onPress: _onPress,
  busy: _busy,
  isRecording: _isRecording,
}: {
  onPress: () => void | Promise<void>;
  busy: boolean;
  isRecording: boolean;
}) {
  return (
    <Pressable style={[styles.iconButton, styles.primaryButton, styles.disabledButton]} disabled>
      <Ionicons name="mic" size={24} color="#fff" />
    </Pressable>
  );
}

export function PronunciationResultPanel({
  result,
}: {
  result: ScoreResult | null;
  durationMs: number | null;
}) {
  if (!result) return null;

  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultFeedback}>{result.feedback}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  primaryButton: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  disabledButton: {
    opacity: 0.45,
  },
  resultBox: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#fff7ed",
  },
  resultFeedback: {
    color: APP_COLORS.text,
    fontWeight: "700",
  },
});
