import { ClassRoom, Child, Observation, School, Teacher } from "@/types";

export const DEMO_SCHOOL: School = {
  id: "school-mta",
  name: "Maple Tree Academy",
  city: "West Los Angeles",
};

export const DEMO_TEACHER: Teacher = {
  id: "teacher-1",
  name: "Ms. Sarah Mitchell",
  schoolId: "school-mta",
  schoolName: "Maple Tree Academy",
  classIds: ["class-sugar-maples", "class-maple-leafs-2"],
  role: "lead",
};

export const SEED_CLASSES: ClassRoom[] = [
  {
    id: "class-sugar-maples",
    schoolId: "school-mta",
    name: "Sugar Maples",
    ageRange: "Infants & Toddlers",
    color: "amber",
    emoji: "🍁",
  },
  {
    id: "class-maple-leafs-1",
    schoolId: "school-mta",
    name: "Maple Leafs 1",
    ageRange: "Ages 2–3",
    color: "sage",
    emoji: "🌿",
  },
  {
    id: "class-maple-leafs-2",
    schoolId: "school-mta",
    name: "Maple Leafs 2",
    ageRange: "Ages 3–4",
    color: "amber",
    emoji: "🍃",
  },
  {
    id: "class-maple-leafs-3",
    schoolId: "school-mta",
    name: "Maple Leafs 3",
    ageRange: "Ages 4–5",
    color: "sage",
    emoji: "🌱",
  },
  {
    id: "class-big-leaves",
    schoolId: "school-mta",
    name: "Big Leaves",
    ageRange: "Ages 4–5",
    color: "amber",
    emoji: "🌳",
  },
  {
    id: "class-tk",
    schoolId: "school-mta",
    name: "TK",
    ageRange: "Transitional Kindergarten",
    color: "sage",
    emoji: "🎒",
  },
];

