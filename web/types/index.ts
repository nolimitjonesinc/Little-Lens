export interface School {
  id: string;
  name: string;
  city: string;
}

export interface Teacher {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  classIds: string[];
  role: "teacher" | "lead" | "director" | "owner";
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string;
  ageRange: string;
  color: string;
  emoji: string;
}

export interface Child {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  photo?: string;
  initials: string;
  photoEnabled?: boolean;
}

export interface Observation {
  id: string;
  childId: string;
  teacherId: string;
  rawTranscript: string;
  cleanedObservation: string;
  tags: string[];
  confirmed: boolean;
  source: "voice" | "scan" | "manual";
  photoUrl?: string;
  createdAt: string;
}

export interface PendingScanItem {
  childName: string;
  childId?: string;
  note: string;
  confidence: "high" | "medium" | "low";
}

export interface Report {
  id: string;
  childId: string;
  periodStart: string;
  periodEnd: string;
  domainSummaries: Record<string, string>;
  overallNarrative: string;
  generatedAt: string;
}

export const DEVELOPMENTAL_TAGS = [
  "Cognitive Development",
  "Fine Motor Skills",
  "Gross Motor Skills",
  "Social-Emotional",
  "Language & Communication",
  "Creative Expression",
  "Self-Care & Independence",
  "Problem Solving",
] as const;

export type DevelopmentalTag = (typeof DEVELOPMENTAL_TAGS)[number];

export const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Cognitive Development": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  "Fine Motor Skills": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  "Gross Motor Skills": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  "Social-Emotional": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-500" },
  "Language & Communication": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  "Creative Expression": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  "Self-Care & Independence": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  "Problem Solving": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
};
