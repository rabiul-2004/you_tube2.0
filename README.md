# YourTube 2.0

A full-stack YouTube clone built with Next.js 15, Express 5, MongoDB, and Firebase Authentication. Supports video upload, playback, likes, comments, watch history, watch later, search, channels, and categories.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15.3.3 (React 19, TypeScript, Pages Router) |
| **Backend** | Express 5.x (Node.js, ES Modules) |
| **Database** | MongoDB with Mongoose 8.x |
| **Authentication** | Firebase Authentication (Google Sign-In via popup) |
| **File Upload** | Multer (disk storage, MP4 only) |
| **Styling** | Tailwind CSS v4 + CSS Variables |
| **UI Components** | shadcn/ui (Radix UI primitives, lucide-react icons) |
| **HTTP Client** | Axios |
| **Notifications** | Sonner (toast) |
| **Date Formatting** | date-fns |
| **Dev Tools** | Nodemon, TypeScript, PostCSS |

---

## Features

- **Video Upload** — MP4 upload via Multer, stored locally, served statically
- **Video Playback** — HTML5 video player with related videos sidebar
- **Like/Unlike** — Toggle like per video, count persisted
- **Comments** — CRUD on comments per video
- **Watch History** — Auto-recorded on watch; view count incremented
- **Watch Later** — Toggle save/remove videos
- **Search** — Search videos by title
- **Categories** — Filter homepage by All, Gaming, Music, Sports, News, Live
- **Channels** — Create/edit channel profile (name, description, avatar)
- **Dark Mode** — Ready via next-themes (CSS variables configured)
- **Responsive Layout** — Sidebar navigation, header with search & auth

---

## File Structure

```
you_tube2.0/
├── server/                          # Backend (Express API)
│   ├── controllers/
│   │   ├── auth.js                  # Login & profile update
│   │   ├── comment.js               # Comment CRUD
│   │   ├── history.js               # Watch history
│   │   ├── like.js                  # Like/unlike toggle
│   │   ├── video.js                 # Video upload & list
│   │   └── watchlater.js            # Watch later toggle
│   ├── filehelper/
│   │   └── filehelper.js            # Multer storage config
│   ├── Modals/                      # Mongoose models
│   │   ├── Auth.js                  # User model
│   │   ├── comment.js               # Comment model
│   │   ├── history.js               # History model
│   │   ├── like.js                  # Like model
│   │   ├── video.js                 # Video model
│   │   └── watchlater.js            # Watch Later model
│   ├── routes/
│   │   ├── auth.js                  # /user routes
│   │   ├── comment.js               # /comment routes
│   │   ├── history.js               # /history routes
│   │   ├── like.js                  # /like routes
│   │   ├── video.js                 # /video routes
│   │   └── watchlater.js            # /watch routes
│   ├── uploads/                     # Uploaded video files (static)
│   ├── index.js                     # Server entry point
│   └── package.json
│
└── yourtube/                        # Frontend (Next.js)
    ├── public/
    │   └── video/vdo.mp4            # Placeholder video
    ├── src/
    │   ├── components/
    │   │   ├── ui/                  # shadcn/ui components
    │   │   ├── category-tabs.tsx    # Home category filter
    │   │   ├── channeldialogue.tsx  # Create/edit channel dialog
    │   │   ├── ChannelHeader.tsx    # Channel page header
    │   │   ├── Channeltabs.tsx      # Channel tabs
    │   │   ├── ChannelVideos.tsx    # Channel video grid
    │   │   ├── Comments.tsx         # Video comments section
    │   │   ├── Header.tsx           # App header (search, auth)
    │   │   ├── HistoryContent.tsx   # Watch history page
    │   │   ├── LikedContent.tsx     # Liked videos page
    │   │   ├── RelatedVideos.tsx    # Related video sidebar
    │   │   ├── SearchResult.tsx     # Search results page
    │   │   ├── Sidebar.tsx          # Left sidebar navigation
    │   │   ├── videocard.tsx        # Video card component
    │   │   ├── Videogrid.tsx        # Home video grid
    │   │   ├── VideoInfo.tsx        # Video metadata & actions
    │   │   ├── Videopplayer.tsx     # Video player
    │   │   ├── VideoUploader.tsx    # Video upload form
    │   │   └── WatchLaterContent.tsx# Watch later page
    │   ├── lib/
    │   │   ├── AuthContext.js       # Firebase auth context
    │   │   ├── axiosinstance.js     # Axios instance (base URL)
    │   │   ├── firebase.js          # Firebase configuration
    │   │   └── utils.ts             # cn() utility (clsx + tailwind-merge)
    │   ├── pages/
    │   │   ├── api/hello.ts         # Sample API route
    │   │   ├── channel/[id]/index.tsx
    │   │   ├── history/index.tsx    # Watch history page
    │   │   ├── liked/index.tsx      # Liked videos page
    │   │   ├── search/index.tsx     # Search results page
    │   │   ├── watch/[id]/index.tsx # Video watch page
    │   │   ├── watch-later/index.tsx# Watch later page
    │   │   ├── index.tsx            # Home page
    │   │   ├── _app.tsx             # App shell (providers)
    │   │   └── _document.tsx        # Custom Document
    │   └── styles/
    │       └── globals.css          # Tailwind v4 + CSS variables
    ├── components.json              # shadcn/ui config
    ├── next.config.ts               # Next.js config (exposes BACKEND_URL)
    ├── package.json
    ├── postcss.config.mjs
    └── tsconfig.json
```

