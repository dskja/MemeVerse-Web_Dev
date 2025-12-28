# MemeVerse 🎭

A social media platform for meme enthusiasts featuring gamification, contests, and community engagement.

## Features

- 🖼️ **Meme Sharing**: Upload and share your favorite memes
- 👥 **Social Features**: Follow users, like, comment, and share
- 🏆 **Gamification**: Earn XP, level up, and unlock badges
- 🎨 **Customization**: Profile frames and colors based on achievements
- 🏅 **Contests**: Participate in meme contests and vote for your favorites
- 🔔 **Notifications**: Real-time updates on interactions
- 📱 **Responsive Design**: Optimized for desktop and mobile

## Tech Stack

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
- PostgreSQL database
- Drizzle ORM
- Winston for logging
- Helmet for security headers
- Express Rate Limit for rate limiting

### Image Processing
- Sharp for image optimization
- Automatic WebP conversion
- Thumbnail generation
- EXIF data removal

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
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

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/memeverse
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key
LOG_LEVEL=debug
```

4. Push the database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run lint` - Run linter
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run db:push` - Push schema changes to database

## API Documentation

### Authentication
All protected endpoints require authentication via session cookies.

### Pagination
List endpoints support pagination with query parameters:
- `?page=1` - Page number (default: 1)
- `?limit=30` - Items per page (default: 30, max: 100)

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 150,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Main Endpoints

#### Memes
- `GET /api/memes` - List all memes (paginated)
- `GET /api/memes/featured` - Get featured memes
- `GET /api/memes/:id` - Get single meme
- `GET /api/memes/user/:userId` - Get user's memes (paginated)
- `POST /api/memes` - Create new meme (protected)
- `DELETE /api/memes/:id` - Delete meme (protected)
- `POST /api/memes/:id/like` - Like meme (protected)
- `DELETE /api/memes/:id/like` - Unlike meme (protected)

#### Users
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update own profile (protected)
- `GET /api/users/search?q=query` - Search users
- `GET /api/leaderboard` - Get XP leaderboard

#### Social
- `POST /api/follow/:userId` - Follow user (protected)
- `DELETE /api/follow/:userId` - Unfollow user (protected)
- `GET /api/profile/:userId/followers` - Get followers (paginated)
- `GET /api/profile/:userId/following` - Get following (paginated)

#### Comments
- `GET /api/memes/:memeId/comments` - Get meme comments (paginated)
- `POST /api/memes/:memeId/comments` - Add comment (protected)
- `DELETE /api/comments/:id` - Delete comment (protected)

#### Notifications
- `GET /api/notifications` - Get notifications (paginated, protected)
- `GET /api/notifications/unread-count` - Get unread count (protected)
- `PATCH /api/notifications/:id/read` - Mark as read (protected)
- `PATCH /api/notifications/read-all` - Mark all as read (protected)

#### File Upload
- `POST /api/upload` - Upload image/video (protected)

Returns:
```json
{
  "url": "/uploads/filename.webp",
  "thumbnail": "/uploads/thumbnails/filename.webp",
  "mimeType": "image/webp"
}
```

## Security Features

- ✅ Helmet.js for security headers
- ✅ Rate limiting on all endpoints
- ✅ MIME type validation using magic numbers
- ✅ Input sanitization for XSS prevention
- ✅ Secure random filenames
- ✅ EXIF data removal from images
- ✅ Maximum file size limits
- ✅ CSRF protection ready (configurable)
- ✅ Centralized error handling

## Performance Optimizations

- ✅ Database indexes on frequently queried columns
- ✅ Pagination for large datasets
- ✅ Image optimization and WebP conversion
- ✅ Thumbnail generation
- ✅ Composite indexes for complex queries
- ✅ Winston structured logging

## Project Structure

```
MemeVerse-Web_Dev/
├── client/              # Frontend React application
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       └── lib/         # Utilities
├── server/              # Backend Express application
│   ├── config/          # Configuration (logger, etc.)
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── upload-config.ts # File upload configuration
├── shared/              # Shared code (schema, types)
│   └── schema.ts        # Database schema
├── uploads/             # Uploaded files (gitignored)
└── logs/                # Log files (gitignored)
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ by the MemeVerse Team
