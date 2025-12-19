import { db } from "./db";
import { badges } from "@shared/schema";

const initialBadges = [
  {
    slug: "first_upload",
    name: "First Steps",
    description: "Upload your first meme",
    icon: "Upload",
    criteria: "first_meme_uploaded",
    xpReward: 50,
  },
  {
    slug: "ten_uploads",
    name: "Content Creator",
    description: "Upload 10 memes",
    icon: "Image",
    criteria: "memes_count_10",
    xpReward: 100,
  },
  {
    slug: "fifty_uploads",
    name: "Meme Machine",
    description: "Upload 50 memes",
    icon: "Layers",
    criteria: "memes_count_50",
    xpReward: 250,
  },
  {
    slug: "hundred_likes",
    name: "Popular Creator",
    description: "Get 100 total likes on your memes",
    icon: "Heart",
    criteria: "total_likes_100",
    xpReward: 150,
  },
  {
    slug: "five_hundred_likes",
    name: "Crowd Favorite",
    description: "Get 500 total likes on your memes",
    icon: "Flame",
    criteria: "total_likes_500",
    xpReward: 300,
  },
  {
    slug: "first_comment",
    name: "Engaged",
    description: "Leave your first comment",
    icon: "MessageCircle",
    criteria: "first_comment",
    xpReward: 25,
  },
  {
    slug: "fifty_comments",
    name: "Conversationalist",
    description: "Leave 50 comments",
    icon: "MessageSquare",
    criteria: "comments_count_50",
    xpReward: 100,
  },
  {
    slug: "ten_followers",
    name: "Rising Star",
    description: "Get 10 followers",
    icon: "Users",
    criteria: "followers_count_10",
    xpReward: 100,
  },
  {
    slug: "fifty_followers",
    name: "Influencer",
    description: "Get 50 followers",
    icon: "Crown",
    criteria: "followers_count_50",
    xpReward: 250,
  },
  {
    slug: "contest_winner",
    name: "Champion",
    description: "Win a weekly contest",
    icon: "Trophy",
    criteria: "contest_won",
    xpReward: 500,
  },
  {
    slug: "contest_participant",
    name: "Competitor",
    description: "Participate in a contest",
    icon: "Award",
    criteria: "contest_entry",
    xpReward: 25,
  },
];

export async function seedBadges() {
  console.log("Seeding badges...");
  
  for (const badge of initialBadges) {
    try {
      await db.insert(badges).values(badge).onConflictDoNothing();
    } catch (error) {
      console.log(`Badge ${badge.slug} already exists or error:`, error);
    }
  }
  
  console.log("Badges seeded successfully!");
}
