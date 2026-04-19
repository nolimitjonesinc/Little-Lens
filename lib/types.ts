export interface School {
  id: string;
  name: string;
  city: string;
}

export interface Teacher {
  id: string;
  name: string;
  schoolName: string;
  classIds?: string[];
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  name: string;
  ageRange: string;
  emoji: string;
}

export interface Child {
  id: string;
  teacherId: string;
  classId?: string;
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
  rawTranscript: string;
  cleanedObservation: string;
  tags: string[];
  confirmed: boolean;
  source?: "voice" | "scan" | "manual";
  photoUri?: string;
  createdAt: Date;
}

export interface PendingScanItem {
  childName: string;
  childId?: string | null;
  note: string;
  tags?: string[];
  confidence: "high" | "medium" | "low";
}

export interface DevelopmentalDomain {
  name: string;
  summary: string;
}

export interface Report {
  id: string;
  childId: string;
  periodStart: Date;
  periodEnd: Date;
  domainSummaries: Record<string, string>;
  overallNarrative: string;
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
];

export const DEVELOPMENTAL_DOMAINS = [
  "Physical Development",
  "Cognitive Development",
  "Social-Emotional Development",
  "Language & Communication",
  "Creative & Artistic Expression",
];
