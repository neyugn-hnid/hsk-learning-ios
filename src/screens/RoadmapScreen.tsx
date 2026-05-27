import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { fetchRoadmap } from "@/lib/api";
import { MainTabParamList, RootStackParamList } from "@/navigation/AppNavigator";
import type { RoadmapSummary } from "@/types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Roadmap">,
  NativeStackScreenProps<RootStackParamList>
>;

export function RoadmapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [items, setItems] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadItems();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [token]),
  );

  async function loadItems(isRefresh = false) {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await fetchRoadmap(token);
      setItems(response.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const phases = Array.from(new Set(items.map((item) => item.phase).filter(Boolean)));

  const phaseVisuals = [
    { hanzi: "课", icon: "calendar-outline", stage: "Theo buổi học" },
    { hanzi: "学", icon: "school-outline", stage: "Theo tiến trình lớp" },
    { hanzi: "练", icon: "create-outline", stage: "Luyện theo chủ điểm" },
    { hanzi: "说", icon: "mic-outline", stage: "Giao tiếp và phát âm" },
    { hanzi: "读", icon: "reader-outline", stage: "Đọc và hiểu bài" },
    { hanzi: "写", icon: "document-text-outline", stage: "Viết và ôn tập" },
  ] as const;

  const renderPhaseCard: ListRenderItem<string> = ({ item, index }) => {
    const count = items.filter((roadmap) => roadmap.phase === item).length;
    const visual = phaseVisuals[index % phaseVisuals.length];

    return (
      <Pressable style={styles.phaseCard} onPress={() => navigation.navigate("RoadmapPhase", { phase: item })}>
        <Text style={styles.phaseHanziWatermark}>{visual.hanzi}</Text>
        <View style={styles.phaseGlow} />
        <View style={styles.phaseOverlay}>
          <View style={styles.phaseCardTop}>
            <View style={styles.phaseCardIcon}>
              <Ionicons name={visual.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.phaseCardCount}>{String(count).padStart(2, "0")}</Text>
          </View>
          <View style={styles.phaseCardBody}>
            <Text style={styles.phaseCardTitle}>{item}</Text>
            <Text style={styles.phaseCardStage}>{visual.stage}</Text>
            <Text style={styles.phaseCardDesc}>Mở {count} buổi học thuộc giai đoạn này</Text>
          </View>
          <View style={styles.phaseCardFooter}>
            <Text style={styles.phaseCardMeta}>Mở danh sách buổi học</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.title}>Lộ trình lớp</Text>
            <Text style={styles.subtitle}>Chọn một giai đoạn để xem các buổi học.</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="map" size={20} color={APP_COLORS.primaryDark} />
          </View>
        </View>
      </View>

      <FlatList
        data={phases}
        keyExtractor={(item) => item}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadItems(true)} />}
        contentContainerStyle={styles.phaseGrid}
        renderItem={renderPhaseCard}
        ListEmptyComponent={<Text style={styles.empty}>Chưa có dữ liệu lộ trình.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  phaseGrid: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
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
  phaseCard: {
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
  phaseOverlay: {
    minHeight: 196,
    padding: 20,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  phaseHanziWatermark: {
    position: "absolute",
    right: 14,
    top: 8,
    fontSize: 112,
    lineHeight: 120,
    fontWeight: "900",
    color: "rgba(255,255,255,0.11)",
  },
  phaseGlow: {
    position: "absolute",
    left: -24,
    top: -24,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "rgba(254, 202, 202, 0.14)",
  },
  phaseCardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  phaseCardBody: { marginTop: 14, gap: 6 },
  phaseCardCount: { fontSize: 34, fontWeight: "900", color: "rgba(255,255,255,0.72)", lineHeight: 34 },
  phaseCardStage: { color: "#fecaca", fontWeight: "800", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.8 },
  phaseCardFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    paddingTop: 14,
  },
  phaseCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  phaseCardTitle: { fontSize: 28, fontWeight: "900", color: "#fff" },
  phaseCardDesc: { color: "rgba(255,255,255,0.88)", lineHeight: 20 },
  phaseCardMeta: { color: "#fff", fontWeight: "800" },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted },
});
