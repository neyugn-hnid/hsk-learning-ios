import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabParamList } from "@/navigation/AppNavigator";

type Props = BottomTabScreenProps<MainTabParamList, "Home">;

export function LanguageHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Lingua logo"
          />
        </View>
        <View>
          <Text style={styles.brandName}>LINGUA</Text>
          <Text style={styles.brandCaption}>HỌC MỖI NGÀY</Text>
        </View>
        <View style={styles.dailyPill}>
          <Ionicons name="sunny" size={14} color="#D78B24" />
          <Text style={styles.dailyPillText}>Ngày mới</Text>
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.greeting}>Xin chào! 👋</Text>
        <Text style={styles.title}>Hôm nay bạn muốn học gì?</Text>
        <Text style={styles.subtitle}>Chọn một ngôn ngữ và bắt đầu bài học của bạn.</Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>CHỌN NGÔN NGỮ</Text>
        <Text style={styles.sectionCount}>02 khóa học</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bắt đầu học tiếng Trung"
        onPress={() => navigation.navigate("HSK30")}
        style={({ pressed }) => [styles.courseCard, pressed && styles.cardPressed]}
      >
        <View style={[styles.artCircle, styles.chineseArtCircle]}>
          <Text style={styles.chineseArtText}>汉</Text>
        </View>
        <View style={styles.cardHeader}>
          <View style={[styles.courseIcon, styles.chineseIcon]}>
            <Ionicons name="chatbubble-ellipses" size={21} color={CHINESE_ACCENT} />
          </View>
          <View style={[styles.levelTag, styles.chineseLevelTag]}>
            <Text style={[styles.levelTagText, { color: CHINESE_ACCENT }]}>HSK 3.0</Text>
          </View>
        </View>
        <Text style={styles.courseTitle}>Tiếng Trung</Text>
        <Text style={styles.courseDescription}>Từ vựng và bài học theo lộ trình HSK.</Text>
        <View style={styles.cardActionRow}>
          <Text style={[styles.cardActionText, { color: CHINESE_ACCENT }]}>Khám phá bài học</Text>
          <View style={[styles.arrowButton, { backgroundColor: CHINESE_ACCENT }]}>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </View>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bắt đầu học tiếng Anh"
        onPress={() => navigation.navigate("English")}
        style={({ pressed }) => [styles.courseCard, pressed && styles.cardPressed]}
      >
        <View style={[styles.artCircle, styles.englishArtCircle]}>
          <Text style={styles.englishArtText}>Aa</Text>
        </View>
        <View style={styles.cardHeader}>
          <View style={[styles.courseIcon, styles.englishIcon]}>
            <Ionicons name="globe-outline" size={22} color={ENGLISH_ACCENT} />
          </View>
          <View style={[styles.levelTag, styles.englishLevelTag]}>
            <Text style={[styles.levelTagText, { color: ENGLISH_ACCENT }]}>OXFORD · A1–B2</Text>
          </View>
        </View>
        <Text style={styles.courseTitle}>Tiếng Anh</Text>
        <Text style={styles.courseDescription}>Từ vựng, phát âm và ví dụ thực tế.</Text>
        <View style={styles.cardActionRow}>
          <Text style={[styles.cardActionText, { color: ENGLISH_ACCENT }]}>Khám phá bài học</Text>
          <View style={[styles.arrowButton, { backgroundColor: ENGLISH_ACCENT }]}>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </View>
        </View>
      </Pressable>

      <View style={styles.footerNote}>
        <Ionicons name="heart" size={15} color="#EC7770" />
        <Text style={styles.footerText}>Học một chút mỗi ngày, tiến bộ mỗi ngày.</Text>
      </View>
    </ScrollView>
  );
}

const CHINESE_ACCENT = "#C9473B";
const ENGLISH_ACCENT = "#3765C8";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6F8" },
  content: { paddingHorizontal: 22, gap: 0 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F4F7FC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brandLogo: { width: 40, height: 40 },
  brandName: { color: "#17243B", fontSize: 14, letterSpacing: 1.5, fontWeight: "900" },
  brandCaption: { marginTop: 2, color: "#96A0AF", fontSize: 9, letterSpacing: 1.4, fontWeight: "800" },
  dailyPill: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7E8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dailyPillText: { color: "#A86B19", fontSize: 11, fontWeight: "800" },
  intro: { marginTop: 34, marginBottom: 26 },
  greeting: { color: "#7C8797", fontSize: 14, fontWeight: "700" },
  title: { marginTop: 8, maxWidth: 330, color: "#17243B", fontSize: 31, lineHeight: 38, letterSpacing: -0.8, fontWeight: "900" },
  subtitle: { marginTop: 9, color: "#7C8797", fontSize: 14, lineHeight: 21 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#8A94A3", fontSize: 10, letterSpacing: 1.5, fontWeight: "900" },
  sectionCount: { color: "#A1A9B5", fontSize: 11, fontWeight: "700" },
  courseCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: 202,
    marginBottom: 14,
    padding: 19,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E9ECF1",
    shadowColor: "#17243B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 2,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  artCircle: { position: "absolute", right: -15, top: -27, width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center" },
  chineseArtCircle: { backgroundColor: "#FFF2F0" },
  englishArtCircle: { backgroundColor: "#EFF4FF" },
  chineseArtText: { marginTop: 21, marginLeft: 13, color: "#F1D4D0", fontSize: 54, fontWeight: "900" },
  englishArtText: { marginTop: 20, marginLeft: 14, color: "#D9E5FC", fontSize: 35, letterSpacing: -2, fontWeight: "900" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  courseIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  chineseIcon: { backgroundColor: "#FFF0EE" },
  englishIcon: { backgroundColor: "#EEF3FF" },
  levelTag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chineseLevelTag: { backgroundColor: "#FFF5F3" },
  englishLevelTag: { backgroundColor: "#F2F6FF" },
  levelTagText: { fontSize: 10, letterSpacing: 0.5, fontWeight: "900" },
  courseTitle: { marginTop: 16, color: "#17243B", fontSize: 22, letterSpacing: -0.3, fontWeight: "900" },
  courseDescription: { marginTop: 5, maxWidth: 260, color: "#7C8797", fontSize: 13, lineHeight: 19 },
  cardActionRow: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardActionText: { fontSize: 12, fontWeight: "900" },
  arrowButton: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  footerNote: { marginTop: 3, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  footerText: { color: "#9AA3B0", fontSize: 11, fontWeight: "600" },
});
