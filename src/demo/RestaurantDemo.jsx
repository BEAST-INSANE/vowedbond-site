import React, { useEffect, useRef, useState } from "react";

export default function RestaurantDemo() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);

  const [showGreeting, setShowGreeting] = useState(false);
  const [showUserTyping, setShowUserTyping] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const openChat = () => {
    clearTimers();
    setIsChatOpen(true);
  };

  const closeChat = () => {
    clearTimers();
    setIsChatVisible(false);

    window.setTimeout(() => {
      setIsChatOpen(false);
      setShowGreeting(false);
      setShowUserTyping(false);
      setShowQuestion(false);
      setShowTyping(false);
      setShowAnswer(false);
    }, 260);
  };

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      openChat();
    }, 2000);

    return () => clearTimeout(startTimer);
  }, []);

  useEffect(() => {
    if (!isChatOpen) return;

    const raf = window.requestAnimationFrame(() => {
      setIsChatVisible(true);
    });

    setShowGreeting(true);
    setShowUserTyping(false);
    setShowQuestion(false);
    setShowTyping
