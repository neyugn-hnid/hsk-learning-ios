import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
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
import { APP_COLORS } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { fetchRoadmap } from "@/lib/api";
import { RootStackParamList } from "@/navigation/AppNavigator";
import type { RoadmapSummary } from "@/types";

type Props = NativeStackScreenProps<RootStackParamList, "RoadmapPhase">;

export function RoadmapPhaseScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const { phase } = route.params;
  const [items, setItems] = useState<RoadmapSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    void loadItems();
  }, [token, phase]);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [token, phase, query]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={[styles.headerSearchButton, searchOpen && styles.headerSearchButtonActive]}
          onPress={() => {
            if (searchOpen && query.trim()) {
              void loadItems();
              return;
            }
            if (searchOpen) {
              setQuery("");
            }
            setSearchOpen((prev) => !prev);
          }}
        >
          <Ionicons name="search" size={18} color={APP_COLORS.primaryDark} />
        </Pressable>
      ),
    });
  }, [navigation, query, searchOpen]);

  async function loadItems(isRefresh = false) {
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetchRoadmap(token, { phase, q: query });
      setItems(response.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadItems(true)} />}
      ListHeaderComponent={
        <>
          {searchOpen ? (
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={APP_COLORS.muted} />
              <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Tìm buổi học..."
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => void loadItems()}
              />
              <Pressable
                onPress={() => {
                  setQuery("");
                  setSearchOpen(false);
                  void loadItems();
                }}
              >
                <Ionicons name="close" size={18} color={APP_COLORS.muted} />
              </Pressable>
            </View>
          ) : null}
        </>
      }
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
          <Text style={styles.cardMeta}>{item.vocabularyCount} từ · {item.phraseCount} mẫu câu</Text>
        </Pressable>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Chưa có dữ liệu lộ trình.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: APP_COLORS.background },
  headerSearchButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  headerSearchButtonActive: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  search: { flex: 1, paddingVertical: 14, backgroundColor: "#fff" },
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
  cardMeta: { marginTop: 14, color: APP_COLORS.muted, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, color: APP_COLORS.muted },
});
