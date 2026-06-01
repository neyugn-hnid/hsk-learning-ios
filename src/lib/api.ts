import * as FileSystem from "expo-file-system";
import bundledLessonsData from "@/data/lessons.json";
import bundledRoadmapData from "@/data/roadmap.json";
import bundledHsk20Data from "@/data/hsk2.0.json";
import bundledHsk30Data from "@/data/hsk3.0.json";
import { getStoredUsers, setStoredUsers } from "@/lib/storage";
import type {
  LearningStats,
  LessonDetail,
  LessonSummary,
  QuizQuestion,
  RoadmapDetail,
  RoadmapSummary,
  User,
  Vocabulary,
} from "@/types";

type LocalUser = User & { password: string };

type RawRow = Record<string, unknown>;

type OfflineLesson = {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  orderNo: number;
  vocabularies: Vocabulary[];
  grammars: LessonDetail["grammars"];
  quizzes: QuizQuestion[];
};

type OfflineRoadmap = {
  id: string;
  title: string;
  description?: string | null;
  phase: string;
  weekLabel?: string | null;
  level?: string | null;
  orderNo: number;
  duration?: string | null;
  objectives: string[];
  materials: string[];
  vocabulary: Vocabulary[];
  phrases: Vocabulary[];
};

type OfflineStructuredLesson = {
  id: string;
  title: string;
  description?: string | null;
  phase: string;
  level: string;
  orderNo: number;
  objectives: string[];
  vocabularies: Vocabulary[];
  grammars: LessonDetail["grammars"];
  quizzes: QuizQuestion[];
};

const defaultUsers: LocalUser[] = [
  {
    id: "local-admin",
    name: "Van Dinh Admin",
    email: "nvandinh.dev@gmail.com",
    role: "ADMIN",
    password: "Nvd@245203",
  },
];

