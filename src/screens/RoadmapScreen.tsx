import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadItems();
  }, [token]);

  async function loadItems(isRefresh = false, queryOverride = query) {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetchRoadmap(token, { q: queryOverride });
      setItems(response.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerBar}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Lộ trình lớp</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="map" size={20} color={APP_COLORS.primaryDark} />
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={APP_COLORS.muted} />
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm buổi học..."
            returnKeyType="search"
            onSubmitEditing={() => void loadItems()}
          />
          {query ? (
            <Pressable
              onPress={() => {
                setQuery("");
                void loadItems(false, "");
              }}
            >
              <Ionicons name="close" size={18} color={APP_COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadItems(true)} />}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("RoadmapDetail", { roadmapId: item.id, title: item.title })}
            >
              <View style={styles.badges}>
                <Text style={styles.badgeDark}>Buổi {item.orderNo}</Text>
                <Text style={styles.badgeSoft}>{item.phase}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description || "Nội dung lộ trình."}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{item.vocabularyCount} từ · {item.phraseCount} mẫu câu</Text>
                <Ionicons name="arrow-forward" size={18} color={APP_COLORS.primaryDark} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có dữ liệu lộ trình.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 10, gap: 14 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  headerText: { flex: 1 },
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
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  search: { flex: 1, paddingVertical: 14, backgroundColor: "#fff" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: APP_COLORS.border },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badgeDark: {
    backgroundColor: "#0f172a",
    color: "#fff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "800",
  },
  badgeSoft: {
    backgroundColor: "#fff7ed",
    color: "#b45309",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: "800",
  },
  cardTitle: { marginTop: 16, fontSize: 20, fontWeight: "800", color: APP_COLORS.text },
  cardDesc: { marginTop: 8, color: APP_COLORS.muted, lineHeight: 20 },
  cardFooter: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: APP_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMeta: { color: APP_COLORS.muted, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted },
});
