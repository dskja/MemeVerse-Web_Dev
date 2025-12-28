import { jsonStorage } from "./storage/json-storage";

const initialBadges = [
  {
    name: "First Steps",
    description: "Upload your first edit",
    imageUrl: "/badges/first_upload.svg",
    category: "milestone" as const,
    xpReward: 50,
  },
  {
    name: "Content Creator",
    description: "Upload 10 edits",
    imageUrl: "/badges/ten_uploads.svg",
    category: "milestone" as const,
    xpReward: 100,
  },
  {
    name: "Edit Master",
    description: "Upload 50 edits",
    imageUrl: "/badges/fifty_uploads.svg",
    category: "milestone" as const,
    xpReward: 250,
  },
  {
    name: "Popular Creator",
    description: "Get 100 total likes on your edits",
    imageUrl: "/badges/hundred_likes.svg",
    category: "achievement" as const,
    xpReward: 150,
  },
  {
    name: "Crowd Favorite",
    description: "Get 500 total likes on your edits",
    imageUrl: "/badges/five_hundred_likes.svg",
    category: "achievement" as const,
    xpReward: 300,
  },
  {
    name: "Engaged",
    description: "Leave your first comment",
    imageUrl: "/badges/first_comment.svg",
    category: "milestone" as const,
    xpReward: 25,
  },
  {
    name: "Conversationalist",
    description: "Leave 50 comments",
    imageUrl: "/badges/fifty_comments.svg",
    category: "achievement" as const,
    xpReward: 100,
  },
  {
    name: "Rising Star",
    description: "Get 10 followers",
    imageUrl: "/badges/ten_followers.svg",
    category: "milestone" as const,
    xpReward: 100,
  },
  {
    name: "Influencer",
    description: "Get 50 followers",
    imageUrl: "/badges/fifty_followers.svg",
    category: "achievement" as const,
    xpReward: 250,
  },
  {
    name: "Champion",
    description: "Win a weekly contest",
    imageUrl: "/badges/contest_winner.svg",
    category: "contest" as const,
    xpReward: 500,
  },
  {
    name: "Competitor",
    description: "Participate in a contest",
    imageUrl: "/badges/contest_participant.svg",
    category: "contest" as const,
    xpReward: 25,
  },
];

export async function seedBadges() {
  console.log("Seeding badges...");
  
  try {
    const existingBadges = await jsonStorage.getAllBadges();
    
    if (existingBadges.length === 0) {
      for (const badge of initialBadges) {
        await jsonStorage.createBadge(badge);
      }
      console.log("Badges seeded successfully!");
    } else {
      console.log("Badges already exist, skipping seed.");
    }
  } catch (error) {
    console.log("Error seeding badges:", error);
  }
}

export async function seedContest() {
  console.log("Seeding weekly contest...");
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  try {
    const existingContests = await jsonStorage.getActiveContests();
    
    if (existingContests.length === 0) {
      await jsonStorage.createContest({
        title: "Weekly Edit Battle",
        description: "Submit your best edit and compete for the title of Edit of the Week! Get votes from the community to win.",
        theme: "Best Original Edit",
        startDate: now,
        endDate: nextWeek,
        isActive: true,
        prizes: ["Featured placement", "500 XP bonus", "Champion badge"],
      });
      console.log("Weekly contest created!");
    } else {
      console.log("Contest already exists, skipping seed.");
    }
  } catch (error) {
    console.log("Error seeding contest:", error);
  }
}
