import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PUSMENDIK_TRYOUT } from '../data/tryoutData';
import { recordTryout, getActivityData } from '../utils/activityTracker';
import { formatMath } from '../utils/mathRenderer';
import {
  BookOpen,
  Calculator,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Check,
  XCircle,
  X,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  RotateCcw,
  Eye,
  LayoutDashboard,
} from 'lucide-react';

/**
 * Halaman Penuh Simulasi Tryout Akbar TKA SD Nasional
 * 
 * Ketentuan:
 * - Mapel: Bahasa Indonesia & Matematika
 * - Total 5 Tryout (Paket 1 - 5)
 * - Standar TKA SD Nasional (30 Soal, 60 Menit)
 * - Tipe kesulitan HOTS, Mudah, Sedang diacak posisinya
 * - Format: Sebagian besar Pilihan Ganda (PG) dan beberapa soal Isian Singkat
 * - Timer hitung mundur, lembar navigasi nomor, skor & pembahasan
 */

// Helper abjad pilihan A, B, C, D, E...
const getOptionLetter = (idx) => {
  if (typeof idx !== 'number' || idx < 0) return '';
  return String.fromCharCode(65 + idx);
};

// Cari indeks opsi dari value (string atau index)
const findOptionIndex = (options, val) => {
  if (!Array.isArray(options) || val === undefined || val === null) return -1;
  if (typeof val === 'number' && val >= 0 && val < options.length) return val;
  const strVal = String(val).trim().toLowerCase();
  return options.findIndex(
    (opt) => String(opt).trim().toLowerCase() === strVal
  );
};

// Evaluasi kebenaran jawaban satu soal secara ketat & akurat
export const evaluateQuestionResult = (q, userVal) => {
  // Jika belum dijawab atau kosong, dipastikan SALAH
  if (userVal === undefined || userVal === null || userVal === '') {
    return { isCorrect: false, isAnswered: false };
  }

  const qType = q.type || q.tipe || 'mcq';

  // 1. Pilihan Ganda Kompleks (mcma)
  if (qType === 'mcma') {
    if (!Array.isArray(userVal) || userVal.length === 0 || !Array.isArray(q.answer)) {
      return { isCorrect: false, isAnswered: Array.isArray(userVal) && userVal.length > 0 };
    }
    const matchAll =
      q.answer.length === userVal.length &&
      q.answer.every((ans) =>
        userVal.some((u) => String(u).trim().toLowerCase() === String(ans).trim().toLowerCase())
      );
    return { isCorrect: matchAll, isAnswered: true };
  }

  // 2. Benar / Salah (category)
  if (qType === 'category') {
    if (
      typeof userVal !== 'object' ||
      userVal === null ||
      Array.isArray(userVal) ||
      !Array.isArray(q.statements)
    ) {
      return { isCorrect: false, isAnswered: false };
    }
    const keys = Object.keys(userVal);
    if (keys.length === 0) {
      return { isCorrect: false, isAnswered: false };
    }
    const allAnswered = q.statements.every((_, sIdx) => userVal[sIdx] !== undefined);
    const isCorrect = allAnswered && q.statements.every((s, sIdx) => userVal[sIdx] === s.answer);
    return { isCorrect, isAnswered: true };
  }

  // 3. Isian Singkat (isian)
  if (qType === 'isian') {
    const rawCorrect = q.answer !== undefined ? q.answer : q.jawabanBenar;
    if (rawCorrect === undefined || rawCorrect === null) {
      return { isCorrect: false, isAnswered: true };
    }
    const isCorrect =
      String(userVal).trim().toLowerCase() === String(rawCorrect).trim().toLowerCase();
    return { isCorrect, isAnswered: true };
  }

  // 4. Pilihan Ganda Tunggal (mcq)
  const options = q.options || q.pilihan || [];
  const rawCorrect = q.answer !== undefined ? q.answer : q.jawabanBenar;
  if (rawCorrect === undefined || rawCorrect === null) {
    return { isCorrect: false, isAnswered: true };
  }

  const strUser = String(userVal).trim().toLowerCase();
  const strCorrect = String(rawCorrect).trim().toLowerCase();

  // Cocok string langsung
  if (strUser === strCorrect) {
    return { isCorrect: true, isAnswered: true };
  }

  // User menjawab dengan index nomor
  if (typeof userVal === 'number' && options[userVal] !== undefined) {
    if (String(options[userVal]).trim().toLowerCase() === strCorrect) {
      return { isCorrect: true, isAnswered: true };
    }
  }

  // Kunci jawaban berupa index nomor
  if (typeof rawCorrect === 'number' && options[rawCorrect] !== undefined) {
    if (strUser === String(options[rawCorrect]).trim().toLowerCase()) {
      return { isCorrect: true, isAnswered: true };
    }
    if (userVal === rawCorrect) {
      return { isCorrect: true, isAnswered: true };
    }
  }

  // User menjawab dengan huruf 'A', 'B', 'C', 'D'
  if (/^[A-E]$/i.test(strUser)) {
    const charIdx = strUser.toUpperCase().charCodeAt(0) - 65;
    if (
      options[charIdx] !== undefined &&
      String(options[charIdx]).trim().toLowerCase() === strCorrect
    ) {
      return { isCorrect: true, isAnswered: true };
    }
  }

  return { isCorrect: false, isAnswered: true };
};

// Ambil teks Kunci Jawaban dengan awalan huruf abjad (misal "A. 12")
const getDisplayKeyAnswer = (q) => {
  const qType = q.type || q.tipe || 'mcq';
  const options = q.options || q.pilihan || [];
  const correctAns = q.answer !== undefined ? q.answer : q.jawabanBenar;

  if (correctAns === undefined || correctAns === null) return '-';

  if (qType === 'category') {
    return 'Lihat rincian pernyataan di atas';
  }

  if (qType === 'mcma') {
    if (Array.isArray(correctAns)) {
      return correctAns
        .map((ans) => {
          const optIdx = findOptionIndex(options, ans);
          return optIdx !== -1 ? `${getOptionLetter(optIdx)}. ${ans}` : ans;
        })
        .join('; ');
    }
    return String(correctAns);
  }

  if (qType === 'isian') {
    return String(correctAns);
  }

  // Pilihan Ganda Tunggal (MCQ)
  const optIdx = findOptionIndex(options, correctAns);
  if (optIdx !== -1) {
    return `${getOptionLetter(optIdx)}. ${options[optIdx]}`;
  }
  return String(correctAns);
};