const lessonsImportUri = `${FileSystem.documentDirectory ?? ""}offline-lessons.json`;
const roadmapImportUri = `${FileSystem.documentDirectory ?? ""}offline-roadmap.json`;

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function mapUser(user: LocalUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function ensureArrayPayload(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} phải là một mảng JSON.`);
  }

  return value as RawRow[];
}

function mapVocabulary(row: RawRow, id: string): Vocabulary {
  return {
    id,
    chinese: String(row.chinese ?? ""),
    pinyin: String(row.pinyin ?? ""),
    meaningVi: String(row.meaningVi ?? ""),
    meaningEn: row.meaningEn == null ? null : String(row.meaningEn),
    exampleChinese: row.exampleChinese == null ? null : String(row.exampleChinese),
    examplePinyin: row.examplePinyin == null ? null : String(row.examplePinyin),
    exampleMeaning: row.exampleMeaning == null ? null : String(row.exampleMeaning),
    level: row.level == null ? null : String(row.level),
  };
}

function normalizeLessons(raw: unknown): OfflineLesson[] {
  return ensureArrayPayload(raw, "File bài học").map((lesson, lessonIndex) => ({
    id: String(lesson.id ?? `lesson-${lessonIndex + 1}`),
    title: String(lesson.title ?? `Bài ${lessonIndex + 1}`),
    description: lesson.description == null ? null : String(lesson.description),
    level: String(lesson.level ?? "HSK1"),
    orderNo: Number(lesson.orderNo ?? lessonIndex + 1),
    vocabularies: Array.isArray(lesson.vocabularies)
      ? lesson.vocabularies.map((item, vocabIndex) =>
          mapVocabulary(item as RawRow, `vocab-${lessonIndex}-${vocabIndex}`),
        )
      : [],
    grammars: Array.isArray(lesson.grammars)
      ? lesson.grammars.map((item, grammarIndex) => {
          const row = item as RawRow;
          return {
            id: `grammar-${lessonIndex}-${grammarIndex}`,
            title: String(row.title ?? ""),
            structure: String(row.structure ?? ""),
            explanation: String(row.explanation ?? ""),
            example: row.example == null ? null : String(row.example),
            meaning: row.meaning == null ? null : String(row.meaning),
          };
        })
      : [],
    quizzes: Array.isArray(lesson.quizzes)
      ? lesson.quizzes.map((item, quizIndex) => {
          const row = item as RawRow;
          return {
            id: `quiz-${lessonIndex}-${quizIndex}`,
            type: String(row.type ?? "MEANING") as QuizQuestion["type"],
            question: String(row.question ?? ""),
            promptMeaning: row.promptMeaning == null ? null : String(row.promptMeaning),
            promptPinyin: row.promptPinyin == null ? null : String(row.promptPinyin),
            options: Array.isArray(row.options) ? row.options.map((option) => String(option)) : [],
            answer: String(row.answer ?? ""),
          };
        })
      : [],
  }));
}

function normalizeRoadmap(raw: unknown): OfflineRoadmap[] {
  return ensureArrayPayload(raw, "File lộ trình").map((item, index) => ({
    id: String(item.id ?? `roadmap-${index + 1}`),
    title: String(item.title ?? `Buổi ${index + 1}`),
    description: item.description == null ? null : String(item.description),
    phase: String(item.phase ?? "Lộ trình"),
    weekLabel: item.weekLabel == null ? null : String(item.weekLabel),
    level: item.level == null ? null : String(item.level),
    orderNo: Number(item.orderNo ?? index + 1),
    duration: item.duration == null ? null : String(item.duration),
    objectives: Array.isArray(item.objectives) ? item.objectives.map((value) => String(value)) : [],
    materials: Array.isArray(item.materials) ? item.materials.map((value) => String(value)) : [],
    vocabulary: Array.isArray(item.vocabulary)
      ? item.vocabulary.map((row, vocabIndex) =>
          mapVocabulary(row as RawRow, `roadmap-vocab-${index}-${vocabIndex}`),
        )
      : [],
    phrases: Array.isArray(item.phrases)
      ? item.phrases.map((row, phraseIndex) =>
          mapVocabulary(row as RawRow, `roadmap-phrase-${index}-${phraseIndex}`),
        )
      : [],
  }));
}

function normalizeStructuredLessons(raw: unknown, label: string, idPrefix: string): OfflineStructuredLesson[] {
  return ensureArrayPayload(raw, label).map((lesson, lessonIndex) => {
    const phase = String(lesson.phase ?? label);
    const orderNo = Number(lesson.orderNo ?? lessonIndex + 1);
    const normalizedPhase = normalizeText(phase).replace(/[^a-z0-9]+/g, "-");

    return {
      id: String(lesson.id ?? `${idPrefix}-${normalizedPhase}-${lessonIndex + 1}`),
      title: String(lesson.title ?? `Bài ${orderNo}`),
      description: lesson.description == null ? null : String(lesson.description),
      phase,
      level: String(lesson.level ?? phase),
      orderNo,
      objectives: Array.isArray(lesson.objectives) ? lesson.objectives.map((value) => String(value)) : [],
      vocabularies: Array.isArray(lesson.vocabulary)
        ? lesson.vocabulary.map((item, vocabIndex) =>
            mapVocabulary(item as RawRow, `${idPrefix}-vocab-${lessonIndex}-${vocabIndex}`),
          )
        : [],
      grammars: Array.isArray(lesson.grammars)
        ? lesson.grammars.map((item, grammarIndex) => {
            const row = item as RawRow;
            return {
              id: `${idPrefix}-grammar-${lessonIndex}-${grammarIndex}`,
              title: String(row.title ?? ""),
              structure: String(row.structure ?? ""),
              explanation: String(row.explanation ?? ""),
              example: row.example == null ? null : String(row.example),
              meaning: row.meaning == null ? null : String(row.meaning),
            };
          })
        : [],
      quizzes: Array.isArray(lesson.quizzes)
        ? lesson.quizzes.map((item, quizIndex) => {
            const row = item as RawRow;
            return {
              id: `${idPrefix}-quiz-${lessonIndex}-${quizIndex}`,
              type: String(row.type ?? "MEANING") as QuizQuestion["type"],
              question: String(row.question ?? ""),
              promptMeaning: row.promptMeaning == null ? null : String(row.promptMeaning),
              promptPinyin: row.promptPinyin == null ? null : String(row.promptPinyin),
              options: Array.isArray(row.options) ? row.options.map((option) => String(option)) : [],
              answer: String(row.answer ?? ""),
            };
          })
        : [],
    };
  });
}

async function loadUsers() {
  const stored = await getStoredUsers();
  if (!stored) {
    await saveUsers(defaultUsers);
    return [...defaultUsers];
  }

  try {
    const users = JSON.parse(stored) as LocalUser[];
    if (users.length === 0) {
      await saveUsers(defaultUsers);
      return [...defaultUsers];
    }
    return users;
  } catch {
    await saveUsers(defaultUsers);
    return [...defaultUsers];
  }
}

async function saveUsers(users: LocalUser[]) {
  await setStoredUsers(JSON.stringify(users));
}

async function readImportedJson(uri: string) {
  if (!FileSystem.documentDirectory) return null;

  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return null;

  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

async function writeImportedJson(uri: string, value: unknown) {
  if (!FileSystem.documentDirectory) {
    throw new Error("Thiết bị không hỗ trợ vùng lưu dữ liệu offline.");
  }

  await FileSystem.writeAsStringAsync(uri, JSON.stringify(value, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

async function getLessonsDataset() {
  const imported = await readImportedJson(lessonsImportUri);
  return normalizeLessons(imported ?? bundledLessonsData);
}

async function getRoadmapDataset() {
  const imported = await readImportedJson(roadmapImportUri);
  return normalizeRoadmap(imported ?? bundledRoadmapData);
}

function getHsk30Dataset() {
  return normalizeStructuredLessons(bundledHsk30Data, "File HSK 3.0", "hsk30");
}

function getHsk20Dataset() {
  return normalizeStructuredLessons(bundledHsk20Data, "File HSK 2.0", "hsk20");
}

export async function getOfflineDataStatus() {
  const [lessonsInfo, roadmapInfo] = await Promise.all([
    FileSystem.getInfoAsync(lessonsImportUri),
    FileSystem.getInfoAsync(roadmapImportUri),
  ]);

  return {
    lessonsImported: lessonsInfo.exists,
    roadmapImported: roadmapInfo.exists,
  };
}

export async function importLessonsJson(payload: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("File bài học không phải JSON hợp lệ.");
  }

  const lessons = normalizeLessons(parsed);
  await writeImportedJson(lessonsImportUri, parsed);
  return { count: lessons.length };
}

export async function importRoadmapJson(payload: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error("File lộ trình không phải JSON hợp lệ.");
  }

  const items = normalizeRoadmap(parsed);
  await writeImportedJson(roadmapImportUri, parsed);
  return { count: items.length };
}

export async function mobileLogin(email: string, password: string) {
  const users = await loadUsers();
  const normalizedEmail = normalizeText(email);
  const user = users.find(
    (item) => normalizeText(item.email) === normalizedEmail && item.password === password,
  );

  if (!user) {
    throw new Error("Email hoặc mật khẩu không đúng.");
  }

  return {
    token: user.id,
    user: mapUser(user),
  };
}

export async function mobileRegister(name: string, email: string, password: string) {
  const trimmedName = name.trim();
  const normalizedEmail = normalizeText(email);

  if (!trimmedName || !normalizedEmail || password.length < 6) {
    throw new Error("Vui lòng nhập đủ thông tin, mật khẩu ít nhất 6 ký tự.");
  }

  const users = await loadUsers();
  const exists = users.some((item) => normalizeText(item.email) === normalizedEmail);
  if (exists) {
    throw new Error("Email đã tồn tại.");
  }

  const user: LocalUser = {
    id: `local-${Date.now()}`,
    name: trimmedName,
    email: normalizedEmail,
    role: "USER",
    password,
  };

  users.push(user);
  await saveUsers(users);

  return {
    token: user.id,
    user: mapUser(user),
  };
}

export async function fetchMe(token: string) {
  const users = await loadUsers();
  const user = users.find((item) => item.id === token);
  if (!user) {
    throw new Error("Phiên đăng nhập không tồn tại.");
  }

  return { user: mapUser(user) };
}

export async function updateProfileName(token: string, name: string) {
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    throw new Error("Tên hiển thị phải có ít nhất 2 ký tự.");
  }

  const users = await loadUsers();
  const index = users.findIndex((item) => item.id === token);
  if (index < 0) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  users[index] = { ...users[index], name: trimmedName };
  await saveUsers(users);

  return {
    user: mapUser(users[index]),
    message: "Đã cập nhật tên hiển thị.",
  };
}

export async function changePassword(token: string, currentPassword: string, newPassword: string) {
  if (newPassword.length < 6) {
    throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
  }

  const users = await loadUsers();
  const index = users.findIndex((item) => item.id === token);
  if (index < 0) {
    throw new Error("Bạn chưa đăng nhập.");
  }
  if (users[index].password !== currentPassword) {
    throw new Error("Mật khẩu hiện tại không đúng.");
  }

  users[index] = { ...users[index], password: newPassword };
  await saveUsers(users);

  return { message: "Đã đổi mật khẩu." };
}

export async function fetchLearningStats(_token: string) {
  const lessons = await getLessonsDataset();
  const stats: LearningStats = {
    totalLessons: lessons.length,
    completedLessons: 0,
    inProgressLessons: 0,
    quizAttempts: 0,
    averageQuizScore: 0,
  };

  return { stats };
}

export async function fetchLessons(params?: { level?: string; q?: string }) {
  const normalizedQuery = normalizeText(params?.q || "");
  const source = await getLessonsDataset();
  const lessons = source
    .filter((item) => (params?.level ? item.level === params.level : true))
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        normalizeText(item.title).includes(normalizedQuery) ||
        normalizeText(item.description || "").includes(normalizedQuery)
      );
    })
    .map<LessonSummary>((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      level: item.level,
      orderNo: item.orderNo,
      vocabularyCount: item.vocabularies.length,
      quizCount: item.quizzes.length,
    }));

  return { lessons };
}

export async function fetchHsk20Lessons(params?: { level?: string; q?: string }) {
  const normalizedQuery = normalizeText(params?.q || "");
  const source = getHsk20Dataset();
  const lessons = source
    .filter((item) => (params?.level ? item.level === params.level || item.phase === params.level : true))
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        normalizeText(item.title).includes(normalizedQuery) ||
        normalizeText(item.description || "").includes(normalizedQuery)
      );
    })
    .map<LessonSummary>((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      level: item.level,
      orderNo: item.orderNo,
      vocabularyCount: item.vocabularies.length,
      quizCount: item.quizzes.length,
    }));

  return { lessons };
}

export async function fetchHsk30Lessons(params?: { level?: string; q?: string }) {
  const normalizedQuery = normalizeText(params?.q || "");
  const source = getHsk30Dataset();
  const lessons = source
    .filter((item) => (params?.level ? item.level === params.level || item.phase === params.level : true))
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        normalizeText(item.title).includes(normalizedQuery) ||
        normalizeText(item.description || "").includes(normalizedQuery)
      );
    })
    .map<LessonSummary>((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      level: item.level,
      orderNo: item.orderNo,
      vocabularyCount: item.vocabularies.length,
      quizCount: item.quizzes.length,
    }));

  return { lessons };
}

export async function fetchLessonDetail(id: string) {
  const lessons = await getLessonsDataset();
  const hsk20Lessons = getHsk20Dataset();
  const hsk30Lessons = getHsk30Dataset();
  const lesson =
    lessons.find((item) => item.id === id) ??
    hsk20Lessons.find((item) => item.id === id) ??
    hsk30Lessons.find((item) => item.id === id);
  if (!lesson) {
    throw new Error("Không tìm thấy bài học.");
  }

  return { lesson };
}

export async function fetchRoadmap(_token?: string, params?: { phase?: string; q?: string }) {
  const normalizedQuery = normalizeText(params?.q || "");
  const source = await getRoadmapDataset();
  const items = source
    .filter((item) => (params?.phase ? item.phase === params.phase : true))
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        normalizeText(item.title).includes(normalizedQuery) ||
        normalizeText(item.description || "").includes(normalizedQuery)
      );
    })
    .map<RoadmapSummary>((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      phase: item.phase,
      weekLabel: item.weekLabel,
      level: item.level,
      orderNo: item.orderNo,
      duration: item.duration,
      vocabularyCount: item.vocabulary.length,
      phraseCount: item.phrases.length,
    }));

  return { items };
}

export async function fetchRoadmapDetail(_token: string | null | undefined, id: string) {
  const roadmaps = await getRoadmapDataset();
  const roadmap = roadmaps.find((item) => item.id === id);
  if (!roadmap) {
    throw new Error("Không tìm thấy buổi học.");
  }

  return { roadmap };
}

export async function scorePronunciation(_audioUri: string, targetText: string) {
  return {
    transcript: "",
    expectedText: targetText,
    score: 0,
    feedback: "Chế độ offline: chưa hỗ trợ nhận diện và chấm phát âm tự động.",
  };
}
