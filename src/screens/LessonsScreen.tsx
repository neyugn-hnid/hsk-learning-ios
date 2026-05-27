import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "@/config";
import { MainTabParamList, RootStackParamList } from "@/navigation/AppNavigator";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Lessons">,
  NativeStackScreenProps<RootStackParamList>
>;

const levels = [
  {
    id: "HSK1",
    rank: "01",
    stage: "Nhập môn",
    summary: "Từ và mẫu câu cơ bản để bắt đầu học tiếng Trung.",
    hanzi: "汉",
    icon: "chatbubbles-outline",
  },
  {
    id: "HSK2",
    rank: "02",
    stage: "Nền tảng",
    summary: "Mở rộng giao tiếp hằng ngày và phản xạ hội thoại.",
    hanzi: "语",
    icon: "volume-high-outline",
  },
  {
    id: "HSK3",
    rank: "03",
    stage: "Sơ trung cấp",
    summary: "Bắt đầu đọc hiểu đoạn ngắn và luyện cấu trúc nhiều hơn.",
    hanzi: "读",
    icon: "reader-outline",
  },
  {
    id: "HSK4",
    rank: "04",
    stage: "Trung cấp",
    summary: "Tăng độ dài bài học, từ vựng và khả năng diễn đạt.",
    hanzi: "说",
    icon: "mic-outline",
  },
  {
    id: "HSK5",
    rank: "05",
    stage: "Cao trung cấp",
    summary: "Ôn luyện bài dài hơn, ngữ cảnh thực tế và từ vựng nâng cao.",
    hanzi: "写",
    icon: "create-outline",
  },
  {
    id: "HSK6",
    rank: "06",
    stage: "Nâng cao",
    summary: "Tập trung đọc hiểu sâu, phản xạ nhanh và độ khó cao.",
    hanzi: "文",
    icon: "library-outline",
  },
] as const;

export function LessonsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const renderLevelCard: ListRenderItem<(typeof levels)[number]> = ({ item }) => (
    <Pressable
      style={styles.levelCard}
      onPress={() => {
        navigation.navigate("LessonsLevel", { level: item.id });
      }}
    >
      <View style={styles.levelBackdrop}>
        <Text style={styles.levelHanziWatermark}>{item.hanzi}</Text>
        <View style={styles.levelGlow} />
        <View style={styles.levelOverlay}>
          <View style={styles.levelCardTop}>
            <View style={styles.levelCardIcon}>
              <Ionicons name={item.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.levelCardRank}>{item.rank}</Text>
          </View>
          <View style={styles.levelCardBody}>
            <Text style={styles.levelCardTitle}>{item.id}</Text>
            <Text style={styles.levelCardStage}>{item.stage}</Text>
            <Text style={styles.levelCardDesc}>{item.summary}</Text>
          </View>
          <View style={styles.levelCardFooter}>
            <Text style={styles.levelCardMeta}>Mở danh sách bài học</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.title}>Bài học</Text>
            <Text style={styles.subtitle}>Chọn cấp độ HSK để xem các bài học phù hợp.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="book" size={20} color={APP_COLORS.primaryDark} />
          </View>
        </View>
      </View>

      <FlatList
        data={levels}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.levelGrid}
        renderItem={renderLevelCard}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có dữ liệu cấp độ.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 10 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "900", color: APP_COLORS.text },
  subtitle: { marginTop: 6, color: APP_COLORS.muted },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted },
  levelGrid: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  levelCard: {
    minHeight: 196,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: APP_COLORS.primary,
    backgroundColor: APP_COLORS.primary,
    shadowColor: APP_COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
    overflow: "hidden",
  },
  levelBackdrop: {
    minHeight: 196,
    backgroundColor: APP_COLORS.primary,
  },
  levelHanziWatermark: {
    position: "absolute",
    right: 14,
    top: 8,
    fontSize: 112,
    lineHeight: 120,
    fontWeight: "900",
    color: "rgba(255,255,255,0.11)",
  },
  levelGlow: {
    position: "absolute",
    left: -24,
    top: -24,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(254, 202, 202, 0.14)",
  },
  levelOverlay: {
    minHeight: 196,
    padding: 20,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  levelCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  levelCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  levelCardRank: { fontSize: 34, fontWeight: "900", color: "rgba(255,255,255,0.72)", lineHeight: 34 },
  levelCardBody: { marginTop: 14, gap: 6 },
  levelCardTitle: { fontSize: 30, fontWeight: "900", color: "#fff" },
  levelCardStage: { color: "#fecaca", fontWeight: "800", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.8 },
  levelCardDesc: { color: "rgba(255,255,255,0.88)", lineHeight: 20 },
  levelCardFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 14,
  },
  levelCardMeta: { color: "#fff", fontWeight: "800" },
});
