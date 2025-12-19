# MemeVerse (@MemeVerseDC) Design Guidelines

## Design Approach

**Reference-Based Approach**: Social Media + Entertainment Category

Drawing inspiration from: Instagram's visual storytelling, TikTok's energy, and 9GAG's meme presentation. The design should feel vibrant, engaging, and scroll-worthy while maintaining professionalism.

**Core Principles**:
- Bold, playful personality that matches meme culture
- High visual density with generous breathing room between sections
- Mobile-first (meme consumption is primarily mobile)
- Instant engagement - every section should deliver entertainment value

---

## Typography

**Primary Font**: Poppins (Google Fonts) - Bold, modern, playful
- Hero Headlines: font-bold text-5xl md:text-7xl
- Section Headers: font-semibold text-3xl md:text-5xl
- Subheadings: font-medium text-xl md:text-2xl
- Body: font-normal text-base md:text-lg
- Captions/Meta: font-normal text-sm

**Secondary Font**: Inter (Google Fonts) - For readability in longer content
- Use for body text, descriptions, and UI elements

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-16 md:py-24
- Card gaps: gap-6 md:gap-8
- Container max-width: max-w-7xl

**Grid System**:
- Mobile: Single column (grid-cols-1)
- Tablet: 2 columns (md:grid-cols-2)
- Desktop: 3-4 columns for meme grids (lg:grid-cols-3, xl:grid-cols-4)

---

## Page Structure & Components

### 1. Hero Section (80vh minimum)
- Large background image showcasing best memes in a collage/mosaic style
- Centered content with logo placement
- Primary headline: "Welcome to MemeVerse" with username @MemeVerseDC
- Tagline describing the account (e.g., "Your Daily Dose of Internet Culture")
- CTA buttons with backdrop-blur-md bg-white/20: "Follow on Instagram" + "Explore Memes"
- Subtle animated elements (floating meme icons or gentle parallax)

### 2. Featured Memes Grid
- Masonry-style grid (Pinterest-inspired) showing 9-12 top memes
- Hover effects revealing engagement metrics (likes, shares)
- Each card: rounded-2xl with subtle shadow
- Categories filter buttons above grid

### 3. About MemeVerse Section
- Split layout: left side has animated statistics (follower count, posts, engagement)
- Right side: compelling story about the account
- Include social proof indicators (follower milestones, features)

### 4. Categories Showcase
- 3-column grid of meme categories (Relatable, Trending, Dank, etc.)
- Each category card has representative image background with overlay
- Icon + Title + Brief Description

### 5. Instagram Feed Preview
- Live Instagram feed integration or static grid of recent posts
- 6-8 posts in grid format
- Direct links to Instagram posts
- "View More on Instagram" CTA

### 6. Community/Engagement Section
- Submission form for meme suggestions
- User testimonials/comments styled as social media posts
- Engagement stats visualized creatively

### 7. Footer
- Instagram link prominently displayed
- Quick navigation to sections
- Copyright + Credits
- Social media links (if other platforms exist)

---

## Component Library

**Navigation**: Sticky header with logo, menu items (About, Memes, Categories, Contact), Instagram CTA button

**Cards**: Rounded corners (rounded-2xl), subtle shadows (shadow-lg), hover scale effects (hover:scale-105 transition)

**Buttons**: 
- Primary: Large, rounded-full, bold text
- Secondary: Outline style with border-2
- All buttons on images: backdrop-blur-md bg-white/20 border border-white/40

**Icons**: Heroicons for UI elements, custom meme-related icons where needed

---

## Images

**Hero Background**: Full-width collage of 6-8 popular memes arranged artistically, slightly blurred overlay for text readability

**Category Cards**: Representative meme images for each category with color overlay treatments

**Meme Grid**: High-quality meme images, various aspect ratios for dynamic masonry layout

**About Section**: Behind-the-scenes content creator photo or creative illustration

**Total Images Needed**: 1 hero collage, 20-30 meme images for grid, 6 category backgrounds, 1-2 about section images

---

## Animations

**Minimal & Purposeful**:
- Smooth scroll reveals for sections (fade-in-up)
- Hover scale on meme cards
- Gentle parallax on hero background
- Loading skeleton for Instagram feed
- NO distracting auto-play animations

---

## Accessibility

- High contrast text over images with proper overlays
- Alt text for all meme images
- Keyboard navigation support
- Focus states for all interactive elements
- ARIA labels for social links