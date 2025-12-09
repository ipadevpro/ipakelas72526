import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <motion.div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  )
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("w-full h-4 bg-muted rounded", className)}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

interface LoadingSkeletonProps {
  className?: string
  rows?: number
}

export function LoadingSkeleton({ className, rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 bg-industrial-light"
          style={{ width: `${Math.random() * 40 + 60}%` }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

export function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border-2 border-industrial-black bg-industrial-white space-y-3", className)}>
      <motion.div
        className="h-6 bg-industrial-light w-3/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <LoadingSkeleton rows={2} />
      <motion.div
        className="h-8 bg-industrial-light w-1/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
    </div>
  )
}

// Industrial Minimalism Skeleton Components
export function IndustrialSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border-2 border-industrial-black bg-industrial-white space-y-3", className)}>
      <motion.div
        className="h-6 bg-industrial-light w-3/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="space-y-2">
        <motion.div
          className="h-4 bg-industrial-light w-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        />
        <motion.div
          className="h-4 bg-industrial-light w-5/6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
      </div>
      <motion.div
        className="h-8 bg-industrial-light w-1/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  )
}

export function IndustrialSkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <motion.div
          key={index}
          className="flex items-center gap-4 p-4 border-2 border-industrial-black bg-industrial-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
        >
          <div className="w-10 h-10 bg-industrial-light border-2 border-industrial-black"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-industrial-light w-3/4"></div>
            <div className="h-3 bg-industrial-light w-1/2"></div>
          </div>
          <div className="h-6 bg-industrial-light w-20"></div>
        </motion.div>
      ))}
    </div>
  )
}

export function IndustrialSkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          className="p-4 border-2 border-industrial-black bg-industrial-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-industrial-light border-2 border-industrial-black"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-industrial-light w-3/4"></div>
              <div className="h-3 bg-industrial-light w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-industrial-light w-full"></div>
            <div className="h-3 bg-industrial-light w-5/6"></div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function IndustrialSkeletonGrid({ items = 4, cols = 2 }: { items?: number; cols?: number }) {
  return (
    <div className={cn("grid gap-4", cols === 2 ? "grid-cols-1 md:grid-cols-2" : cols === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-4")}>
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          className="p-4 border-2 border-industrial-black bg-industrial-white space-y-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.1 }}
        >
          <div className="h-6 bg-industrial-light w-3/4"></div>
          <div className="h-4 bg-industrial-light w-full"></div>
          <div className="h-4 bg-industrial-light w-2/3"></div>
        </motion.div>
      ))}
    </div>
  )
} 