---

## Architecture

### Backend — MVC Pattern
```
Models (server/Modals/) → Controllers (server/controllers/) → Routes (server/routes/) → index.js
```
- **Models**: Mongoose schemas for User, Video, Like, Comment, History, WatchLater
- **Controllers**: Business logic, consistent try/catch error handling (500 on failure)
- **Routes**: RESTful mapping to controllers
- **Middleware**: CORS, body parsing (30MB), static file serving (`/uploads`)

### Frontend — Page Router
- Next.js Pages Router (`src/pages/`) with dynamic routes (`[id]`)
- Shared layout via `_app.tsx` (AuthContext provider)
- Components in `src/components/` (UI + feature components)
- Axios instance (`axiosinstance.js`) with `BACKEND_URL` base

### Authentication Flow
```
1. User clicks "Sign In" (Header)
2. AuthContext.handlegooglesignin() → signInWithPopup(GoogleAuthProvider)
3. Firebase returns user (email, name, photoURL)
4. POST /user/login with { email, name, image }
5. Backend: find user by email → create if not exists → return user
6. User stored in React Context + localStorage
7. onAuthStateChanged syncs state on reload
8. Logout → signOut(auth) + clear local state
```

---

## API Endpoints

### Auth (`/user`)
| Method | Path | Description | Controller |
|--------|------|-------------|------------|
| POST | `/user/login` | Login/register by email | `login` |
| PATCH | `/user/update/:id` | Update channel name & description | `updateprofile` |

### Video (`/video`)
| Method | Path | Description | Controller |
|--------|------|-------------|------------|
| POST | `/video/upload` | Upload video (multipart/form-data, MP4 only) | `uploadvideo` |
| GET | `/video/getall` | Get all videos | `getallvideo` |

### Like (`/like`)
| Method | Path | Description | Controller |
|--------|------|-------------|------------|
| GET | `/like/:userId` | Get all liked videos for user | `getallLikedVideo` |
| POST | `/like/:videoId` | Toggle like/unlike | `handlelike` |

### Comment (`/comment`)
| Method | Path | Description | Controller |
|--------|------|-------------|------------|
| GET | `/comment/:videoid` | Get comments for video | `getallcomment` |
| POST | `/comment/postcomment` | Post new comment | `postcomment` |
| DELETE | `/comment/deletecomment/:id` | Delete comment | `deletecomment` |
| POST | `/comment/editcomment/:id` | Edit comment body | `editcomment` |

### Watch Later (`/watch`)
| Method | Path | Description | Controller |
|--------|------|-------------|------------|
| GET | `/watch/:userId` | Get watch later videos for user | `getallwatchlater` |
| POST | `/watch/:videoId` | Toggle watch later | `handlewatchlater` |

