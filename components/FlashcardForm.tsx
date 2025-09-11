"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Sparkles, BookOpen, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

type FlashcardFormProps = {
  onSuccess?: () => void
}

export default function FlashcardForm({ onSuccess }: FlashcardFormProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctIndex, setCorrectIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!question.trim() || correctIndex === null) {
      setError("Please fill question and select correct answer")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.from("flashcards").insert([
        {
          question,
          options,
          correct_answer: options[correctIndex],
        },
      ])
      if (error) throw error

      setQuestion("")
      setOptions(["", "", "", ""])
      setCorrectIndex(null)

      if (onSuccess) onSuccess()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Create New Flashcard</CardTitle>
                <CardDescription className="text-purple-100">
                  Design an interactive learning card with multiple choice options
                </CardDescription>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Label htmlFor="question" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center text-sm font-bold">
                    Q
                  </span>
                  Question
                </Label>
                <Input
                  id="question"
                  type="text"
                  placeholder="Enter your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="text-lg p-4 border-2 border-gray-200 focus:border-purple-500 transition-colors bg-white/50"
                />
              </motion.div>

              {/* Options Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold text-gray-800">Answer Options</Label>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Choose the correct answer
                  </Badge>
                </div>
                
                <RadioGroup
                  value={correctIndex?.toString()}
                  onValueChange={(value) => setCorrectIndex(parseInt(value))}
                  className="space-y-4"
                >
                  {options.map((opt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                        correctIndex === i
                          ? "border-green-400 bg-green-50 shadow-lg"
                          : "border-gray-200 bg-white/50 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            correctIndex === i
                              ? "bg-green-500 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <Input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            value={opt}
                            onChange={(e) =>
                              setOptions((prev) => {
                                const copy = [...prev]
                                copy[i] = e.target.value
                                return copy
                              })
                            }
                            className="border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value={i.toString()}
                            id={`option-${i}`}
                            className="data-[state=checked]:border-green-500 data-[state=checked]:text-green-500"
                          />
                          <Label 
                            htmlFor={`option-${i}`} 
                            className={`text-sm font-medium cursor-pointer ${
                              correctIndex === i ? "text-green-700" : "text-gray-600"
                            }`}
                          >
                            Correct
                          </Label>
                          {correctIndex === i && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-green-500"
                            >
                              <Check className="w-4 h-4" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </RadioGroup>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center pt-4"
              >
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full max-w-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                      Creating Flashcard...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Save Flashcard
                    </div>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