// Ambil teks Jawaban Siswa dengan awalan huruf abjad (misal "A. 12")
const getDisplayUserAnswer = (q, userVal) => {
  if (userVal === undefined || userVal === null || userVal === '') {
    return '(Tidak dijawab)';
  }

  const qType = q.type || q.tipe || 'mcq';
  const options = q.options || q.pilihan || [];

  if (qType === 'category') {
    return '';
  }

  if (qType === 'mcma') {
    if (Array.isArray(userVal) && userVal.length > 0) {
      return userVal
        .map((ans) => {
          const optIdx = findOptionIndex(options, ans);
          return optIdx !== -1 ? `${getOptionLetter(optIdx)}. ${ans}` : ans;
        })
        .join('; ');
    }
    return '(Tidak dijawab)';
  }

  if (qType === 'isian') {
    return String(userVal);
  }

  // Pilihan Ganda Tunggal (MCQ)
  const optIdx = findOptionIndex(options, userVal);
  if (optIdx !== -1) {
    return `${getOptionLetter(optIdx)}. ${options[optIdx]}`;
  }
  return String(userVal);
};

// Helper cek apakah soal tryout sudah terjawab lengkap
export const isTryoutQuestionAnswered = (q, ans) => {
  if (ans === undefined || ans === null || ans === '') return false;
  const qType = q?.type || q?.tipe || 'mcq';
  if (qType === 'mcma') {
    return Array.isArray(ans) && ans.length > 0;
  }
  if (qType === 'category') {
    if (typeof ans !== 'object' || ans === null) return false;
    if (Array.isArray(q.statements) && q.statements.length > 0) {
      return q.statements.every((_, sIdx) => ans[sIdx] !== undefined);
    }
    return Object.keys(ans).length > 0;
  }
  if (qType === 'isian') {
    return typeof ans === 'string' && ans.trim().length > 0;
  }
  return true;
};

