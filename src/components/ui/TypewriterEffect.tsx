"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { COLORS } from "@/lib/constants";

export interface TypewriterEffectProps {
  words: string[];
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
  deleteSpeed?: number;
  delayBetweenWords?: number;
  loop?: boolean;
  startOnView?: boolean;
  onComplete?: () => void;
}

export const TypewriterEffect = memo(({
  words,
  className = "",
  cursorClassName = "",
  typingSpeed = 100,
  deleteSpeed = 50,
  delayBetweenWords = 2000,
  loop = false,
  startOnView = true,
  onComplete,
}: TypewriterEffectProps) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInView, setIsInView] = useState(!startOnView);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setIsInView(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!isInView) return;

    const char = words[currentIndex];
    if (!char) return;

    if (!isDeleting) {
      if (displayText.length < char.length) {
        const timeout = setTimeout(() => {
          setDisplayText(char.slice(0, displayText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        if (onComplete && currentIndex === words.length - 1 && !loop) {
          onComplete();
        }
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delayBetweenWords);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(char.slice(0, displayText.length - 1));
        }, deleteSpeed);
        return () => clearTimeout(timeout);
      } else {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= words.length) {
          if (loop) {
            setCurrentIndex(0);
          } else {
            setCurrentIndex(nextIndex);
          }
        } else {
          setCurrentIndex(nextIndex);
        }
        setIsDeleting(false);
      }
      return;
    }
  }, [
    displayText,
    currentIndex,
    isDeleting,
    isInView,
    words,
    typingSpeed,
    deleteSpeed,
    delayBetweenWords,
    loop,
    onComplete,
  ]);

  return (
    <div
      ref={containerRef}
      className={`inline-block font-display ${className}`}
    >
      <motion.span
        style={{ color: COLORS.primary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {displayText}
      </motion.span>
      <motion.span
        className={`inline-block w-[2px] h-6 sm:h-8 bg-primary ml-1 ${cursorClassName}`}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  );
});

TypewriterEffect.displayName = "TypewriterEffect";
export default TypewriterEffect;


