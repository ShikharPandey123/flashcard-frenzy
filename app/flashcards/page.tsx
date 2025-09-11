"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, BookOpen, Sparkles } from "lucide-react"
import Navbar from "@/components/Navbar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Flashcard = {
  id: string
  question: string
  options: string[]
  correct_answer: string
}

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFlashcards() {
      const { data, error } = await supabase.from("flashcards").select("*")
      if (!error && data) setFlashcards(data)
      setLoading(false)
    }
    fetchFlashcards()
  }, [])

  async function handleDelete(id: string) {
    try {
      // First, get all match_rounds that reference this flashcard
      const { data: matchRounds } = await supabase
        .from("match_rounds")
        .select("id")
        .eq("flashcard_id", id);

      // Delete round_attempts for these match_rounds
      if (matchRounds && matchRounds.length > 0) {
        const roundIds = matchRounds.map(round => round.id);
        
        const { error: attemptsError } = await supabase
          .from("round_attempts")
          .delete()
          .in("round_id", roundIds);

        if (attemptsError) {
          console.warn("Could not delete round attempts:", attemptsError);
        }
      }

      // Then delete all match_rounds that reference this flashcard
      const { error: roundsError } = await supabase
        .from("match_rounds")
        .delete()
        .eq("flashcard_id", id);

      if (roundsError) {
        console.warn("Could not delete match rounds:", roundsError);
      }

      // Now delete the flashcard
      const { error } = await supabase.from("flashcards").delete().eq("id", id);
      
      if (error) {
        // Handle specific foreign key constraint error
        if (error.code === "23503") {
          alert("Cannot delete this flashcard because it's still being referenced in the database. Please try again or contact an administrator.");
        } else {
          alert(`Failed to delete flashcard: ${error.message}`);
        }
        return;
      }

      // Update UI only if deletion was successful
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
      setDeleteId(null); // Close the dialog
      
    } catch (err) {
      console.error("Delete error:", err);
      alert("An unexpected error occurred while deleting the flashcard.");
    }
  }

  if (loading) return (
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
        Loading flashcards...
      </motion.div>
    </div>
  )

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
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Flashcards
              </h1>
            </div>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Master any subject with interactive flashcards. Create, study, and excel!
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-purple-50 shadow-xl">
                <Link href="/flashcards/new" className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Flashcard
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {flashcards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No flashcards yet</h3>
            <p className="text-gray-600 mb-8">Create your first flashcard to get started!</p>
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Link href="/flashcards/new" className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Your First Flashcard
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <Badge variant="secondary" className="mb-4 bg-purple-100 text-purple-700 px-4 py-2">
                {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''} available
              </Badge>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {flashcards.map((f, index) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <CardHeader className="relative">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-purple-700 transition-colors">
                            {f.question}
                          </CardTitle>
                          <AlertDialog open={deleteId === f.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(f.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-0 shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold text-gray-800">
                                  Delete Flashcard
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600">
                                  Are you sure you want to delete this flashcard? This will also remove it from any matches where it&apos;s being used. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteId(null)} className="hover:bg-gray-100">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(f.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative">
                        <div className="space-y-3">
                          {f.options.map((opt, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index * 0.1) + (i * 0.05) }}
                              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                opt === f.correct_answer
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 font-semibold"
                                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-white border-2 border-current flex items-center justify-center text-xs font-bold">
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span>{opt}</span>
                                {opt === f.correct_answer && (
                                  <Badge className="ml-auto bg-green-100 text-green-700 hover:bg-green-100">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
