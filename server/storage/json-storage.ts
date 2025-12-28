/**
 * EditVerse JSON Storage Implementation
 * Using lowdb for persistent JSON-based storage
 */

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Database,
  User,
  UserProfile,
  Edit,
  EditLike,
  Comment,
  Follower,
  Notification,
  XpEvent,
  Badge,
  UserBadge,
  Contest,
  ContestEntry,
  ContestVote,
  ProfilePreferences,
  SocialLink,
  ProfileStats,
  EditFavorite,
  Music,
  Movie,
  Playlist,
  Battle,
  Message,
  XP_REWARDS,
} from './models';
import { calculateLevel } from './models';

// Database file path
const DB_PATH = join(process.cwd(), 'data', 'db.json');

// Default database structure
const defaultData: Database = {
  users: [],
  userProfiles: [],
  edits: [],
  editLikes: [],
  comments: [],
  followers: [],
  notifications: [],
  xpEvents: [],
  badges: [],
  userBadges: [],
  contests: [],
  contestEntries: [],
  contestVotes: [],
  profilePreferences: [],
  socialLinks: [],
  profileStats: [],
  editFavorites: [],
  music: [],
  movies: [],
  playlists: [],
  battles: [],
  messages: [],
};

// Initialize database
const adapter = new JSONFile<Database>(DB_PATH);
export const db = new Low(adapter, defaultData);

// Initialize database (call this on server startup)
export async function initializeStorage() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
  console.log('JSON storage initialized at:', DB_PATH);
}

// User operations
export async function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  await db.read();
  const newUser: User = {
    ...user,
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  db.data.users.push(newUser);
  await db.write();
  return newUser;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  await db.read();
  return db.data.users.find(u => u.email === email);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  await db.read();
  return db.data.users.find(u => u.username === username);
}

export async function getUserById(id: string): Promise<User | undefined> {
  await db.read();
  return db.data.users.find(u => u.id === id);
}

// Profile operations
export async function getProfile(userId: string): Promise<UserProfile | undefined> {
  await db.read();
  return db.data.userProfiles.find(p => p.userId === userId);
}

export async function upsertProfile(profile: Partial<UserProfile> & { userId: string }): Promise<UserProfile> {
  await db.read();
  const existingIndex = db.data.userProfiles.findIndex(p => p.userId === profile.userId);
  
  if (existingIndex >= 0) {
    db.data.userProfiles[existingIndex] = {
      ...db.data.userProfiles[existingIndex],
      ...profile,
    };
    await db.write();
    return db.data.userProfiles[existingIndex];
  } else {
    const newProfile: UserProfile = {
      userId: profile.userId,
      bio: profile.bio,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      xp: profile.xp || 0,
      level: profile.level || 'rookie',
      isVerified: profile.isVerified || false,
      profileFrame: profile.profileFrame || 'none',
      profileColor: profile.profileColor,
      isCreatorOfMonth: profile.isCreatorOfMonth || false,
      creatorOfMonthDate: profile.creatorOfMonthDate,
      theme: profile.theme || 'dark-cinematic',
      createdAt: new Date(),
    };
    db.data.userProfiles.push(newProfile);
    await db.write();
    return newProfile;
  }
}

export async function searchUsers(query: string): Promise<UserProfile[]> {
  await db.read();
  const lowerQuery = query.toLowerCase();
  return db.data.userProfiles.filter(p => 
    p.displayName?.toLowerCase().includes(lowerQuery) ||
    db.data.users.find(u => u.id === p.userId)?.username.toLowerCase().includes(lowerQuery)
  ).slice(0, 20);
}

