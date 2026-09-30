import {
  ProviderProfile,
  Job,
  Review,
  TrainingCourse,
  SkillCategory,
} from "@/types";

export const SKILL_CATEGORIES: SkillCategory[] = [
  "Printer Repair & Maintenance",
  "CCTV / Security Camera Installation & Troubleshooting",
  "TV & Display Repair",
  "Laptop & Desktop Hardware Repair",
  "Networking & Wi-Fi Setup / Troubleshooting",
  "Smart Home Devices & IoT Setup",
  "Mobile Phone Hardware Repair",
  "Projector & Audio-Visual Equipment",
  "POS / Cash Register Systems",
  "Basic Electrical & Appliance Repair",
];

// Demo data kept for fallback; live data comes from /api/providers after seed
export const mockProviders: ProviderProfile[] = [];
export const mockJobs: Job[] = [];
export const mockReviews: Review[] = [];
export const mockCourses: TrainingCourse[] = [];
