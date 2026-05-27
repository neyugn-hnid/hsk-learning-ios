export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

export type LearningStats = {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  quizAttempts: number;
  averageQuizScore: number;
};

export type Vocabulary = {
  id?: string;
  chinese: string;
  pinyin: string;
  meaningVi: string;
  meaningEn?: string | null;
  exampleChinese?: string | null;
  examplePinyin?: string | null;
  exampleMeaning?: string | null;
  level?: string | null;
};

export type Grammar = {
  id: string;
  title: string;
  structure: string;
  explanation: string;
  example?: string | null;
  meaning?: string | null;
};

export type QuizType =
  | "MEANING"
  | "PINYIN"
  | "CHAR_RECOGNITION"
  | "HANZI_WRITING";

export type QuizQuestion = {
  id: string;
  type: QuizType;
  question: string;
  promptMeaning?: string | null;
  promptPinyin?: string | null;
  options: string[];
  answer: string;
};

export type LessonSummary = {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  orderNo: number;
  vocabularyCount: number;
  quizCount: number;
};

export type LessonDetail = {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  orderNo: number;
  vocabularies: Vocabulary[];
  grammars: Grammar[];
  quizzes: QuizQuestion[];
};

export type RoadmapSummary = {
  id: string;
  title: string;
  description?: string | null;
  phase: string;
  weekLabel?: string | null;
  level?: string | null;
  orderNo: number;
  duration?: string | null;
  vocabularyCount: number;
  phraseCount: number;
};

export type RoadmapDetail = {
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
