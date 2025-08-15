import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const slotsPerHour = 4;
const hours = Array.from({ length: 24 }, (_, i) => i);
const PARTY_DURATION = 15 * 60;

const AVATARS = [
  "👨‍🦱", "👩‍🦰", "🧔", "👩‍🎤", "🧑‍💻", "🧑‍🚀", "🧑‍🎨"
];

const BIN_ID = "689f07b343b1c97be91ee34c";
const API_KEY = "$2a$10$0DS7zEgFMQ6j4Hln.oEHz.0DPGkaKjsxLIewfE6Vpjh9WzuyDO52W";
const HEADERS = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY
};
const ENDPOINT = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

export default function BilliardBooking() {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState({});
  const [names, setNames] = useState(["", "", "", ""]);
  const [avatars, setAvatars] = useState([0, 1, 2, 3]);
  const [results, setResults] = useState(["", "", "", ""]);
  const [scores, setScores] = useState([]);
  const [knownPlayers, setKnownPlayers] = useState([]);
  const [timer, setTimer] = useState(PARTY_DURATION);
  const [running, setRunning] = useState(false);
  const [animateEnd, setAnimateEnd] = useState(false);

  const fetchData = async () => {
    const res = await fetch(`${ENDPOINT}/latest`, { headers: HEADERS });
    const json = await res.json();
    setScores(json.record.scores || []);
    setBookings(json.record.bookings || {});
  };

  const saveData = async (updatedScores, updatedBookings) => {
    await fetch(ENDPOINT, {
      method: "PUT",
      headers: HEADERS,
      body: JSON.stringify({
        scores: updatedScores,
        bookings: updatedBookings
      })
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const uniqueNames = Array.from(
      new Set(scores.map((s) => s.name).filter(Boolean))
    );
    setKnownPlayers(uniqueNames);
  }, [scores]);

  useEffect(() => {
    let interval;
    if (running && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && running) {
      finishGame();
    }
    return () => clearInterval(interval);
  }, [running, timer]);

  const getKey = (date: Date) => date.toDateString();
  const currentKey = getKey(date);

  const bookSlot = async (time: string) => {
    const filled = names.filter((n) => n.trim()).join(", ");
    if (!filled) return;
    const currentBookings = bookings[currentKey] || [];
    if (!currentBookings.find((b) => b.time === time)) {
      const updated = {
        ...bookings,
        [currentKey]: [...currentBookings, { time, name: filled }],
      };
      setBookings(updated);
      await saveData(scores, updated);
    }
  };

  const startGame = () => {
    setTimer(PARTY_DURATION);
    setRunning(true);
    setAnimateEnd(false);
  };

  const finishGame = () => {
    setRunning(false);
    setAnimateEnd(true);
  };

  const validateScores = async () => {
    const now = new Date().toLocaleDateString("fr-FR");
    const newEntries = names.map((name, i) => {
      return name.trim() && results[i]
        ? {
            name,
            result: results[i],
            date: now,
            avatar: AVATARS[avatars[i] % AVATARS.length]
          }
        : null;
    }).filter(Boolean);
    const updatedScores = [...scores, ...newEntries];
    setScores(updatedScores);
    setResults(["", "", "", ""]);
    await saveData(updatedScores, bookings);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const winCounts: Record<string, { win: number; lose: number }> = scores.reduce((acc, { name, result }) => {
    if (!name || !result) return acc;
    if (!acc[name]) acc[name] = { win: 0, lose: 0 };
    if (result === "Gagné") acc[name].win++;
    if (result === "Perdu") acc[name].lose++;
    return acc;
  }, {});

  const sortedRanking = Object.entries(winCounts)
    .sort(([, a], [, b]) => b.win - a.win)
    .map(([name, { win, lose }], index) => ({ name, win, lose, rank: index + 1 }));

  // ... JSX ici
}