### History (`/history`)
| Method | Path | Description | Controller |
|--------|------|-------------|------------|
| GET | `/history/:userId` | Get history for user | `getallhistoryVideo` |
| POST | `/history/views/:videoId` | Increment view count only | `handleview` |
| POST | `/history/:videoId` | Add to history + increment views | `handlehistory` |

### Static Files
| Path | Description |
|------|-------------|
| `/uploads/*` | Served uploaded video files |

### Health Check
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | "You tube backend is working" |

---

## Database Models

### User (`Auth.js`)
```js
{
  email: String (required),
  name: String,
  channelname: String,
  description: String,
  image: String,
  joinedon: Date (default: Date.now)
}
```

### Video (`video.js`)
```js
{
  videotitle: String (required),
  filename: String (required),
  filetype: String (required),
  filepath: String (required),
  filesize: String (required),
  videochanel: String (required),
  Like: Number (default: 0),
  views: Number (default: 0),
  uploader: String,
  timestamps: true
}
```

### Like (`like.js`)
```js
{
  viewer: ObjectId → user (required),
  videoid: ObjectId → videofiles (required),
  likedon: Date (default: Date.now),
  timestamps: true
}
```

### Comment (`comment.js`)
```js
{
  userid: ObjectId → user (required),
  videoid: ObjectId → videofiles (required),
  commentbody: String,
  usercommented: String,
  commentedon: Date (default: Date.now),
  timestamps: true
}
```

### History (`history.js`)
```js
{
  viewer: ObjectId → user (required),
  videoid: ObjectId → videofiles (required),
  likedon: Date (default: Date.now),
  timestamps: true
}
```

### Watch Later (`watchlater.js`)
```js
{
  viewer: ObjectId → user (required),
  videoid: ObjectId → videofiles (required),
  likedon: Date (default: Date.now),
  timestamps: true
}
```

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `5000` |
| `DB_URL` | MongoDB connection string | Yes | — |

### Frontend (`yourtube/.env.local`)
| Variable | Description | Used In |
|----------|-------------|---------|
| `BACKEND_URL` | Backend API base URL (e.g., `http://localhost:5000`) | `axiosinstance.js`, `next.config.ts`, video components |

> **Note:** `BACKEND_URL` is exposed to the browser via `next.config.ts`.

### Firebase (hardcoded in `src/lib/firebase.js`)
```js
{
  apiKey: "AIzaSyCyxbdclt2ocA5zgE-MDy1ndYIFqVMAr30",
  authDomain: "yourtube-8cda9.firebaseapp.com",
  projectId: "yourtube-8cda9",
  storageBucket: "yourtube-8cda9.firebasestorage.app",
  messagingSenderId: "921641878423",
  appId: "1:921641878423:web:0d65801eebaf2b25f03ad2"
}
```
> ⚠️ **Security**: Firebase credentials are committed to the repo. Move to environment variables for production.

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Firebase project with Google Sign-In enabled

### Backend
```bash
cd server
npm install

# Create .env file
echo "PORT=5000" > .env
echo "DB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/yourtube" >> .env

npm start        # Runs: nodemon index.js (http://localhost:5000)
```

### Frontend
```bash
cd yourtube
npm install

# Create .env.local
echo "BACKEND_URL=http://localhost:5000" > .env.local

npm run dev      # Runs: next dev (http://localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

---

## Security Notes

- **No JWT/Session Middleware**: Backend routes are publicly accessible; `userId` is trusted from client request body/params
- **`jsonwebtoken` installed but unused** in `server/package.json`
- **Firebase credentials hardcoded** in `src/lib/firebase.js` — move to env vars
- **No input validation library** (Joi/Zod/express-validator); validation is inline
- **No centralized error handler** — each controller catches and returns 500
- **CORS open** — no origin restriction configured

---

## Known Limitations

- Placeholder/mock data in `SearchResult.tsx`, `ChannelVideos.tsx`, `Comments.tsx`
- Only MP4 uploads accepted (Multer file filter)
- No video processing/transcoding (serves raw uploads)
- No pagination on video lists
- No rate limiting or request validation
- Dark mode CSS variables defined but not fully wired to toggle

---

## License

MIT