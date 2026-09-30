import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding SkillLink database...");

  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@skilllink.local" },
    update: {},
    create: {
      email: "admin@skilllink.local",
      name: "Admin User",
      role: "admin",
      hashedPassword: adminHash,
    },
  });
  console.log("Admin:", admin.email, "(password: admin123)");

  const seekerHash = await bcrypt.hash("seeker123", 12);
  await prisma.user.upsert({
    where: { email: "seeker@skilllink.local" },
    update: {},
    create: {
      email: "seeker@skilllink.local",
      name: "Mary Akinyi",
      role: "seeker",
      hashedPassword: seekerHash,
      phone: "+254700000001",
    },
  });
  console.log("Seeker: seeker@skilllink.local (password: seeker123)");

  const providersData = [
    {
      email: "james@skilllink.local",
      name: "James Otieno",
      phone: "+254712345678",
      bio: "Experienced hardware technician specializing in printers and laptops.",
      experienceYears: 7,
      skills: ["Printer Repair & Maintenance", "Laptop & Desktop Hardware Repair"],
      rates: [
        { category: "Printer Repair & Maintenance", amount: 2500 },
        { category: "Laptop & Desktop Hardware Repair", amount: 3500 },
      ],
      lat: -1.286389,
      lng: 36.817223,
      address: "Nairobi CBD",
      badges: '["Advanced","Certified"]',
      rating: 4.9,
      reviewCount: 48,
      isVerified: true,
      verificationStatus: "approved",
    },
    {
      email: "amina@skilllink.local",
      name: "Amina Hassan",
      phone: "+254723456789",
      bio: "CCTV and networking expert. Clean installations and reliable troubleshooting.",
      experienceYears: 5,
      skills: [
        "CCTV / Security Camera Installation & Troubleshooting",
        "Networking & Wi-Fi Setup / Troubleshooting",
      ],
      rates: [
        { category: "CCTV / Security Camera Installation & Troubleshooting", amount: 5000 },
        { category: "Networking & Wi-Fi Setup / Troubleshooting", amount: 3000 },
      ],
      lat: -1.2921,
      lng: 36.8219,
      address: "Westlands, Nairobi",
      badges: '["Intermediate","Advanced"]',
      rating: 4.7,
      reviewCount: 31,
      isVerified: true,
      verificationStatus: "approved",
    },
    {
      email: "pending@skilllink.local",
      name: "Peter Kamau",
      phone: "+254756789012",
      bio: "POS systems and business printers. Awaiting verification.",
      experienceYears: 6,
      skills: ["POS / Cash Register Systems", "Printer Repair & Maintenance"],
      rates: [
        { category: "POS / Cash Register Systems", amount: 3500 },
        { category: "Printer Repair & Maintenance", amount: 2200 },
      ],
      lat: -1.27,
      lng: 36.81,
      address: "Eastleigh, Nairobi",
      badges: '["Beginner"]',
      rating: 4.4,
      reviewCount: 9,
      isVerified: false,
      verificationStatus: "pending",
    },
  ];

  for (const p of providersData) {
    const hash = await bcrypt.hash("provider123", 12);
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        phone: p.phone,
        role: "provider",
        hashedPassword: hash,
      },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: p.bio,
        experienceYears: p.experienceYears,
        isVerified: p.isVerified,
        verificationStatus: p.verificationStatus,
        badges: p.badges,
        rating: p.rating,
        reviewCount: p.reviewCount,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        isAvailable: true,
        serviceRadiusKm: 15,
      },
      create: {
        userId: user.id,
        bio: p.bio,
        experienceYears: p.experienceYears,
        isVerified: p.isVerified,
        verificationStatus: p.verificationStatus,
        badges: p.badges,
        rating: p.rating,
        reviewCount: p.reviewCount,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        isAvailable: true,
        serviceRadiusKm: 15,
      },
    });

    for (const skill of p.skills) {
      await prisma.providerSkill.upsert({
        where: { providerId_category: { providerId: profile.id, category: skill } },
        update: {},
        create: { providerId: profile.id, category: skill },
      });
    }

    for (const rate of p.rates) {
      await prisma.providerRate.upsert({
        where: {
          providerId_category: { providerId: profile.id, category: rate.category },
        },
        update: { amount: rate.amount },
        create: {
          providerId: profile.id,
          category: rate.category,
          amount: rate.amount,
        },
      });
    }

    console.log("Provider:", p.email, "(password: provider123)");
  }

  const courses = [
    {
      id: "printer-troubleshooting-fundamentals",
      title: "Printer Troubleshooting Fundamentals",
      category: "Printer Repair & Maintenance",
      level: "Beginner",
      description: "Learn the most common printer problems and how to diagnose them quickly.",
      durationMinutes: 45,
      isFree: true,
      lessonsCount: 6,
    },
    {
      id: "cctv-installation-best-practices",
      title: "CCTV Installation Best Practices",
      category: "CCTV / Security Camera Installation & Troubleshooting",
      level: "Intermediate",
      description: "Proper camera placement, cabling, and NVR setup.",
      durationMinutes: 90,
      isFree: true,
      lessonsCount: 8,
    },
    {
      id: "advanced-laptop-hardware-diagnostics",
      title: "Advanced Laptop Hardware Diagnostics",
      category: "Laptop & Desktop Hardware Repair",
      level: "Advanced",
      description: "Component-level diagnosis and board repair techniques.",
      durationMinutes: 120,
      isFree: false,
      lessonsCount: 10,
    },
  ];

  for (const c of courses) {
    await prisma.trainingCourse.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log("Training courses seeded");
  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
