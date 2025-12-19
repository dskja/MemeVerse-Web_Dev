import { 
  type User, type InsertUser, 
  type Meme, type InsertMeme,
  type Category, type InsertCategory,
  type Contact, type InsertContact 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMemes(): Promise<Meme[]>;
  getFeaturedMemes(): Promise<Meme[]>;
  getMemesByCategory(category: string): Promise<Meme[]>;
  createMeme(meme: InsertMeme): Promise<Meme>;
  
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private memes: Map<string, Meme>;
  private categories: Map<string, Category>;
  private contacts: Map<string, Contact>;

  constructor() {
    this.users = new Map();
    this.memes = new Map();
    this.categories = new Map();
    this.contacts = new Map();
    
    this.initializeData();
  }

  private initializeData() {
    const defaultMemes: InsertMeme[] = [
      { title: "When Monday hits different", imageUrl: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&h=400&fit=crop", category: "Relatable", likes: 15420, shares: 2341, featured: true },
      { title: "Me explaining memes to my parents", imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=500&fit=crop", category: "Family", likes: 23100, shares: 4521, featured: true },
      { title: "POV: You found the perfect meme", imageUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=350&fit=crop", category: "Trending", likes: 18900, shares: 3200, featured: true },
      { title: "Developer life be like", imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=450&fit=crop", category: "Tech", likes: 31200, shares: 5600, featured: true },
      { title: "When coffee kicks in", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop", category: "Relatable", likes: 12800, shares: 1900, featured: true },
      { title: "Friday mood activated", imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=500&fit=crop", category: "Weekend", likes: 27500, shares: 4100, featured: true },
    ];

    defaultMemes.forEach((meme) => {
      const id = randomUUID();
      this.memes.set(id, { ...meme, id, likes: meme.likes ?? 0, shares: meme.shares ?? 0, featured: meme.featured ?? false });
    });

    const defaultCategories: InsertCategory[] = [
      { name: "Relatable", description: "Everyday moments we all understand", icon: "smile", color: "pink" },
      { name: "Trending", description: "What's hot on the internet", icon: "trending-up", color: "orange" },
      { name: "Tech", description: "For the coding culture enthusiasts", icon: "code", color: "blue" },
      { name: "Wholesome", description: "Feel-good content for your soul", icon: "heart", color: "green" },
      { name: "Gaming", description: "Level up your gaming humor", icon: "gamepad", color: "purple" },
      { name: "Daily Life", description: "The struggle is real", icon: "coffee", color: "amber" },
    ];

    defaultCategories.forEach((category) => {
      const id = randomUUID();
      this.categories.set(id, { ...category, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMemes(): Promise<Meme[]> {
    return Array.from(this.memes.values());
  }

  async getFeaturedMemes(): Promise<Meme[]> {
    return Array.from(this.memes.values()).filter(meme => meme.featured);
  }

  async getMemesByCategory(category: string): Promise<Meme[]> {
    return Array.from(this.memes.values()).filter(meme => meme.category === category);
  }

  async createMeme(insertMeme: InsertMeme): Promise<Meme> {
    const id = randomUUID();
    const meme: Meme = { 
      ...insertMeme, 
      id, 
      likes: insertMeme.likes ?? 0, 
      shares: insertMeme.shares ?? 0, 
      featured: insertMeme.featured ?? false 
    };
    this.memes.set(id, meme);
    return meme;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = { ...insertContact, id };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }
}

export const storage = new MemStorage();