export async function getLeaderboard(limit: number = 10): Promise<UserProfile[]> {
  await db.read();
  return [...db.data.userProfiles]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

export async function addXp(userId: string, amount: number): Promise<UserProfile> {
  await db.read();
  const profileIndex = db.data.userProfiles.findIndex(p => p.userId === userId);
  
  if (profileIndex >= 0) {
    db.data.userProfiles[profileIndex].xp += amount;
    const newXp = db.data.userProfiles[profileIndex].xp;
    const newLevel = calculateLevel(newXp);
    db.data.userProfiles[profileIndex].level = newLevel;
    
    // Record XP event
    db.data.xpEvents.push({
      id: uuidv4(),
      userId,
      amount,
      reason: 'Activity reward',
      createdAt: new Date(),
    });
    
    await db.write();
    return db.data.userProfiles[profileIndex];
  }
  
  throw new Error('Profile not found');
}

// Edit operations
export async function getEdits(limit: number = 30, offset: number = 0): Promise<Edit[]> {
  await db.read();
  return [...db.data.edits]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
}

export async function getEditsCount(): Promise<number> {
  await db.read();
  return db.data.edits.length;
}

export async function getEdit(id: string): Promise<Edit | undefined> {
  await db.read();
  return db.data.edits.find(e => e.id === id);
}

export async function getFeaturedEdits(): Promise<Edit[]> {
  await db.read();
  return db.data.edits
    .filter(e => e.featured)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getEditsByUser(userId: string, limit: number = 30, offset: number = 0): Promise<Edit[]> {
  await db.read();
  return db.data.edits
    .filter(e => e.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
}

export async function getEditsByUserCount(userId: string): Promise<number> {
  await db.read();
  return db.data.edits.filter(e => e.userId === userId).length;
}

export async function createEdit(edit: Omit<Edit, 'id' | 'createdAt'>): Promise<Edit> {
  await db.read();
  const newEdit: Edit = {
    ...edit,
    id: uuidv4(),
    createdAt: new Date(),
  };
  db.data.edits.push(newEdit);
  await db.write();
  return newEdit;
}

export async function deleteEdit(id: string, userId: string): Promise<void> {
  await db.read();
  const editIndex = db.data.edits.findIndex(e => e.id === id && e.userId === userId);
  if (editIndex >= 0) {
    db.data.edits.splice(editIndex, 1);
    await db.write();
  }
}

export async function incrementEditShares(id: string): Promise<void> {
  await db.read();
  const editIndex = db.data.edits.findIndex(e => e.id === id);
  if (editIndex >= 0) {
    db.data.edits[editIndex].shares++;
    await db.write();
  }
}

export async function incrementEditViews(id: string): Promise<void> {
  await db.read();
  const editIndex = db.data.edits.findIndex(e => e.id === id);
  if (editIndex >= 0) {
    db.data.edits[editIndex].views++;
    await db.write();
  }
}

// Edit Like operations
export async function likeEdit(editId: string, userId: string): Promise<boolean> {
  await db.read();
  
  const existing = db.data.editLikes.find(l => l.editId === editId && l.userId === userId);
  if (existing) {
    return false; // Already liked
  }
  
  db.data.editLikes.push({
    id: uuidv4(),
    editId,
    userId,
    createdAt: new Date(),
  });
  
  const editIndex = db.data.edits.findIndex(e => e.id === editId);
  if (editIndex >= 0) {
    db.data.edits[editIndex].likes++;
  }
  
  await db.write();
  return true;
}

export async function unlikeEdit(editId: string, userId: string): Promise<void> {
  await db.read();
  const likeIndex = db.data.editLikes.findIndex(l => l.editId === editId && l.userId === userId);
  
  if (likeIndex >= 0) {
    db.data.editLikes.splice(likeIndex, 1);
    
    const editIndex = db.data.edits.findIndex(e => e.id === editId);
    if (editIndex >= 0 && db.data.edits[editIndex].likes > 0) {
      db.data.edits[editIndex].likes--;
    }
    
    await db.write();
  }
}

export async function hasLikedEdit(editId: string, userId: string): Promise<boolean> {
  await db.read();
  return db.data.editLikes.some(l => l.editId === editId && l.userId === userId);
}

// Comment operations
export async function getComments(editId: string, limit: number = 30, offset: number = 0): Promise<Comment[]> {
  await db.read();
  return db.data.comments
    .filter(c => c.editId === editId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
}

export async function getCommentsCount(editId: string): Promise<number> {
  await db.read();
  return db.data.comments.filter(c => c.editId === editId).length;
}

export async function createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
  await db.read();
  const newComment: Comment = {
    ...comment,
    id: uuidv4(),
    createdAt: new Date(),
  };
  db.data.comments.push(newComment);
  await db.write();
  return newComment;
}

export async function deleteComment(id: string, userId: string): Promise<void> {
  await db.read();
  const commentIndex = db.data.comments.findIndex(c => c.id === id && c.userId === userId);
  if (commentIndex >= 0) {
    db.data.comments.splice(commentIndex, 1);
    await db.write();
  }
}

// Follower operations
export async function follow(followerId: string, followingId: string): Promise<Follower> {
  await db.read();
  
  const existing = db.data.followers.find(
    f => f.followerId === followerId && f.followingId === followingId
  );
  
  if (existing) {
    return existing;
  }
  
  const newFollower: Follower = {
    id: uuidv4(),
    followerId,
    followingId,
    createdAt: new Date(),
  };
  
  db.data.followers.push(newFollower);
  await db.write();
  return newFollower;
}

export async function unfollow(followerId: string, followingId: string): Promise<void> {
  await db.read();
  const followerIndex = db.data.followers.findIndex(
    f => f.followerId === followerId && f.followingId === followingId
  );
  
  if (followerIndex >= 0) {
    db.data.followers.splice(followerIndex, 1);
    await db.write();
  }
}

export async function getFollowers(userId: string, limit: number = 30, offset: number = 0): Promise<Follower[]> {
  await db.read();
  return db.data.followers
    .filter(f => f.followingId === userId)
    .slice(offset, offset + limit);
}

export async function getFollowing(userId: string, limit: number = 30, offset: number = 0): Promise<Follower[]> {
  await db.read();
  return db.data.followers
    .filter(f => f.followerId === userId)
    .slice(offset, offset + limit);
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  await db.read();
  return db.data.followers.some(
    f => f.followerId === followerId && f.followingId === followingId
  );
}

// Notification operations
export async function getNotifications(userId: string, limit: number = 30, offset: number = 0): Promise<Notification[]> {
  await db.read();
  return db.data.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit);
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  await db.read();
  return db.data.notifications.filter(n => n.userId === userId && !n.isRead).length;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await db.read();
  const notificationIndex = db.data.notifications.findIndex(n => n.id === id);
  if (notificationIndex >= 0) {
    db.data.notifications[notificationIndex].isRead = true;
    await db.write();
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db.read();
  let modified = false;
  db.data.notifications.forEach(n => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      modified = true;
    }
  });
  if (modified) {
    await db.write();
  }
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
  await db.read();
  const newNotification: Notification = {
    ...notification,
    id: uuidv4(),
    createdAt: new Date(),
  };
  db.data.notifications.push(newNotification);
  await db.write();
  return newNotification;
}

// Badge operations
export async function getAllBadges(): Promise<Badge[]> {
  await db.read();
  return db.data.badges;
}

export async function createBadge(badge: Omit<Badge, 'id' | 'createdAt'>): Promise<Badge> {
  await db.read();
  const newBadge: Badge = {
    ...badge,
    id: uuidv4(),
    createdAt: new Date(),
  };
  db.data.badges.push(newBadge);
  await db.write();
  return newBadge;
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  await db.read();
  return db.data.userBadges.filter(ub => ub.userId === userId);
}

export async function awardBadge(userId: string, badgeId: string): Promise<UserBadge> {
  await db.read();
  
  const existing = db.data.userBadges.find(ub => ub.userId === userId && ub.badgeId === badgeId);
  if (existing) {
    return existing;
  }
  
  const newUserBadge: UserBadge = {
    id: uuidv4(),
    userId,
    badgeId,
    earnedAt: new Date(),
  };
  
  db.data.userBadges.push(newUserBadge);
  await db.write();
  return newUserBadge;
}

// Contest operations
export async function getActiveContests(): Promise<Contest[]> {
  await db.read();
  return db.data.contests.filter(c => c.isActive);
}

export async function createContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest> {
  await db.read();
  const newContest: Contest = {
    ...contest,
    id: uuidv4(),
    createdAt: new Date(),
  };
  db.data.contests.push(newContest);
  await db.write();
  return newContest;
}

// Export all operations
export const jsonStorage = {
  initialize: initializeStorage,
  
  // User
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  
  // Profile
  getProfile,
  upsertProfile,
  searchUsers,
  getLeaderboard,
  addXp,
  
  // Edits
  getEdits,
  getEditsCount,
  getEdit,
  getFeaturedEdits,
  getEditsByUser,
  getEditsByUserCount,
  createEdit,
  deleteEdit,
  incrementEditShares,
  incrementEditViews,
  
  // Edit Likes
  likeEdit,
  unlikeEdit,
  hasLikedEdit,
  
  // Comments
  getComments,
  getCommentsCount,
  createComment,
  deleteComment,
  
  // Followers
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  isFollowing,
  
  // Notifications
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
  
  // Badges
  getAllBadges,
  createBadge,
  getUserBadges,
  awardBadge,
  
  // Contests
  getActiveContests,
  createContest,
};