export const SEED_CHILDREN: Child[] = [
  // Maple Leafs 2 (Ms. Sarah's main class)
  { id: "child-maya", classId: "class-maple-leafs-2", firstName: "Maya", lastName: "Chen", dateOfBirth: "2022-08-15", initials: "MC" },
  { id: "child-liam", classId: "class-maple-leafs-2", firstName: "Liam", lastName: "Murphy", dateOfBirth: "2022-10-22", initials: "LM" },
  { id: "child-emma", classId: "class-maple-leafs-2", firstName: "Emma", lastName: "Rodriguez", dateOfBirth: "2022-07-09", initials: "ER" },
  { id: "child-noah", classId: "class-maple-leafs-2", firstName: "Noah", lastName: "Kim", dateOfBirth: "2022-11-03", initials: "NK" },
  { id: "child-sophie", classId: "class-maple-leafs-2", firstName: "Sophie", lastName: "Anderson", dateOfBirth: "2022-09-18", initials: "SA" },
  { id: "child-james", classId: "class-maple-leafs-2", firstName: "James", lastName: "Thompson", dateOfBirth: "2022-12-05", initials: "JT" },
  { id: "child-ava", classId: "class-maple-leafs-2", firstName: "Ava", lastName: "Patel", dateOfBirth: "2022-06-11", initials: "AP" },
  { id: "child-ethan", classId: "class-maple-leafs-2", firstName: "Ethan", lastName: "Williams", dateOfBirth: "2022-09-30", initials: "EW" },
  { id: "child-zoe", classId: "class-maple-leafs-2", firstName: "Zoe", lastName: "Garcia", dateOfBirth: "2022-05-04", initials: "ZG" },
  { id: "child-mateo", classId: "class-maple-leafs-2", firstName: "Mateo", lastName: "Lopez", dateOfBirth: "2022-08-22", initials: "ML" },
  { id: "child-isla", classId: "class-maple-leafs-2", firstName: "Isla", lastName: "Johnson", dateOfBirth: "2022-11-17", initials: "IJ" },
  { id: "child-oliver", classId: "class-maple-leafs-2", firstName: "Oliver", lastName: "Nguyen", dateOfBirth: "2022-07-28", initials: "ON" },

  // Sugar Maples (toddlers Sarah also oversees)
  { id: "child-luna", classId: "class-sugar-maples", firstName: "Luna", lastName: "Brooks", dateOfBirth: "2023-12-04", initials: "LB" },
  { id: "child-rio", classId: "class-sugar-maples", firstName: "Rio", lastName: "Tanaka", dateOfBirth: "2024-02-09", initials: "RT" },
  { id: "child-ben", classId: "class-sugar-maples", firstName: "Ben", lastName: "Flores", dateOfBirth: "2023-10-20", initials: "BF" },

  // Big Leaves
  { id: "child-harper", classId: "class-big-leaves", firstName: "Harper", lastName: "Lee", dateOfBirth: "2021-03-12", initials: "HL" },
  { id: "child-kai", classId: "class-big-leaves", firstName: "Kai", lastName: "Singh", dateOfBirth: "2021-05-21", initials: "KS" },

  // TK
  { id: "child-rose", classId: "class-tk", firstName: "Rose", lastName: "Martinez", dateOfBirth: "2020-11-02", initials: "RM" },
];

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const SEED_OBSERVATIONS: Observation[] = [
  {
    id: "obs-maya-1",
    childId: "child-maya",
    teacherId: "teacher-1",
    rawTranscript: "Maya was playing with blocks in the corner but got frustrated when they fell down, then tried again",
    cleanedObservation: "Maya demonstrated persistence and problem-solving when building with blocks, attempting to rebuild after initial setback.",
    tags: ["Problem Solving", "Fine Motor Skills", "Cognitive Development"],
    confirmed: true,
    source: "voice",
    createdAt: daysAgo(45),
  },
  {
    id: "obs-maya-2",
    childId: "child-maya",
    teacherId: "teacher-1",
    rawTranscript: "Maya sorted the colored blocks by shape and taught her friend how to do it",
    cleanedObservation: "Maya demonstrated advanced categorization skills and peer teaching, showing leadership and cognitive flexibility.",
    tags: ["Cognitive Development", "Social-Emotional", "Problem Solving"],
    confirmed: true,
    source: "voice",
    createdAt: daysAgo(30),
  },
  {
    id: "obs-maya-3",
    childId: "child-maya",
    teacherId: "teacher-1",
    rawTranscript: "During art time, Maya painted trees and sky and narrated: 'This is my family at the park'",
    cleanedObservation: "Maya demonstrated symbolic representation and narrative storytelling through art, expressing complex family concepts.",
    tags: ["Creative Expression", "Language & Communication", "Social-Emotional"],
    confirmed: true,
    source: "voice",
    createdAt: daysAgo(21),
  },
  {
    id: "obs-maya-4",
    childId: "child-maya",
    teacherId: "teacher-1",
    rawTranscript: "Maya helped a new student find the bathroom and showed them the water fountain",
    cleanedObservation: "Maya demonstrated spontaneous empathy and independence, helping peers navigate the classroom without adult direction.",
    tags: ["Social-Emotional", "Self-Care & Independence", "Language & Communication"],
    confirmed: true,
    source: "scan",
    createdAt: daysAgo(14),
  },
  {
    id: "obs-maya-5",
    childId: "child-maya",
    teacherId: "teacher-1",
    rawTranscript: "Maya wrote her name on artwork and recognized it on the board, copied simple words",
    cleanedObservation: "Maya demonstrated emerging literacy skills including name recognition and phonetic copying.",
    tags: ["Language & Communication", "Fine Motor Skills", "Cognitive Development"],
    confirmed: true,
    source: "voice",
    createdAt: daysAgo(7),
  },
  {
    id: "obs-maya-6",
    childId: "child-maya",
    teacherId: "teacher-1",
    rawTranscript: "Group time — Maya raised her hand to share about her weekend in complete sentences",
    cleanedObservation: "Maya demonstrated strong verbal communication skills and confidence in group settings with sustained narrative coherence.",
    tags: ["Language & Communication", "Social-Emotional", "Cognitive Development"],
    confirmed: true,
    source: "scan",
    createdAt: daysAgo(2),
  },

  { id: "obs-liam-1", childId: "child-liam", teacherId: "teacher-1", rawTranscript: "Liam lined up trucks by color during free play", cleanedObservation: "Liam demonstrated fine motor control and organizational skills during independent play.", tags: ["Fine Motor Skills", "Cognitive Development"], confirmed: true, source: "voice", createdAt: daysAgo(42) },
  { id: "obs-liam-2", childId: "child-liam", teacherId: "teacher-1", rawTranscript: "Liam played near James with trucks, showing parallel play", cleanedObservation: "Liam showed growing social awareness through parallel play engagement.", tags: ["Social-Emotional", "Cognitive Development"], confirmed: true, source: "scan", createdAt: daysAgo(28) },
  { id: "obs-liam-3", childId: "child-liam", teacherId: "teacher-1", rawTranscript: "Liam asked to borrow the red crayon from Ava using full sentences", cleanedObservation: "Liam initiated a polite peer request with clear verbal scaffolding.", tags: ["Language & Communication", "Social-Emotional"], confirmed: true, source: "voice", createdAt: daysAgo(10) },

  { id: "obs-emma-1", childId: "child-emma", teacherId: "teacher-1", rawTranscript: "Emma climbed the ladder confidently during gross motor", cleanedObservation: "Emma demonstrated strong gross motor skills and physical confidence.", tags: ["Gross Motor Skills", "Self-Care & Independence"], confirmed: true, source: "voice", createdAt: daysAgo(35) },
  { id: "obs-emma-2", childId: "child-emma", teacherId: "teacher-1", rawTranscript: "Emma sang the morning songs and knew most words", cleanedObservation: "Emma demonstrated strong language retention and enthusiasm for group activities.", tags: ["Language & Communication", "Social-Emotional"], confirmed: true, source: "scan", createdAt: daysAgo(18) },

  { id: "obs-noah-1", childId: "child-noah", teacherId: "teacher-1", rawTranscript: "Noah shy in group but engaged one-on-one with a teacher", cleanedObservation: "Noah showed emerging confidence in one-on-one communication settings.", tags: ["Social-Emotional", "Language & Communication"], confirmed: true, source: "voice", createdAt: daysAgo(20) },

  { id: "obs-sophie-1", childId: "child-sophie", teacherId: "teacher-1", rawTranscript: "Sophie played with multiple friends at centers", cleanedObservation: "Sophie demonstrated strong social engagement and peer relationship skills.", tags: ["Social-Emotional"], confirmed: true, source: "voice", createdAt: daysAgo(25) },

  { id: "obs-james-1", childId: "child-james", teacherId: "teacher-1", rawTranscript: "James used bathroom and washed hands independently", cleanedObservation: "James demonstrated independence in self-care routines with developing autonomy.", tags: ["Self-Care & Independence", "Fine Motor Skills"], confirmed: true, source: "scan", createdAt: daysAgo(12) },

  { id: "obs-ava-1", childId: "child-ava", teacherId: "teacher-1", rawTranscript: "Ava built a tall tower and counted the blocks to seven", cleanedObservation: "Ava integrated fine motor construction with early numeracy (counting to 7).", tags: ["Cognitive Development", "Fine Motor Skills"], confirmed: true, source: "voice", createdAt: daysAgo(9) },

  { id: "obs-zoe-1", childId: "child-zoe", teacherId: "teacher-1", rawTranscript: "Zoe mediated a disagreement between Ethan and Mateo over the swings", cleanedObservation: "Zoe acted as a peer mediator, demonstrating empathy and conflict-resolution language.", tags: ["Social-Emotional", "Language & Communication", "Problem Solving"], confirmed: true, source: "voice", createdAt: daysAgo(4) },
];
