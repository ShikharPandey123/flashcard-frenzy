"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          success: '!bg-green-100 !border-green-300 !text-green-800',
          error: '!bg-red-100 !border-red-300 !text-red-800',
          warning: '!bg-yellow-100 !border-yellow-300 !text-yellow-800',
          info: '!bg-blue-100 !border-blue-300 !text-blue-800',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
