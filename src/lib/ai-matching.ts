import { ProviderProfile, SkillCategory, MatchResult } from "@/types";

interface MatchInput {
  category: SkillCategory;
  seekerLat: number;
  seekerLng: number;
  maxDistanceKm?: number;
  preferTopOnly?: boolean;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateMatchScore(
  provider: ProviderProfile,
  input: MatchInput
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (provider.skills.includes(input.category)) {
    score += 30;
    reasons.push("Exact skill match");
  } else {
    return { score: 0, reasons: ["No skill match"] };
  }

  if (provider.location) {
    const dist = haversineDistance(
      input.seekerLat,
      input.seekerLng,
      provider.location.lat,
      provider.location.lng
    );
    if (dist <= provider.serviceRadiusKm) {
      const distScore = Math.max(0, 25 - dist * 1.2);
      score += distScore;
      reasons.push(`${dist.toFixed(1)} km away`);
    } else {
      reasons.push("Outside service radius");
    }
  }

  if (provider.isVerified) {
    score += 8;
    reasons.push("Verified");
  }
  if (provider.badges.includes("Certified")) {
    score += 7;
    reasons.push("Certified expert");
  } else if (provider.badges.includes("Advanced")) {
    score += 5;
    reasons.push("Advanced badge");
  } else if (provider.badges.includes("Intermediate")) {
    score += 3;
  }

  const ratingScore = (provider.rating / 5) * 10;
  const reviewBonus = Math.min(5, provider.reviewCount / 10);
  score += ratingScore + reviewBonus;
  reasons.push(`${provider.rating}★ (${provider.reviewCount} reviews)`);

  score += (provider.completionRate / 100) * 6;
  if (provider.responseTimeMinutes <= 20) {
    score += 4;
    reasons.push("Fast responder");
  } else if (provider.responseTimeMinutes <= 40) {
    score += 2;
  }

  if (provider.isAvailable) {
    score += 5;
    reasons.push("Currently available");
  }

  score = Math.min(100, Math.round(score));
  return { score, reasons };
}

export function getAIMatches(
  providers: ProviderProfile[],
  input: MatchInput
): MatchResult[] {
  const results: MatchResult[] = providers
    .map((provider) => {
      const { score, reasons } = calculateMatchScore(provider, input);
      return { provider, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (input.preferTopOnly) {
    return results.filter((r) => r.score >= 75).slice(0, 8);
  }

  return results;
}
