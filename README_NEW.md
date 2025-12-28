# EditVerse 🎬

A social media platform for video editors featuring gamification, contests, and community engagement.

## ✨ Features

- 🎥 **Video Sharing**: Upload and share your video edits
- 👥 **Social Features**: Follow users, like, comment, and share
- 🏆 **Gamification**: Earn XP, level up, and unlock badges
- 🎨 **Customization**: Profile frames and colors based on achievements
- 🏅 **Contests**: Participate in editing contests and vote for your favorites
- 🔔 **Notifications**: Real-time updates on interactions
- 📱 **Responsive Design**: Optimized for desktop and mobile

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Wouter for routing
- TanStack Query for data fetching
- Radix UI components
- Framer Motion for animations

### Backend
- Node.js with Express
- TypeScript
- JSON file storage with lowdb
- Winston for logging
- Helmet for security headers
- Express Rate Limit for rate limiting
- Session-based authentication with bcrypt

### Media Processing
- FFmpeg for video processing (planned)
- Sharp for image optimization
- Automatic thumbnail generation (planned)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dskja/MemeVerse-Web_Dev.git
cd MemeVerse-Web_Dev
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` and set your configuration:
```env
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-random-secret-here-change-in-production
```

### Development

Start the development server:
```bash
npm run dev
```

The server will:
- Automatically create required directories (`data/`, `sessions/`, `uploads/`)
- Initialize the JSON database at `data/db.json`
- Seed default badges and contests
- Start on port 5000 (or PORT from .env)

Visit `http://localhost:5000` to access the application.

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
MemeVerse-Web_Dev/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities and helpers
├── server/              # Express backend
│   ├── auth/            # Authentication system
│   ├── storage/         # JSON storage layer
│   ├── middleware/      # Express middleware
│   ├── utils/           # Server utilities
│   ├── routes.ts        # API routes
│   └── index.ts         # Server entry point
├── shared/              # Shared types and schemas
├── data/                # JSON database (git-ignored)
├── sessions/            # Session files (git-ignored)
└── uploads/             # Uploaded files (git-ignored)
```

## 🔐 Authentication

EditVerse uses local session-based authentication:

- **Registration**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Logout**: `POST /api/auth/logout`
- **Current User**: `GET /api/auth/user`

Sessions are stored in files and persist across server restarts.

## 🗄️ Data Storage

EditVerse uses a JSON file-based database with lowdb:

- **Location**: `data/db.json`
- **Format**: Human-readable JSON
- **Persistence**: Automatic on every write
- **Backup**: Simply copy the `data/` directory

### Database Collections

- users, userProfiles
- edits (videos), editLikes, editFavorites
- comments
- followers, notifications
- badges, userBadges
- contests, contestEntries, contestVotes
- xpEvents, profileStats
- And more...

## 🎮 Gamification System

### XP Rewards
- Upload Edit: 10 XP
- Receive Like: 2 XP
- Receive Comment: 3 XP
- Daily Login: 5 XP
- Complete Profile: 25 XP
- First Follower: 15 XP
- Contest Win: 100 XP
- Contest Participation: 20 XP

### User Levels
- **Rookie** (0-99 XP)
- **Rising Editor** (100-499 XP)
- **Pro Editor** (500-1999 XP)
- **Master Editor** (2000-9999 XP)
- **Icon Editor** (10000+ XP)

### Profile Frames
Unlock decorative frames for your avatar:
- Bronze, Silver, Gold, Diamond
- Rainbow, Fire, Ice, Nature
- Cosmic, Legendary

## 🏗️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Edits (Videos)
- `GET /api/memes` - List all edits (paginated)
- `GET /api/memes/featured` - Featured edits
- `GET /api/memes/:id` - Get single edit
- `POST /api/memes` - Upload edit (authenticated)
- `DELETE /api/memes/:id` - Delete edit (authenticated)
- `POST /api/memes/:id/like` - Like/unlike edit (authenticated)
- `POST /api/memes/:id/share` - Increment share count

### Users & Profiles
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update own profile (authenticated)
- `GET /api/users/search?q=query` - Search users
- `GET /api/leaderboard` - Get XP leaderboard

### Social
- `POST /api/follow/:userId` - Follow user (authenticated)
- `DELETE /api/follow/:userId` - Unfollow user (authenticated)
- `GET /api/followers/:userId` - Get followers
- `GET /api/following/:userId` - Get following

### Comments
- `GET /api/memes/:id/comments` - Get comments
- `POST /api/memes/:id/comments` - Add comment (authenticated)
- `DELETE /api/comments/:id` - Delete comment (authenticated)

### Badges & Contests
- `GET /api/badges` - Get all badges
- `GET /api/contests` - Get active contests
- `POST /api/contests/:id/entries` - Submit contest entry (authenticated)

## 🔒 Security Features

- Helmet.js for security headers
- Rate limiting on all endpoints
- CSRF protection (configurable)
- Password hashing with bcrypt
- Session-based authentication
- Input sanitization
- File type validation

## 🎨 Customization

### Themes
EditVerse supports multiple theme presets:
- Dark Cinematic (default)
- Neon Cyberpunk
- Minimalist Light
- Ocean Blue
- Sunset Purple
- Matrix Green

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for the video editing community
