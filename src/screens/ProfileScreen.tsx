import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "@/config";
import { useAuth } from "@/context/AuthContext";
import {
  changePassword,
  fetchLearningStats,
  getOfflineDataStatus,
  importLessonsJson,
  importRoadmapJson,
} from "@/lib/api";
import type { LearningStats } from "@/types";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, token, signOut, updateName } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [importingLessons, setImportingLessons] = useState(false);
  const [importingRoadmap, setImportingRoadmap] = useState(false);
  const [dataStatus, setDataStatus] = useState({
    lessonsImported: false,
    roadmapImported: false,
  });

  useEffect(() => {
    setDisplayName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    void loadStats();
  }, [token]);

  useEffect(() => {
    void loadDataStatus();
  }, []);

  async function loadStats() {
    if (!token) return;
    try {
      setLoadingStats(true);
      const response = await fetchLearningStats(token);
      setStats(response.stats);
    } catch (error) {
      Alert.alert("Không tải được thống kê", error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadDataStatus() {
    try {
      const status = await getOfflineDataStatus();
      setDataStatus(status);
    } catch {
      setDataStatus({
        lessonsImported: false,
        roadmapImported: false,
      });
    }
  }

  async function handleUpdateName() {
    try {
      setSavingName(true);
      await updateName(displayName);
      Alert.alert("Thành công", "Đã cập nhật tên hiển thị.");
    } catch (error) {
      Alert.alert("Không thể cập nhật tên", error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    if (!token) return;
    try {
      setSavingPassword(true);
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      Alert.alert("Thành công", "Đã đổi mật khẩu.");
    } catch (error) {
      Alert.alert("Không thể đổi mật khẩu", error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function pickAndImport(kind: "lessons" | "roadmap") {
    try {
      if (kind === "lessons") setImportingLessons(true);
      else setImportingRoadmap(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const content = await response.text();

      if (kind === "lessons") {
        const importResult = await importLessonsJson(content);
        Alert.alert("Import thành công", `Đã cập nhật ${importResult.count} bài học offline.`);
      } else {
        const importResult = await importRoadmapJson(content);
        Alert.alert("Import thành công", `Đã cập nhật ${importResult.count} mục lộ trình offline.`);
      }

      await Promise.all([loadStats(), loadDataStatus()]);
    } catch (error) {
      Alert.alert("Không thể import file", error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setImportingLessons(false);
      setImportingRoadmap(false);
    }
  }

  const initials = (user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <Text style={styles.headerSubtitle}>Quản lý hồ sơ và theo dõi tiến độ học tập.</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="person-circle" size={22} color={APP_COLORS.primaryDark} />
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || "U"}</Text>
        </View>
        <View style={styles.heroMeta}>
          <Text style={styles.name}>{user?.name || "Người dùng"}</Text>
          <Text style={styles.email}>{user?.email || "Chưa có email"}</Text>
          <View style={styles.roleChip}>
            <Ionicons
              name={user?.role === "ADMIN" ? "shield-checkmark" : "person"}
              size={14}
              color={APP_COLORS.primary}
            />
            <Text style={styles.roleText}>{user?.role === "ADMIN" ? "Quản trị viên" : "Học viên"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê học tập</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="book-outline"
            label="Tổng bài học"
            value={loadingStats ? "..." : String(stats?.totalLessons ?? 0)}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Đã hoàn thành"
            value={loadingStats ? "..." : String(stats?.completedLessons ?? 0)}
          />
          <StatCard
            icon="timer-outline"
            label="Đang học"
            value={loadingStats ? "..." : String(stats?.inProgressLessons ?? 0)}
          />
          <StatCard
            icon="stats-chart-outline"
            label="Điểm quiz TB"
            value={loadingStats ? "..." : `${stats?.averageQuizScore ?? 0}%`}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cập nhật hồ sơ</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Tên hiển thị</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nhập tên hiển thị"
          />
          <Pressable
            style={[styles.primaryButton, savingName && styles.buttonDisabled]}
            onPress={() => void handleUpdateName()}
            disabled={savingName || displayName.trim().length < 2}
          >
            {savingName ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
            <Text style={styles.primaryButtonText}>Lưu tên hiển thị</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Mật khẩu hiện tại</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            secureTextEntry
          />
          <Text style={styles.fieldLabel}>Mật khẩu mới</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nhập mật khẩu mới"
            secureTextEntry
          />
          <Pressable
            style={[styles.primaryButton, savingPassword && styles.buttonDisabled]}
            onPress={() => void handleChangePassword()}
            disabled={savingPassword || !currentPassword || newPassword.length < 6}
          >
            {savingPassword ? <ActivityIndicator color="#fff" /> : <Ionicons name="lock-closed-outline" size={18} color="#fff" />}
            <Text style={styles.primaryButtonText}>Cập nhật mật khẩu</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dữ liệu</Text>
        <View style={styles.card}>
          <InfoRow
            icon="book-outline"
            label="Bài học JSON"
            value={dataStatus.lessonsImported ? "Đã import từ thiết bị" : "Đang dùng dữ liệu đóng gói sẵn"}
            multiline
          />
          <Pressable
            style={[styles.primaryButton, importingLessons && styles.buttonDisabled]}
            onPress={() => void pickAndImport("lessons")}
            disabled={importingLessons}
          >
            {importingLessons ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="document-attach-outline" size={18} color="#fff" />
            )}
            <Text style={styles.primaryButtonText}>Import bài học JSON</Text>
          </Pressable>

          <InfoRow
            icon="map-outline"
            label="Lộ trình JSON"
            value={dataStatus.roadmapImported ? "Đã import từ thiết bị" : "Đang dùng dữ liệu đóng gói sẵn"}
            multiline
          />
          <Pressable
            style={[styles.primaryButton, importingRoadmap && styles.buttonDisabled]}
            onPress={() => void pickAndImport("roadmap")}
            disabled={importingRoadmap}
          >
            {importingRoadmap ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="document-attach-outline" size={18} color="#fff" />
            )}
            <Text style={styles.primaryButtonText}>Import lộ trình JSON</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
        <View style={styles.card}>
          <InfoRow icon="apps-outline" label="Tên ứng dụng" value="HSK Learning Mobile" />
          <InfoRow icon="people-outline" label="Nhà phát triển" value="Van Dinh" />
          <InfoRow icon="phone-portrait-outline" label="Version" value="1.0.0" />
        </View>
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert("Đăng xuất", "Xóa token đăng nhập hiện tại?", [
            { text: "Hủy", style: "cancel" },
            { text: "Đăng xuất", style: "destructive", onPress: () => void signOut() },
          ])
        }
      >
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.primaryButtonText}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={APP_COLORS.primaryDark} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  multiline,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={APP_COLORS.primaryDark} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, multiline && styles.infoValueMultiline]} numberOfLines={multiline ? 3 : 1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: APP_COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 18 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 30, fontWeight: "900", color: APP_COLORS.text },
  headerSubtitle: { marginTop: 6, color: APP_COLORS.muted },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: APP_COLORS.primary,
    borderRadius: 30,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "900" },
  heroMeta: { flex: 1, gap: 6 },
  name: { color: "#fff", fontSize: 26, fontWeight: "900" },
  email: { color: "#fee2e2", lineHeight: 20 },
  roleChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: { color: APP_COLORS.primaryDark, fontWeight: "800" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: APP_COLORS.text },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: 16,
    gap: 8,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: APP_COLORS.text, fontSize: 24, fontWeight: "900" },
  statLabel: { color: APP_COLORS.muted, fontWeight: "700", lineHeight: 18 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: 16,
    gap: 12,
  },
  fieldLabel: { color: APP_COLORS.text, fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    color: APP_COLORS.text,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextWrap: { flex: 1, minWidth: 0 },
  infoLabel: { color: APP_COLORS.muted, fontSize: 13, fontWeight: "700" },
  infoValue: { marginTop: 4, color: APP_COLORS.text, fontSize: 16, fontWeight: "800" },
  infoValueMultiline: { lineHeight: 20 },
  primaryButton: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: APP_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  buttonDisabled: { opacity: 0.55 },
});
