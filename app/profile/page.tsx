"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  Mail, 
  Calendar, 
  Trophy, 
  BookOpen, 
  Zap,
  LogOut,
  Sparkles,
  Shield,
  Settings,
  Edit3
} from "lucide-react"
import Navbar from "@/components/Navbar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats] = useState({
    flashcardsCreated: 12,
    matchesPlayed: 8,
    correctAnswers: 75,
    winRate: 87
  })

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()
    // TODO: Fetch real user stats from database
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-xl font-semibold text-purple-700"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            Loading profile...
          </motion.div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="w-96 bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-gray-800">Not Logged In</CardTitle>
                <CardDescription className="text-gray-600">
                  Please log in to view your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Link href="/auth">
                    Go to Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-6"
            >
              <Avatar className="w-24 h-24 ring-4 ring-white/30">
                <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {user.email?.split("@")[0] || "User"}
                </h1>
                <div className="flex items-center gap-2 text-purple-100">
                  <Mail className="w-5 h-5" />
                  <span className="text-lg">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-purple-100">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Member since {new Date(user.created_at || "").toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Your Statistics
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{stats.flashcardsCreated}</div>
                      <div className="text-sm text-gray-600">Flashcards Created</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{stats.matchesPlayed}</div>
                      <div className="text-sm text-gray-600">Matches Played</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{stats.correctAnswers}</div>
                      <div className="text-sm text-gray-600">Correct Answers</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-800 mb-1">{stats.winRate}%</div>
                      <div className="text-sm text-gray-600">Win Rate</div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>

            {/* Action Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/flashcards" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Manage Flashcards
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/flashcards/new" className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Create New Flashcard
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/match/1" className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Start Match
                    </Link>
                  </Button>
                  
                  <Separator />
                  
                  <Button 
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </CardContent>
              </Card>

              {/* Achievement Badge */}
              <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-3" />
                  <h3 className="font-bold text-lg mb-2">Learning Champion!</h3>
                  <p className="text-sm opacity-90">
                    You&apos;re doing great! Keep creating and studying flashcards.
                  </p>
                  <Badge className="mt-3 bg-white/20 hover:bg-white/30 text-white">
                    Level 3 Learner
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
