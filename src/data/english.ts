import rawEnglishLessons from "./english-lessons.json";

export type EnglishLevel = "A1" | "A2" | "B1" | "B2";

export type EnglishWord = {
  word: string;
  part_of_speech: string[];
  meaning_vi: string;
  topic_vi?: string;
  example_en?: string;
  example_vi?: string;
  pronunciation_ipa?: {
    uk: string[];
    us: string[];
  };
};

export type EnglishLesson = {
  id: string;
  number: number;
  title: string;
  topics: string[];
  total_words: number;
  words: EnglishWord[];
};

export type EnglishLevelGroup = {
  level: EnglishLevel;
  lesson_count: number;
  word_count: number;
  lessons: EnglishLesson[];
};

type EnglishLessonsData = {
  title: string;
  total_lessons: number;
  total_words: number;
  levels: EnglishLevelGroup[];
};

const englishLessonsData = rawEnglishLessons as EnglishLessonsData;

export const ENGLISH_LEVELS = englishLessonsData.levels;
export const ENGLISH_LESSONS = ENGLISH_LEVELS.flatMap((group) =>
  group.lessons.map((lesson) => ({ ...lesson, level: group.level })),
);

export function getEnglishLessons(level: EnglishLevel) {
  return ENGLISH_LEVELS.find((group) => group.level === level)?.lessons ?? [];
}

export function findEnglishLesson(lessonId: string) {
  return ENGLISH_LESSONS.find((lesson) => lesson.id === lessonId) ?? null;
}
