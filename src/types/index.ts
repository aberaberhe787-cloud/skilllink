export type UserRole = "provider" | "seeker" | "admin";

export type SkillCategory =
  | "Printer Repair & Maintenance"
  | "CCTV / Security Camera Installation & Troubleshooting"
  | "TV & Display Repair"
  | "Laptop & Desktop Hardware Repair"
  | "Networking & Wi-Fi Setup / Troubleshooting"
  | "Smart Home Devices & IoT Setup"
  | "Mobile Phone Hardware Repair"
  | "Projector & Audio-Visual Equipment"
  | "POS / Cash Register Systems"
  | "Basic Electrical & Appliance Repair";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
}

export interface ProviderProfile extends User {
  role: "provider";
  skills: SkillCategory[];
  experienceYears: number;
  bio: string;
  serviceRadiusKm: number;
  hourlyRate?: number;
  fixedRates?: Partial<Record<SkillCategory, number>>;
  isVerified: boolean;
  verificationStatus: "pending" | "approved" | "rejected" | "needs_info";
  badges: string[];
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTimeMinutes: number;
  isAvailable: boolean;
  totalJobsCompleted: number;
  documents?: {
    idDocument?: string;
    certificates?: string[];
  };
}

export interface SeekerProfile extends User {
  role: "seeker";
}

export interface Review {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: string;
}

export interface Job {
  id: string;
  seekerId: string;
  providerId?: string;
  category: SkillCategory;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "open" | "requested" | "accepted" | "in_progress" | "completed" | "cancelled" | "disputed";
  price: number;
  platformFee: number;
  providerPayout: number;
  preferredTime?: string;
  createdAt: string;
  completedAt?: string;
  aiMatchScore?: number;
}

export interface TrainingCourse {
  id: string;
  title: string;
  category: SkillCategory;
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  durationMinutes: number;
  isFree: boolean;
  lessonsCount: number;
}

export interface TrainingProgress {
  userId: string;
  courseId: string;
  completed: boolean;
  quizScore?: number;
  badgeEarned?: string;
  completedAt?: string;
}

export interface MatchResult {
  provider: ProviderProfile;
  score: number;
  reasons: string[];
}
