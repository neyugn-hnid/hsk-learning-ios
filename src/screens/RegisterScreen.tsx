import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
import { APP_COLORS } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { RootStackParamList } from "@/navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "AuthRegister">;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    try {
      setSubmitting(true);
      await signUp(name, email, password);
    } catch (error) {
      Alert.alert("Đăng ký thất bại", error instanceof Error ? error.message : "Có lỗi xảy ra.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLogoBadge}>
            <Ionicons name="school" size={28} color="#dc2626" />
          </View>
          <Text style={styles.cardKicker}>HSK Learning</Text>
        </View>
        <Text style={styles.cardTitle}>Đăng ký</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Họ tên</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={APP_COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Nhập họ tên"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={APP_COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={APP_COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Ít nhất 6 ký tự"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={APP_COLORS.muted}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={() => void handleRegister()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Tạo tài khoản</Text>
            </>
          )}
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Đã có tài khoản?</Text>
          <Text style={styles.linkAccent}> Quay lại đăng nhập</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff8f4" },
  content: { padding: 20, justifyContent: "center", flexGrow: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLogoBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  cardKicker: {
    color: APP_COLORS.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cardTitle: { color: APP_COLORS.text, fontSize: 26, fontWeight: "900", textAlign: "center" },
  cardSubtitle: { color: APP_COLORS.muted, lineHeight: 22 },
  field: { gap: 8 },
  label: { color: APP_COLORS.text, fontWeight: "800" },
  inputWrap: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 18,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, color: APP_COLORS.text, fontSize: 16, paddingVertical: 14 },
  eyeButton: { padding: 4 },
  primaryButton: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: APP_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 6 },
  linkText: { color: APP_COLORS.muted, fontWeight: "700" },
  linkAccent: { color: APP_COLORS.primaryDark, fontWeight: "800" },
});
