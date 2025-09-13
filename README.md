

https://github.com/user-attachments/assets/72c7ceab-a4ad-4299-b87e-cdfd9f44e355



# 🃏 Flashcard Frenzy

A modern, interactive flashcard application built with Next.js, featuring real-time multiplayer matches, user authentication, and a beautiful gradient UI design.

## ✨ Features

### 🎮 Multiplayer Gaming
- **Real-time Matches**: Create and join live flashcard matches with other players
- **Interactive Gameplay**: Answer flashcard questions with multiple choice options
- **Live Scoreboard**: Track player scores in real-time during matches
- **Match Results**: View detailed statistics and leaderboards after each match

### 👤 User Management
- **Username-based Authentication**: Register and login with custom usernames
- **Secure Authentication**: Powered by Supabase Auth with email verification
- **User Profiles**: Personalized profile pages with statistics and achievements
- **Player Statistics**: Track games played, win rates, and performance metrics

### 📚 Flashcard System
- **Dynamic Questions**: Questions pulled from a comprehensive flashcard database
- **Multiple Choice**: Interactive multiple-choice answer format
- **Progress Tracking**: Monitor learning progress and correct answer rates
- **Randomized Content**: Ensures unique gameplay experiences each match

### 🎨 Modern UI/UX
- **Gradient Design**: Beautiful purple-blue gradient theme throughout
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Smooth Animations**: Powered by Framer Motion for fluid interactions
- **Component Library**: Built with shadcn/ui for consistent design

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15.5.2](https://nextjs.org/)** - React framework with App Router
- **[React 19.1.0](https://reactjs.org/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library

### UI Components
- **[shadcn/ui](https://ui.shadcn.com/)** - Reusable component library
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icons
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Real-time subscriptions** - Live data updates
- **Row Level Security** - Secure data access

### Authentication
- **Supabase Auth** - User authentication and management
- **Email verification** - Secure account creation
- **Session management** - Persistent login state

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShikharPandey123/flashcard-frenzy.git
   cd flashcard-frenzy
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Set up your Supabase database with the following tables:
   
   ```sql
   -- Users are managed by Supabase Auth
   
   -- Players table
   CREATE TABLE players (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT UNIQUE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );
   
   -- Flashcards table
   CREATE TABLE flashcards (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     question TEXT NOT NULL,
     options TEXT[] NOT NULL,
     correct_answer TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );
   
   -- Matches table
   CREATE TABLE matches (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     player1_id UUID REFERENCES players(id),
     player2_id UUID REFERENCES players(id),
     winner_id UUID REFERENCES players(id),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
     created_by UUID REFERENCES auth.users(id)
   );
   
   -- Match players (for multiplayer support)
   CREATE TABLE match_players (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
     player_id UUID REFERENCES players(id),
     joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );
   
   -- Match rounds
   CREATE TABLE match_rounds (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
     flashcard_id UUID REFERENCES flashcards(id),
     answered_by UUID REFERENCES auth.users(id),
     is_correct BOOLEAN,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );
   
   -- Round attempts
   CREATE TABLE round_attempts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     round_id UUID REFERENCES match_rounds(id) ON DELETE CASCADE,
     player_id UUID REFERENCES players(id),
     answer TEXT NOT NULL,
     is_correct BOOLEAN NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Usage

### Getting Started
1. **Register an Account**: Create a new account with a unique username
2. **Login**: Sign in with your username and password
3. **Join a Match**: Navigate to the match lobby and join or create a game
4. **Play**: Answer flashcard questions and compete with other players
5. **View Results**: Check your performance and statistics after each match

### Navigation
- **Home** (`/`) - Landing page with app overview
- **Authentication** (`/auth`) - Login and registration forms
- **Match Lobby** (`/match/lobby`) - Create or join matches
- **Active Match** (`/match/[id]`) - Live gameplay interface
- **Match Results** (`/match/[id]/results`) - Post-game statistics
- **Profile** (`/profile`) - User profile and statistics
- **Flashcards** (`/flashcards`) - Manage flashcard collections

## 🎯 Key Components

### Authentication System
- **Username-based login** with email verification
- **Secure registration** with password strength validation
- **Profile management** with user statistics

### Match System
- **Real-time multiplayer** functionality
- **Dynamic question selection** from flashcard database
- **Live scoring** and leaderboard updates
- **Comprehensive results** with detailed statistics

### UI Components
- **Responsive design** for all screen sizes
- **Animated interactions** with Framer Motion
- **Toast notifications** for user feedback
- **Modern gradient theme** throughout the application


