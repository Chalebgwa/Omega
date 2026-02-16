# Omega - Last Will & Testament Website

A personal digital legacy platform where you can create meaningful messages and journal entries for your loved ones.

## Features

### 🔐 User Authentication
- Secure registration and login system
- JWT-based authentication
- Password hashing with bcrypt

### ✍️ Private Messages
- Create text or video messages for specific recipients
- Messages are only accessible to intended recipients
- Support for multiple recipients per message

### 📔 Journal Entries
- Time-gated journal entries with configurable intervals (default: 30 days)
- Add entries over time at your own pace
- Option to make entries public or keep them private

### 📢 Soap Box (Public Page)
- Share public thoughts and messages with the community
- Public entries are visible to everyone
- Great for sharing wisdom and reflections

### 🎥 Video Support
- Upload video URLs for both messages and journal entries
- Support for text and video content types

## Tech Stack

- **Framework**: Next.js 16 (React)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS
- **Database Adapter**: @prisma/adapter-libsql

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Chalebgwa/Omega.git
cd Omega
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### User
- id, email, name, passwordHash
- Relations: messages, entries, receivedMessages

### Message
- id, title, content, videoUrl, type (text/video)
- Relations: author, recipients

### MessageRecipient
- Links messages to their intended recipients
- Tracks when messages are accessed

### Entry
- id, title, content, videoUrl, type, isPublic
- entryInterval: configurable time between entries (in days)
- nextEntryDate: automatically calculated based on interval
- Relations: author

## Usage

### Creating an Account
1. Navigate to the registration page
2. Enter your name, email, and password
3. Click "Sign up"

### Creating a Private Message
1. Log in to your account
2. Go to Dashboard → Create Message
3. Enter message title and content (or video URL)
4. Add recipient email addresses (comma-separated)
5. Click "Create Message"

### Creating a Journal Entry
1. Log in to your account
2. Go to Dashboard → Journal Entries → Create Entry
3. Enter entry title and content
4. Set the interval for your next entry (default: 30 days)
5. Optionally check "Make this entry public" for Soap Box
6. Click "Create Entry"

### Viewing Public Entries
- Navigate to the "Soap Box" page
- No login required to view public entries

## Security

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Environment variables for sensitive data
- Input validation on all forms
- No SQL injection vulnerabilities (using Prisma ORM)

## Development

### Building for Production
```bash
JWT_SECRET=your-secret npm run build
```

### Running in Production
```bash
npm start
```

## Project Structure

```
Omega/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── messages/       # Message endpoints
│   │   └── entries/        # Entry endpoints
│   ├── dashboard/          # Dashboard pages
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   ├── public/             # Public Soap Box page
│   └── page.tsx            # Homepage
├── lib/                     # Utility libraries
│   ├── auth.ts             # Authentication helpers
│   └── prisma.ts           # Prisma client
├── prisma/                  # Database schema and migrations
│   └── schema.prisma       # Database schema
├── components/              # Reusable React components
└── public/                  # Static assets
```

## License

See LICENSE file for details.

## Acknowledgments

Built with ❤️ for the people I care about.