const Tryout = () => {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState(null); // 'bahasa_indonesia' | 'matematika'
  const [activePackage, setActivePackage] = useState(null); // Object paket tryout
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: optionIndex (PG) | text (Isian) }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(3600); // 60 menit = 3600 detik
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [completedTryouts, setCompletedTryouts] = useState({});
  const activeNavBtnRef = useRef(null);

  // Auto-scroll ke nomor soal yang sedang aktif di lembar navigasi
  useEffect(() => {
    if (activeNavBtnRef.current) {
      activeNavBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentQuestionIndex]);

  // Muat status paket tryout yang sudah pernah dikerjakan secara persisten
  const loadCompletedTryouts = () => {
    try {
      const raw = localStorage.getItem('tka_sd_completed_tryouts');
      const map = raw ? JSON.parse(raw) : {};

      // Sinkronkan juga dari activityTracker jika ada data yang belum tercatat di map
      const act = getActivityData();
      if (Array.isArray(act?.tryoutHistory)) {
        act.tryoutHistory.forEach((h) => {
          if (!h.id?.startsWith('to_sample')) {
            const key = `${h.subject}_${h.packageNum}`;
            if (!map[key]) {
              map[key] = {
                score: h.score,
                correctCount: h.correct,
                totalCount: h.total || 30,
                userAnswers: h.userAnswers || {},
                isCompletedAll: h.isCompletedAll,
                expEarned: h.expEarned,
              };
            }
          }
        });
      }
      setCompletedTryouts(map);
    } catch (e) {
      console.error('Gagal membaca data selesai tryout:', e);
    }
  };

  useEffect(() => {
    loadCompletedTryouts();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    let timer = null;
    if (isExamRunning && timeLeftSeconds > 0 && !isFinished) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamRunning, timeLeftSeconds, isFinished]);

  // Format detik ke format mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Mulai Tryout
  const handleStartExam = (pkg) => {
    setActivePackage(pkg);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(pkg.durasiMenit * 60);
    setIsExamRunning(true);
    setIsFinished(false);
    setIsReviewMode(false);
    setScoreResult(null);
  };

  // Buka langsung Mode Review & Pembahasan untuk paket yang sudah pernah dikerjakan
  const handleOpenReview = (pkg, completedInfo) => {
    setActivePackage(pkg);
    setCurrentQuestionIndex(0);
    setUserAnswers(completedInfo?.userAnswers || {});
    setScoreResult({
      score: completedInfo?.score || 0,
      correctCount: completedInfo?.correctCount || 0,
      totalCount: pkg.soal.length,
      wrongCount: pkg.soal.length - (completedInfo?.correctCount || 0),
      timeSpentSeconds: 0,
      isCompletedAll: completedInfo?.isCompletedAll ?? true,
      expEarned: completedInfo?.expEarned || 0,
    });
    setIsExamRunning(false);
    setIsFinished(true);
    setIsReviewMode(true);
  };

  // Pilih/Ketik Jawaban
  const handleAnswerChange = (val) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: val,
    }));
  };

  // Kumpulkan & Hitung Nilai
  const handleFinishExam = () => {
    setIsExamRunning(false);
    const questions = activePackage.soal;
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const userVal = userAnswers[idx];
      const { isCorrect } = evaluateQuestionResult(q, userVal);
      if (isCorrect) correctCount++;
    });

    const isCompletedAll = questions.every((q, idx) => isTryoutQuestionAnswered(q, userAnswers[idx]));
    const answeredCount = questions.filter((q, idx) => isTryoutQuestionAnswered(q, userAnswers[idx])).length;

    const score = Number(((correctCount / (questions.length || 1)) * 100).toFixed(1));
    const expEarned = isCompletedAll ? Math.round(150 + score) : 0;

    const result = {
      score,
      correctCount,
      totalCount: questions.length,
      wrongCount: questions.length - correctCount,
      timeSpentSeconds: activePackage.durasiMenit * 60 - timeLeftSeconds,
      isCompletedAll,
      answeredCount,
      expEarned,
    };

    setScoreResult(result);
    setIsFinished(true);

    // Rekam ke tracker aktivitas (EXP hanya diberikan jika isCompletedAll === true)
    recordTryout({
      subject: selectedSubject,
      packageNum: activePackage.nomorPaket,
      score,
      correct: correctCount,
      total: questions.length,
      userAnswers,
      isCompletedAll,
      expEarned,
    });

    // Simpan ke status paket selesai
    const completionKey = `${selectedSubject}_${activePackage.nomorPaket}`;
    const newCompletion = {
      score,
      correctCount,
      totalCount: questions.length,
      userAnswers,
      isCompletedAll,
      expEarned,
      updatedAt: Date.now(),
    };
    try {
      const raw = localStorage.getItem('tka_sd_completed_tryouts');
      const existing = raw ? JSON.parse(raw) : {};
      existing[completionKey] = newCompletion;
      localStorage.setItem('tka_sd_completed_tryouts', JSON.stringify(existing));
      setCompletedTryouts(existing);
    } catch (e) {
      console.error('Gagal menyimpan riwayat pengerjaan:', e);
    }
  };

  const handleBackNavigation = () => {
    if (activePackage) {
      if (isExamRunning && !isFinished) {
        if (
          !window.confirm(
            'Simulasi Tryout sedang berjalan. Jika Anda kembali sekarang, progres pengerjaan saat ini tidak akan tersimpan. Yakin ingin kembali ke daftar paket tryout?'
          )
        ) {
          return;
        }
      }
      setActivePackage(null);
      setIsExamRunning(false);
      setIsFinished(false);
      setIsReviewMode(false);
    } else if (selectedSubject) {
      setSelectedSubject(null);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800">
      {/* 1. Navbar Bagian Atas */}
      <Navbar />

      {/* 2. Konten Utama Halaman Tryout */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col animate-fade-in">
        {/* Navigasi Breadcrumb & Tombol Kembali Konsisten dengan Latihan Soal */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-blue-200 flex-wrap">
            <button
              onClick={() => {
                if (isExamRunning && !isFinished) {
                  if (
                    !window.confirm(
                      'Simulasi Tryout sedang berjalan. Jika Anda keluar sekarang, progres saat ini akan hilang. Yakin ingin kembali ke Dashboard?'
                    )
                  ) {
                    return;
                  }
                }
                navigate('/dashboard');
              }}
              className="hover:text-white font-medium flex items-center space-x-1 cursor-pointer transition-colors text-blue-200"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-blue-300/50">/</span>
            <button
              onClick={() => {
                if (isExamRunning && !isFinished) {
                  if (
                    !window.confirm(
                      'Simulasi Tryout sedang berjalan. Yakin ingin kembali ke pilihan mata pelajaran?'
                    )
                  ) {
                    return;
                  }
                }
                setSelectedSubject(null);
                setActivePackage(null);
                setIsExamRunning(false);
              }}
              className={`font-medium hover:text-white transition-colors cursor-pointer ${
                !selectedSubject ? 'text-white font-bold' : 'text-blue-200'
              }`}
            >
              Simulasi Tryout
            </button>
            {selectedSubject && (
              <>
                <span className="text-blue-300/50">/</span>
                <button
                  onClick={() => {
                    if (isExamRunning && !isFinished) {
                      if (
                        !window.confirm(
                          'Simulasi Tryout sedang berjalan. Yakin ingin kembali ke daftar paket tryout?'
                        )
                      ) {
                        return;
                      }
                    }
                    setActivePackage(null);
                    setIsExamRunning(false);
                    setIsFinished(false);
                    setIsReviewMode(false);
                  }}
                  className={`font-medium hover:text-white transition-colors cursor-pointer ${
                    !activePackage ? 'text-white font-bold' : 'text-blue-200'
                  }`}
                >
                  {PUSMENDIK_TRYOUT[selectedSubject].nama}
                </button>
              </>
            )}
            {activePackage && (
              <>
                <span className="text-blue-300/50">/</span>
                <span className="text-amber-300 font-medium truncate max-w-[150px] sm:max-w-xs">
                  {activePackage.namaPaket}
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleBackNavigation}
            className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 hover:text-blue-700 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {activePackage
                ? 'Kembali ke Paket Tryout'
                : selectedSubject
                ? 'Ganti Mata Pelajaran'
                : 'Dashboard'}
            </span>
          </button>
        </div>

        {/* Kartu Utama Tryout */}
        <div className={`bg-white border-2 rounded-2xl w-full flex-1 flex flex-col shadow-xl overflow-hidden relative ${
          activePackage && isExamRunning
            ? 'border-[#C25E38]'
            : selectedSubject === 'matematika'
            ? 'border-[#881337]'
            : selectedSubject === 'bahasa_indonesia'
            ? 'border-[#047857]'
            : 'border-slate-400'
        }`}>
          {/* Header Bar */}
          <div className={`p-4 border-b-2 flex items-center justify-between transition-colors ${
            activePackage && isExamRunning
              ? 'bg-[#FAECE6]/50 border-[#F4D3C4]'
              : selectedSubject === 'matematika'
              ? 'bg-[#FFF1F2]/40 border-[#FECDD3]'
              : selectedSubject === 'bahasa_indonesia'
              ? 'bg-[#ECFDF5]/40 border-[#A7F3D0]'
              : 'bg-slate-50 border-slate-300'
          }`}>
            <div className="flex items-center space-x-3">
              {activePackage && !isExamRunning ? (
                <button
                  onClick={() => {
                    setActivePackage(null);
                    setIsFinished(false);
                    setIsReviewMode(false);
                  }}
                  className="w-7 h-7 rounded-md bg-white hover:bg-[#F2ECE4] border border-[#E6DFD5] flex items-center justify-center text-[#261C14] transition-colors cursor-pointer"
                  title="Pilih Paket Lain"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              ) : selectedSubject && !isExamRunning ? (
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="w-7 h-7 rounded-md bg-white hover:bg-[#F2ECE4] border border-[#E6DFD5] flex items-center justify-center text-[#261C14] transition-colors cursor-pointer"
                  title="Pilih Mapel Lain"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              ) : null}

              <div>
                <h2 className="text-base font-semibold text-[#261C14] flex items-center space-x-2">
                  <span>Simulasi Tryout TKA SD</span>
                </h2>
                <p className="text-xs text-[#6E6258]">
                  {activePackage
                    ? `${PUSMENDIK_TRYOUT[selectedSubject].nama} - ${activePackage.namaPaket}`
                    : selectedSubject
                    ? `Pilih Paket Tryout (${PUSMENDIK_TRYOUT[selectedSubject].nama})`
                    : 'Pilih Mata Pelajaran (Bahasa Indonesia / Matematika)'}
                </p>
              </div>
            </div>

            {/* Timer Display saat ujian berlangsung */}
            {isExamRunning && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold border bg-[#FAECE6] text-[#C25E38] border-[#F4D3C4]">
                <Clock className="w-3.5 h-3.5 text-[#C25E38]" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 p-4 sm:p-6 bg-white">
            {/* TAHAP 1: Pilih Mata Pelajaran (BI / MTK) */}
            {!selectedSubject && (
              <div className="max-w-4xl mx-auto py-4 sm:py-8">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
                    Pilih Mata Pelajaran Tryout
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                    Pilih mata pelajaran untuk melihat 5 paket simulasi ujian berstandar AKM dan TKA SD Nasional.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Kartu 1: Bahasa Indonesia (Emerald) */}
                  {(() => {
                    const biPackages = PUSMENDIK_TRYOUT.bahasa_indonesia?.paket || [];
                    const biCompletedCount = biPackages.filter((p) => !!completedTryouts[`bahasa_indonesia_${p.nomorPaket}`]).length;
                    const biPercent = Math.round((biCompletedCount / (biPackages.length || 1)) * 100);

                    return (
                      <div
                        onClick={() => setSelectedSubject('bahasa_indonesia')}
                        onMouseMove={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                          e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                        }}
                        className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl border-2 border-[#047857] bg-white hover:border-[#047857] hover:ring-4 hover:ring-[#047857]/20 hover:shadow-2xl hover:shadow-[#047857]/20 hover:-translate-y-2 active:scale-[0.985] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between select-none"
                      >
                        {/* Interactive Cursor Spotlight Glow */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'radial-gradient(350px circle at var(--mx, 50%) var(--my, 50%), rgba(4, 120, 87, 0.1), transparent 75%)',
                          }}
                        />

                        {/* Top Emerald Accent Strip */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#047857] transition-all" />

                        <div className="relative z-10">
                          {/* Header: Icon & Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] group-hover:shadow-md group-hover:bg-[#D1FAE5]">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] transition-all duration-300 group-hover:scale-105 shadow-2xs">
                              5 Paket Simulasi
                            </span>
                          </div>

                          {/* Judul & Deskripsi */}
                          <h4 className="text-lg font-bold text-slate-800 group-hover:text-[#047857] transition-colors duration-200">
                            Tryout Bahasa Indonesia
                          </h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            Simulasi literasi membaca, kaidah kebahasaan, teks naratif, puisi, dan analisis inferensial sesuai standar AKM Pusmendik.
                          </p>

                          {/* Grid Layout Spesifikasi Tryout */}
                          <div className="mt-4 grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border-2 border-emerald-500/80 text-xs">
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Clock className="w-4 h-4 text-[#047857] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Durasi Ujian</p>
                                <p className="font-semibold text-slate-800">60 Menit</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <HelpCircle className="w-4 h-4 text-[#047857] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Jumlah Soal</p>
                                <p className="font-semibold text-slate-800">30 Soal (PG & Isian)</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Sparkles className="w-4 h-4 text-[#047857] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Standar Ujian</p>
                                <p className="font-semibold text-slate-800">TKA SD & HOTS</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Trophy className="w-4 h-4 text-[#047857] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Penilaian</p>
                                <p className="font-semibold text-slate-800">Skor & Pembahasan</p>
                              </div>
                            </div>
                          </div>

                          {/* Bar Progres Pengerjaan */}
                          <div className="mt-4 pt-3 border-t border-[#E6DFD5]">
                            <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600">
                              <span>Progres Paket:</span>
                              <span className="text-[#047857] font-bold">
                                {biCompletedCount} dari 5 Selesai ({biPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#047857] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(biCompletedCount > 0 ? 8 : 0, biPercent)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer Action Link */}
                        <div className="relative z-10 mt-5 pt-3.5 border-t border-[#E6DFD5] flex items-center justify-between text-xs sm:text-sm font-bold text-[#047857] transition-all">
                          <span className="group-hover:translate-x-1 transition-transform duration-300">
                            Pilih Paket 1 s.d. 5
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center group-hover:translate-x-1.5 group-hover:bg-[#047857] group-hover:text-white transition-all duration-300 shadow-2xs">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Kartu 2: Matematika (Burgundy) */}
                  {(() => {
                    const mtkPackages = PUSMENDIK_TRYOUT.matematika?.paket || [];
                    const mtkCompletedCount = mtkPackages.filter((p) => !!completedTryouts[`matematika_${p.nomorPaket}`]).length;
                    const mtkPercent = Math.round((mtkCompletedCount / (mtkPackages.length || 1)) * 100);

                    return (
                      <div
                        onClick={() => setSelectedSubject('matematika')}
                        onMouseMove={(e) => {
                          const r = e.currentTarget.getBoundingClientRect();
                          e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                          e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                        }}
                        className="group relative overflow-hidden p-5 sm:p-6 rounded-2xl border-2 border-[#881337] bg-white hover:border-[#881337] hover:ring-4 hover:ring-[#881337]/20 hover:shadow-2xl hover:shadow-[#881337]/20 hover:-translate-y-2 active:scale-[0.985] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between select-none"
                      >
                        {/* Interactive Cursor Spotlight Glow */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'radial-gradient(350px circle at var(--mx, 50%) var(--my, 50%), rgba(136, 19, 55, 0.1), transparent 75%)',
                          }}
                        />

                        {/* Top Burgundy Accent Strip */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#881337] transition-all" />

                        <div className="relative z-10">
                          {/* Header: Icon & Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#881337] flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-[4deg] group-hover:shadow-md group-hover:bg-[#FFE4E6]">
                              <Calculator className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF1F2] text-[#881337] border border-[#FECDD3] transition-all duration-300 group-hover:scale-105 shadow-2xs">
                              5 Paket Simulasi
                            </span>
                          </div>

                          {/* Judul & Deskripsi */}
                          <h4 className="text-lg font-bold text-slate-800 group-hover:text-[#881337] transition-colors duration-200">
                            Tryout Matematika
                          </h4>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            Simulasi numerasi: hitung campuran, KPK/FPB, geometri, perbandingan skala, dan problem solving nyata.
                          </p>

                          {/* Grid Layout Spesifikasi Tryout */}
                          <div className="mt-4 grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#FAF7F2] border-2 border-rose-500/80 text-xs">
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Clock className="w-4 h-4 text-[#881337] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Durasi Ujian</p>
                                <p className="font-semibold text-slate-800">60 Menit</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <HelpCircle className="w-4 h-4 text-[#881337] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Jumlah Soal</p>
                                <p className="font-semibold text-slate-800">30 Soal (PG & Isian)</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Sparkles className="w-4 h-4 text-[#881337] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Standar Ujian</p>
                                <p className="font-semibold text-slate-800">TKA SD & HOTS</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Trophy className="w-4 h-4 text-[#881337] flex-shrink-0" />
                              <div>
                                <p className="text-[10px] text-slate-500 font-medium">Penilaian</p>
                                <p className="font-semibold text-slate-800">Skor & Pembahasan</p>
                              </div>
                            </div>
                          </div>

                          {/* Bar Progres Pengerjaan */}
                          <div className="mt-4 pt-3 border-t border-[#E6DFD5]">
                            <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600">
                              <span>Progres Paket:</span>
                              <span className="text-[#881337] font-bold">
                                {mtkCompletedCount} dari 5 Selesai ({mtkPercent}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#881337] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(mtkCompletedCount > 0 ? 8 : 0, mtkPercent)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer Action Link */}
                        <div className="relative z-10 mt-5 pt-3.5 border-t border-[#E6DFD5] flex items-center justify-between text-xs sm:text-sm font-bold text-[#881337] group-hover:text-[#700D2B] transition-all">
                          <span className="group-hover:translate-x-1 transition-transform duration-300">
                            Pilih Paket 1 s.d. 5
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] flex items-center justify-center group-hover:translate-x-1.5 group-hover:bg-[#881337] group-hover:text-white transition-all duration-300 shadow-2xs">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAHAP 2: Pilih dari 5 Paket Tryout */}
            {selectedSubject && !activePackage && (
              <div className="space-y-4">
                <div className={`p-3.5 sm:p-4 rounded-xl border-2 shadow-xs ${
                  selectedSubject === 'bahasa_indonesia'
                    ? 'bg-[#ECFDF5]/80 border-[#047857]'
                    : 'bg-[#FFF1F2]/80 border-[#881337]'
                }`}>
                  <h3 className="text-sm sm:text-base font-bold text-[#1E293B]">
                    Pilihan Paket Tryout {PUSMENDIK_TRYOUT[selectedSubject].nama}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Standar TKA SD Nasional: 30 Soal (PG + Isian), Durasi 60 Menit.
                  </p>
                </div>

                {/* Grid 5 Paket Tryout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                  {PUSMENDIK_TRYOUT[selectedSubject].paket.map((pkg) => {
                    const completionKey = `${selectedSubject}_${pkg.nomorPaket}`;
                    const completedInfo = completedTryouts[completionKey];
                    const isCompleted = !!completedInfo;
                    const isMath = selectedSubject === 'matematika';

                    return (
                      <div
                        key={pkg.id || pkg.nomorPaket}
                        className={`p-4 sm:p-5 rounded-2xl bg-white transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${
                          isMath
                            ? 'border-2 border-[#881337] hover:border-[#700D2B]'
                            : 'border-2 border-[#047857] hover:border-[#065F46]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                              isMath
                                ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                                : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                            }`}>
                              {pkg.namaPaket}
                            </span>
                            {isCompleted ? (
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border flex items-center space-x-1 ${
                                isMath
                                  ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                                  : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                              }`}>
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Skor: {completedInfo.score}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>60 Menit</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-slate-800">
                            Simulasi TKA SD
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {pkg.totalSoal || pkg.soal.length} Soal campuran tingkat HOTS, Sedang, Mudah (PG & Isian).
                          </p>
                        </div>

                        <div className={`mt-4 pt-3 border-t space-y-1.5 ${
                          isMath ? 'border-rose-200' : 'border-emerald-200'
                        }`}>
                          {isCompleted ? (
                            <>
                              <button
                                onClick={() => handleOpenReview(pkg, completedInfo)}
                                className={`w-full py-2 rounded-lg text-white font-medium text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                                  isMath
                                    ? 'bg-[#881337] hover:bg-[#700D2B]'
                                    : 'bg-[#047857] hover:bg-[#065F46]'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Review & Pembahasan</span>
                              </button>
                              <button
                                onClick={() => handleStartExam(pkg)}
                                className={`w-full py-1.5 rounded-lg bg-white border font-medium text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer ${
                                  isMath
                                    ? 'hover:bg-rose-50 border-rose-300 text-[#881337]'
                                    : 'hover:bg-emerald-50 border-emerald-300 text-[#047857]'
                                }`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Ulangi Tryout</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleStartExam(pkg)}
                              className={`w-full py-2 rounded-lg text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs ${
                                isMath
                                  ? 'bg-[#881337] hover:bg-[#700D2B]'
                                  : 'bg-[#047857] hover:bg-[#065F46]'
                              }`}
                            >
                              <Sparkles className={`w-3.5 h-3.5 ${isMath ? 'text-rose-200' : 'text-emerald-200'}`} />
                              <span>Mulai Tryout</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAHAP 3: Ruang Ujian Tryout (Timer 60 Menit, PG + Isian Singkat) */}
            {activePackage && isExamRunning && !isFinished && (
              <div className="space-y-4">
                {/* Navigator Kotak Nomor Soal (1 - 30) */}
                {(() => {
                  const checkAnswered = (q, ans) => {
                    if (ans === undefined || ans === null || ans === '') return false;
                    if (q.type === 'mcma') {
                      return Array.isArray(ans) && ans.length > 0;
                    }
                    if (q.type === 'category') {
                      return (
                        typeof ans === 'object' &&
                        Object.keys(ans).length > 0
                      );
                    }
                    return true;
                  };

                  const answeredCount = activePackage.soal.filter((q, idx) =>
                    checkAnswered(q, userAnswers[idx])
                  ).length;
                  const answeredPercent = Math.round(
                    (answeredCount / activePackage.soal.length) * 100
                  );

                  return (
                    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border-2 border-[#C25E38] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#6E6258] font-medium">
                          Lembar Navigasi Soal ({activePackage.soal.length} Soal):
                        </span>
                        <span className="text-[#261C14] font-medium">
                          Terjawab: <strong className="text-[#C25E38]">{answeredCount}</strong> / {activePackage.soal.length}{' '}
                          <span className="text-[#8C7E72]">({answeredPercent}%)</span>
                        </span>
                      </div>

                      {/* Baris Tunggal Navigasi dengan Horizontal Scrollbar yang Jelas */}
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2.5 pt-0.5 exam-nav-scrollbar">
                        {activePackage.soal.map((q, idx) => {
                          const isAnswered = checkAnswered(q, userAnswers[idx]);
                          const isCurrent = currentQuestionIndex === idx;

                          return (
                            <button
                              key={idx}
                              ref={isCurrent ? activeNavBtnRef : null}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-shrink-0 cursor-pointer flex items-center justify-center relative active:scale-95 ${
                                isCurrent
                                  ? 'bg-[#C25E38] text-white font-bold ring-2 ring-[#FAECE6] shadow-sm'
                                  : isAnswered
                                  ? 'bg-[#261C14] text-white'
                                  : 'bg-white text-[#261C14] border border-[#E6DFD5] hover:bg-[#FAECE6] hover:border-[#C25E38]'
                              }`}
                              title={`Soal ${idx + 1} (${isAnswered ? 'Sudah Terjawab' : 'Belum Dijawab'})`}
                            >
                              <span>{idx + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Kartu Soal Sedang Dibuka */}
                {(() => {
                  const currentQ = activePackage.soal[currentQuestionIndex];
                  const currentAnswer = userAnswers[currentQuestionIndex];
                  const qType = currentQ.type || currentQ.tipe || 'mcq';
                  const options = currentQ.options || currentQ.pilihan || [];

                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#C25E38] ring-1 ring-[#C25E38]/20 shadow-xs space-y-4">
                      {/* Header Soal: Nomor, Tipe, & Tingkat Kesulitan */}
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-[#E6DFD5] flex-wrap gap-2">
                        <span className="font-semibold text-[#261C14]">
                          Nomor {currentQuestionIndex + 1} dari {activePackage.soal.length}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium border bg-[#FAECE6] text-[#C25E38] border-[#F4D3C4]">
                            Level: {currentQ.level || 3} ({currentQ.kesulitan})
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium border bg-[#FAECE6] text-[#C25E38] border-[#F4D3C4]">
                            {qType === 'mcma'
                              ? 'PG Kompleks'
                              : qType === 'category'
                              ? 'Benar / Salah'
                              : qType === 'isian'
                              ? 'Isian Singkat'
                              : 'Pilihan Ganda'}
                          </span>
                        </div>
                      </div>

                      {/* Stimulus Bacaan / Konteks (jika ada) */}
                      {currentQ.stimulus && (
                        <div className="p-3.5 rounded-xl border-2 border-l-4 border-[#F4D3C4] border-l-[#C25E38] bg-[#FAECE6]/60 text-[#261C14] text-xs sm:text-sm leading-relaxed space-y-1">
                          <div className="flex items-center space-x-1.5 font-semibold text-xs text-[#C25E38]">
                            <BookOpen className="w-3.5 h-3.5 text-[#C25E38]" />
                            <span>Konteks Bacaan / Stimulus:</span>
                          </div>
                          <div
                            className="text-[#261C14] leading-relaxed font-normal"
                            dangerouslySetInnerHTML={{ __html: formatMath(currentQ.stimulus) }}
                          />
                        </div>
                      )}

                      {/* Teks Pertanyaan */}
                      <div
                        className="text-xs sm:text-sm font-semibold text-[#261C14] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMath(currentQ.question || currentQ.pertanyaan) }}
                      />

                      {/* OPSI JAWABAN */}
                      {/* 1. MCQ (Pilihan Ganda Tunggal) */}
                      {qType === 'mcq' && (
                        <div className="space-y-2 pt-1">
                          {options.map((opt, oIdx) => {
                            const isSelected = currentAnswer === opt || currentAnswer === oIdx;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleAnswerChange(opt)}
                                className={`w-full p-3 sm:p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium border-2 transition-all flex items-center justify-between cursor-pointer min-h-[46px] active:scale-[0.99] ${
                                  isSelected
                                    ? 'bg-[#FAECE6] border-[#C25E38] text-[#261C14] font-semibold ring-2 ring-[#C25E38]/30 shadow-xs'
                                    : 'bg-white border-[#E6DFD5] hover:border-[#C25E38] hover:bg-[#FAECE6]/40 text-[#261C14]'
                                }`}
                              >
                                <span className="pr-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                                <div
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ml-2 transition-colors ${
                                    isSelected
                                      ? 'border-[#C25E38] bg-[#C25E38] text-white shadow-2xs'
                                      : 'border-[#E6DFD5] text-[#6E6258] bg-[#FAF7F2]'
                                  }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. MCMA (Pilihan Ganda Kompleks - Multi select) */}
                      {qType === 'mcma' && (
                        <div className="space-y-2 pt-1">
                          <div className="p-2.5 rounded-lg border-2 border-[#F4D3C4] bg-[#FAECE6] text-[#C25E38] text-xs font-medium flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-[#C25E38] flex-shrink-0" />
                            <span>Pilihan Ganda Kompleks: Anda dapat memilih lebih dari satu jawaban yang benar.</span>
                          </div>
                          {options.map((opt, oIdx) => {
                            const selectedList = Array.isArray(currentAnswer) ? currentAnswer : [];
                            const isSelected = selectedList.includes(opt);
                            return (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  const nextList = isSelected
                                    ? selectedList.filter((x) => x !== opt)
                                    : [...selectedList, opt];
                                  handleAnswerChange(nextList);
                                }}
                                className={`w-full p-3 rounded-xl text-left text-xs sm:text-sm font-medium border-2 transition-colors flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#FAECE6] border-[#C25E38] text-[#261C14] font-semibold ring-2 ring-[#C25E38]/20 shadow-xs'
                                    : 'bg-white border-[#E6DFD5] hover:border-[#C25E38] hover:bg-[#FAECE6]/40 text-[#261C14]'
                                }`}
                              >
                                <span dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                                <div
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-semibold flex-shrink-0 ml-2 transition-colors ${
                                    isSelected
                                      ? 'border-[#C25E38] bg-[#C25E38] text-white'
                                      : 'border-[#E6DFD5] text-[#8C7E72] bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. CATEGORY (Benar / Salah per baris pernyataan) */}
                      {qType === 'category' && (
                        <div className="space-y-2.5 pt-1">
                          <div className="p-2.5 rounded-lg border-2 border-[#F4D3C4] bg-[#FAECE6] text-[#C25E38] text-xs font-medium flex items-center space-x-2">
                            <HelpCircle className="w-4 h-4 text-[#C25E38] flex-shrink-0" />
                            <span>Tentukan apakah setiap pernyataan berikut bernilai <strong>Benar</strong> atau <strong>Salah</strong>.</span>
                          </div>
                          <div className="divide-y divide-[#E6DFD5] border-2 border-[#C25E38] rounded-xl overflow-hidden bg-white">
                            {currentQ.statements?.map((stmt, sIdx) => {
                              const stmtVal =
                                typeof currentAnswer === 'object' && currentAnswer !== null
                                  ? currentAnswer[sIdx]
                                  : undefined;
                              return (
                                <div
                                  key={sIdx}
                                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAF7F2]"
                                >
                                  <span
                                    className="text-xs sm:text-sm text-[#261C14] flex-1 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: formatMath(stmt.text) }}
                                  />
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        const obj =
                                          typeof currentAnswer === 'object' && currentAnswer !== null
                                            ? currentAnswer
                                            : {};
                                        handleAnswerChange({ ...obj, [sIdx]: true });
                                      }}
                                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                                        stmtVal === true
                                          ? 'bg-[#C25E38] border-[#C25E38] text-white'
                                          : 'bg-white hover:bg-[#FAECE6] text-[#C25E38] border-[#F4D3C4]'
                                      }`}
                                    >
                                      Benar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const obj =
                                          typeof currentAnswer === 'object' && currentAnswer !== null
                                            ? currentAnswer
                                            : {};
                                        handleAnswerChange({ ...obj, [sIdx]: false });
                                      }}
                                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                                        stmtVal === false
                                          ? 'bg-[#C93B3B] border-[#C93B3B] text-white'
                                          : 'bg-white hover:bg-[#FAF7F2] text-[#6E6258] border-[#E6DFD5]'
                                      }`}
                                    >
                                      Salah
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 4. ISIAN SINGKAT */}
                      {qType === 'isian' && (
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-medium text-[#261C14]">
                            Ketik jawaban singkat Anda di bawah ini:
                          </label>
                          <input
                            type="text"
                            value={currentAnswer || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Ketik jawabanmu di sini..."
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white border-2 border-[#F4D3C4] focus:border-[#C25E38] focus:ring-2 focus:ring-[#C25E38]/20 text-[#261C14] text-xs sm:text-sm focus:outline-hidden transition-colors"
                          />
                        </div>
                      )}

                      {/* Navigasi Bawah */}
                      <div className="mt-5 pt-3.5 border-t border-[#E6DFD5] flex items-center justify-between gap-2">
                        <button
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center justify-center border-2 ${
                            currentQuestionIndex === 0
                              ? 'text-[#8C7E72] bg-[#FAF7F2] cursor-not-allowed border-[#E6DFD5]'
                              : 'text-[#C25E38] hover:bg-[#FAECE6] hover:border-[#C25E38] bg-white border-[#F4D3C4] cursor-pointer shadow-xs'
                          }`}
                        >
                          &larr; <span className="hidden xs:inline ml-1">Sebelumnya</span>
                        </button>

                        <div className="flex items-center space-x-2">
                          {currentQuestionIndex < activePackage.soal.length - 1 ? (
                            <button
                              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                              className="px-4 sm:px-5 py-2 sm:py-2.5 min-h-[42px] rounded-xl text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center bg-[#C25E38] hover:bg-[#A94D2B]"
                            >
                              <span>Selanjutnya</span> <span className="ml-1">&rarr;</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const answered = activePackage.soal.filter((q, idx) =>
                                  isTryoutQuestionAnswered(q, userAnswers[idx])
                                ).length;
                                const unanswered = activePackage.soal.length - answered;

                                if (unanswered > 0) {
                                  if (
                                    window.confirm(
                                      `Perhatian: Masih ada ${unanswered} soal yang belum kamu jawab!\n\nSesuai sistem kenaikan level, jika kamu TIDAK MENJAWAB SEMUA SOAL (${activePackage.soal.length}/${activePackage.soal.length}), kamu TIDAK AKAN MENDAPATKAN EXP.\n\nApakah kamu tetap ingin mengumpulkan lembar ujian sekarang?`
                                    )
                                  ) {
                                    handleFinishExam();
                                  }
                                } else {
                                  if (
                                    window.confirm(
                                      'Hebat! Seluruh soal telah terjawab. Apakah Anda yakin ingin mengumpulkan lembar jawaban Tryout sekarang?'
                                    )
                                  ) {
                                    handleFinishExam();
                                  }
                                }
                              }}
                              className="px-4 py-2 min-h-[42px] rounded-xl text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center bg-[#C25E38] hover:bg-[#A94D2B]"
                            >
                              Kumpulkan Ujian
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAHAP 4: Hasil Skor Tryout di Akhir */}
            {activePackage && isFinished && !isReviewMode && (() => {
              return (
                <div className="max-w-md mx-auto py-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border-2 bg-[#FAECE6] border-[#F4D3C4] text-[#C25E38]">
                    <Trophy className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#C25E38]">
                      Hasil Tryout Nasional
                    </span>
                    <h3 className="text-xl font-bold text-[#261C14] mt-0.5">
                      Skor {activePackage.namaPaket}
                    </h3>
                  </div>

                  {/* Skor Card */}
                  <div className="p-6 rounded-2xl bg-[#FAF7F2] border-2 border-[#C25E38] shadow-xs space-y-3">
                    <div className="text-3xl font-extrabold text-[#261C14]">
                      {scoreResult?.score}
                      <span className="text-xs text-[#6E6258] font-normal"> / 100</span>
                    </div>

                    {/* Status EXP Sesuai Kelengkapan Soal */}
                    <div className="pt-0.5">
                      {scoreResult?.isCompletedAll ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E8F2EF] text-[#286657] border border-[#BCD9D0] text-xs font-bold shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-[#286657]" />
                          <span>+{scoreResult?.expEarned} EXP Didapatkan! (Semua Soal Terjawab)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FDF1F1] text-[#C93B3B] border border-[#F4C7C7] text-xs font-medium">
                          <span>0 EXP (EXP hanya didapat jika menjawab semua {scoreResult?.totalCount} soal)</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#E6DFD5] text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-[#E6DFD5] text-[#286657]">
                        <span className="block font-bold text-base text-[#286657]">
                          {scoreResult?.correctCount} / {scoreResult?.totalCount}
                        </span>
                        <span className="text-[#6E6258]">Jawaban Benar</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white border border-[#E6DFD5] text-[#261C14]">
                        <span className="block font-bold text-base text-[#261C14]">
                          {Math.round((scoreResult?.timeSpentSeconds || 0) / 60)} Menit
                        </span>
                        <span className="text-[#6E6258]">Waktu Pengerjaan</span>
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => setIsReviewMode(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm bg-[#C25E38] hover:bg-[#A94D2B]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lihat Review & Pembahasan</span>
                    </button>

                    <button
                      onClick={() => handleStartExam(activePackage)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Ulangi Tryout</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* TAHAP 5: Review Lengkap 30 Soal dengan Pembahasan */}
            {activePackage && isFinished && isReviewMode && (
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                  <div>
                    <h3 className="text-base font-semibold text-[#261C14]">
                      Pembahasan 30 Soal {activePackage.namaPaket}
                    </h3>
                    <p className="text-xs text-[#6E6258]">
                      Simak solusi langkah demi langkah untuk setiap nomor soal.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReviewMode(false)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-medium text-[#261C14] transition-colors cursor-pointer"
                  >
                    Kembali ke Skor
                  </button>
                </div>

                <div className="space-y-4">
                  {activePackage.soal.map((q, idx) => {
                    const userVal = userAnswers[idx];
                    const qType = q.type || q.tipe || 'mcq';
                    const { isCorrect } = evaluateQuestionResult(q, userVal);
                    const options = q.options || q.pilihan || [];

                    return (
                      <div
                        key={q.id || idx}
                        className={`p-4 rounded-lg border bg-white ${
                          isCorrect ? 'border-[#C5DDD6]' : 'border-[#F4C7C7]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#261C14] text-white">
                              Soal #{idx + 1}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-[#FAF7F2] text-[#6E6258] border border-[#E6DFD5] font-medium">
                              {q.kesulitan} • {qType === 'mcma' ? 'PG Kompleks' : qType === 'category' ? 'Benar / Salah' : qType === 'isian' ? 'Isian' : 'PG'}
                            </span>
                          </div>

                          {isCorrect ? (
                            <span className="inline-flex items-center space-x-1 text-xs font-medium text-[#286657] bg-[#E8F2EF] px-2 py-0.5 rounded border border-[#C5DDD6]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#286657]" />
                              <span>Benar</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-xs font-medium text-[#C93B3B] bg-[#FDF1F1] px-2 py-0.5 rounded border border-[#F4C7C7]">
                              <XCircle className="w-3.5 h-3.5 text-[#C93B3B]" />
                              <span>Salah</span>
                            </span>
                          )}
                        </div>

                        {/* Stimulus jika ada */}
                        {q.stimulus && (
                          <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs text-[#261C14] mb-3 leading-relaxed">
                            <strong className="text-[#261C14] block text-xs mb-1 font-semibold">Konteks Bacaan / Stimulus:</strong>
                            <div dangerouslySetInnerHTML={{ __html: formatMath(q.stimulus) }} />
                          </div>
                        )}

                        <h4
                          className="text-xs sm:text-sm font-semibold text-[#261C14] mb-3 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMath(q.question || q.pertanyaan) }}
                        />

                        {/* List Opsi Jawaban Lengkap dengan badge A, B, C, D (untuk MCQ & MCMA) */}
                        {(qType === 'mcq' || qType === 'mcma') && options.length > 0 && (
                          <div className="space-y-1.5 mb-3 pt-1">
                            <span className="text-[11px] font-semibold text-[#6E6258] uppercase tracking-wider block">
                              Pilihan Jawaban:
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
                              {options.map((opt, oIdx) => {
                                const letter = getOptionLetter(oIdx);
                                const isKey =
                                  qType === 'mcq'
                                    ? oIdx === findOptionIndex(options, q.answer !== undefined ? q.answer : q.jawabanBenar)
                                    : Array.isArray(q.answer) &&
                                      q.answer.some((a) => String(a).trim().toLowerCase() === String(opt).trim().toLowerCase());

                                const isUserChoice =
                                  qType === 'mcq'
                                    ? oIdx === findOptionIndex(options, userVal)
                                    : Array.isArray(userVal) &&
                                      userVal.some((u) => String(u).trim().toLowerCase() === String(opt).trim().toLowerCase());

                                let containerClass = 'bg-white border-[#E6DFD5] text-[#261C14]';
                                let badgeClass = 'bg-[#FAF7F2] text-[#6E6258] border-[#E6DFD5]';
                                let statusTag = null;

                                if (isKey && isUserChoice) {
                                  containerClass = 'bg-[#E8F2EF] border-[#C5DDD6] text-[#286657] font-medium';
                                  badgeClass = 'bg-[#286657] text-white border-[#286657]';
                                  statusTag = (
                                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#286657] bg-[#E8F2EF] border border-[#C5DDD6] px-2 py-0.5 rounded">
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span>Pilihan Anda (Benar)</span>
                                    </span>
                                  );
                                } else if (isKey && !isUserChoice) {
                                  containerClass = 'bg-[#E8F2EF]/70 border-[#C5DDD6] text-[#286657] font-medium';
                                  badgeClass = 'bg-[#286657] text-white border-[#286657]';
                                  statusTag = (
                                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#286657] bg-[#E8F2EF] border border-[#C5DDD6] px-2 py-0.5 rounded">
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                      <span>Kunci Jawaban</span>
                                    </span>
                                  );
                                } else if (!isKey && isUserChoice) {
                                  containerClass = 'bg-[#FDF1F1] border-[#F4C7C7] text-[#C93B3B]';
                                  badgeClass = 'bg-[#C93B3B] text-white border-[#C93B3B]';
                                  statusTag = (
                                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#C93B3B] bg-[#FDF1F1] border border-[#F4C7C7] px-2 py-0.5 rounded">
                                      <X className="w-3 h-3 stroke-[2.5]" />
                                      <span>Pilihan Anda (Salah)</span>
                                    </span>
                                  );
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs sm:text-sm transition-colors ${containerClass}`}
                                  >
                                    <div className="flex items-center space-x-2.5 flex-1 pr-2">
                                      <span
                                        className={`w-5 h-5 rounded-md border font-semibold text-xs flex items-center justify-center flex-shrink-0 ${badgeClass}`}
                                      >
                                        {letter}
                                      </span>
                                      <span dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                                    </div>
                                    {statusTag && <div className="flex-shrink-0 ml-2">{statusTag}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Info Jawaban Siswa & Kunci */}
                        <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs space-y-1.5 mb-2.5">
                          {qType === 'category' ? (
                            <div className="space-y-1.5">
                              <span className="text-[#6E6258] font-semibold block uppercase tracking-wider text-[11px]">
                                Rincian Pernyataan (Benar / Salah):
                              </span>
                              {q.statements?.map((stmt, sIdx) => {
                                const uPick =
                                  typeof userVal === 'object' && userVal !== null
                                    ? userVal[sIdx]
                                    : undefined;
                                const isStmtCorrect = uPick === stmt.answer;
                                return (
                                  <div
                                    key={sIdx}
                                    className="flex items-center justify-between text-[11px] py-1 border-b border-[#E6DFD5] last:border-0 flex-wrap gap-2"
                                  >
                                    <span
                                      className="flex-1 pr-2 leading-relaxed text-[#261C14]"
                                      dangerouslySetInnerHTML={{ __html: formatMath(stmt.text) }}
                                    />
                                    <span className="font-medium flex-shrink-0">
                                      Anda:{' '}
                                      <strong className={isStmtCorrect ? 'text-[#286657]' : 'text-[#C93B3B]'}>
                                        {uPick === true
                                          ? 'Benar'
                                          : uPick === false
                                          ? 'Salah'
                                          : '(Belum dijawab)'}
                                      </strong>{' '}
                                      | Kunci:{' '}
                                      <strong className="text-[#286657]">
                                        {stmt.answer ? 'Benar' : 'Salah'}
                                      </strong>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="text-[#6E6258] font-medium">Jawaban Anda:</span>
                                <strong
                                  className={`inline-flex items-center space-x-1 ${
                                    isCorrect ? 'text-[#286657]' : 'text-[#C93B3B]'
                                  }`}
                                >
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: formatMath(getDisplayUserAnswer(q, userVal)),
                                    }}
                                  />
                                </strong>
                              </div>
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="text-[#6E6258] font-medium">Kunci Jawaban:</span>
                                <strong className="text-[#286657] inline-flex items-center space-x-1">
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: formatMath(getDisplayKeyAnswer(q)),
                                    }}
                                  />
                                </strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Indikator Pusmendik */}
                        {q.indicator && (
                          <div className="p-2 rounded-lg bg-[#FAECE6] border border-[#F4D3C4] text-xs text-[#C25E38] mb-2">
                            <strong>Indikator: </strong>
                            <span>{q.indicator}</span>
                          </div>
                        )}

                        {/* Pembahasan */}
                        {(q.explanation || q.pembahasan) && (
                          <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs">
                            <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-[#E6DFD5] flex-wrap gap-2">
                              <strong className="text-[#261C14] flex items-center space-x-1.5 font-semibold">
                                <HelpCircle className="w-3.5 h-3.5 text-[#C25E38]" />
                                <span>Pembahasan:</span>
                              </strong>
                              {(qType === 'mcq' || qType === 'mcma') && (
                                <span className="px-2 py-0.5 rounded bg-[#E8F2EF] border border-[#C5DDD6] text-[#286657] font-semibold text-xs flex items-center space-x-1">
                                  <span>Kunci:</span>
                                  <span
                                    className="ml-1"
                                    dangerouslySetInnerHTML={{
                                      __html: formatMath(getDisplayKeyAnswer(q)),
                                    }}
                                  />
                                </span>
                              )}
                            </div>
                            <div
                              className="text-[#6E6258] leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatMath(q.explanation || q.pembahasan) }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tryout;
