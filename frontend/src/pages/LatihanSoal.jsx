import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { PUSMENDIK_LATIHAN } from '../data/latihanData';
import {
  getActivityData,
  markLatihanComplete,
  unlockLatihan,
  resetLatihanProgress,
  recordLatihan,
} from '../utils/activityTracker';
import { getCharacterAvatar } from '../utils/characterAvatars';
import { formatMath } from '../utils/mathRenderer';
import {
  BookOpen,
  Calculator,
  ArrowLeft,
  CheckCircle2,
  Check,
  Lock,
  Unlock,
  HelpCircle,
  ChevronRight,
  Trophy,
  LayoutDashboard,
  Search,
  X,
  Sparkles,
  Zap,
  Star,
  Gift,
  RotateCcw,
  MapPin,
  List,
  Eye,
  XCircle,
  Award,
} from 'lucide-react';

/**
 * Halaman Penuh Modul Latihan Soal Pembelajaran TKA SD
 * 
 * Fitur:
 * 1. Pilihan Mata Pelajaran: Bahasa Indonesia (10 Latihan) & Matematika (10 Latihan).
 * 2. Tampilan dan mekanisme identik dengan Halaman Materi:
 *    - Menggunakan penamaan "Latihan 1", "Latihan 2", dst. (bukan "Materi 1").
 *    - Sistem Latihan Berjenjang (Latihan 1..10 untuk MTK dan BI).
 *    - Posisi awal: Hanya Latihan 1 yang terbuka, latihan berikutnya terkunci.
 *    - Syarat membuka latihan: Menuntaskan latihan sebelumnya.
 *    - Fitur Tantangan Lompat Latihan: Langsung melompat ke latihan terkunci dengan menjawab kuis tantangan.
 *    - Desain Peta Petualangan Berliku (Duolingo-style Winding Path), Milestone Peti Bonus, dan Piala Puncak.
 *    - Tampilan Mode Peta & Mode Daftar Grid.
 */

// Konfigurasi Lengkap Dua Mata Pelajaran untuk Latihan Soal
const SUBJECTS_CONFIG = {
  bahasa_indonesia: {
    key: 'bahasa_indonesia',
    title: 'Bahasa Indonesia',
    tagline: '10 Tingkat Latihan Soal Standar Pusmendik',
    deskripsi: 'Fondasi kosakata, kalimat efektif, struktur paragraf, teks fiksi, hingga penalaran HOTS literasi.',
    icon: BookOpen,
    totalLevels: 10,
    levels: PUSMENDIK_LATIHAN.bahasa_indonesia.levels.map((lvl) => ({
      ...lvl,
      id: `bi_lat_${lvl.level}`,
      no: lvl.level,
    })),
    theme: {
      gradient: 'from-slate-900 to-slate-900',
      border: 'border-[#33261D]',
      badgeBg: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
      activeRing: 'ring-[#047857]/20',
      activeBtn: 'from-[#047857] to-[#047857] border-[#065F46]',
      pillCompleted: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
      pillActive: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
    },
    milestones: {
      4: {
        title: 'Peti Bintang Fondasi Literasi',
        requiredLevel: 4,
        desc: 'Pencapaian menuntaskan 4 Latihan Pertama Bahasa Indonesia.',
        reward: '🎁 Foto Profil: Sapi Sahabat',
        avatarIds: ['cow'],
      },
      7: {
        title: 'Peti Perak Analisis & Makna Bahasa',
        requiredLevel: 7,
        desc: 'Pencapaian menuntaskan 7 Latihan Bahasa Indonesia.',
        reward: '🎁 Foto Profil: Beruang Manis',
        avatarIds: ['teddy-bear-heart'],
      },
      10: {
        title: 'Piala Maestro Bahasa Indonesia TKA SD',
        requiredLevel: 10,
        desc: 'Piala kebanggaan tertinggi setelah menuntaskan seluruh 10 Tingkat Latihan Soal Bahasa Indonesia Kemendikdasmen RI.',
        reward: '👑 Foto Profil: Panda Lucu',
        avatarIds: ['panda'],
      },
    },
  },
  matematika: {
    key: 'matematika',
    title: 'Matematika',
    tagline: '10 Tingkat Latihan Soal Standar Pusmendik',
    deskripsi: 'Operasi hitung campuran, pecahan, KPK/FPB, bangun datar/ruang, pengukuran, dan penalaran data.',
    icon: Calculator,
    totalLevels: 10,
    levels: PUSMENDIK_LATIHAN.matematika.levels.map((lvl) => ({
      ...lvl,
      id: `mtk_lat_${lvl.level}`,
      no: lvl.level,
    })),
    theme: {
      gradient: 'from-slate-900 to-slate-900',
      border: 'border-[#33261D]',
      badgeBg: 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]',
      activeRing: 'ring-[#881337]/20',
      activeBtn: 'from-[#881337] to-[#881337] border-[#700D2B]',
      pillCompleted: 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337]',
      pillActive: 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337]',
    },
    milestones: {
      4: {
        title: 'Peti Bintang Fondasi Numerasi',
        requiredLevel: 4,
        desc: 'Pencapaian menuntaskan 4 Latihan Pertama Matematika.',
        reward: '🎁 Foto Profil: Ksatria Tangguh',
        avatarIds: ['knight'],
      },
      7: {
        title: 'Peti Perak Logika & Geometri',
        requiredLevel: 7,
        desc: 'Pencapaian menuntaskan 7 Latihan Matematika.',
        reward: '🎁 Foto Profil: Ninja Gesit',
        avatarIds: ['ninja'],
      },
      10: {
        title: 'Piala Maestro Matematika TKA SD',
        requiredLevel: 10,
        desc: 'Piala kebanggaan tertinggi setelah menuntaskan seluruh 10 Tingkat Latihan Soal Matematika Kemendikdasmen RI.',
        reward: '👑 Foto Profil: Koboi Cilik',
        avatarIds: ['cowboy'],
      },
    },
  },
};

// Fungsi dinamis untuk menghitung offset winding path S-Curve
const getPathOffset = (index) => {
  const cycle = index % 8;
  switch (cycle) {
    case 0:
      return 'translate-x-0';
    case 1:
      return 'translate-x-6 sm:translate-x-14 md:translate-x-20';
    case 2:
      return 'translate-x-12 sm:translate-x-24 md:translate-x-32';
    case 3:
      return 'translate-x-6 sm:translate-x-12 md:translate-x-16';
    case 4:
      return 'translate-x-0';
    case 5:
      return '-translate-x-6 sm:-translate-x-12 md:-translate-x-16';
    case 6:
      return '-translate-x-12 sm:-translate-x-24 md:-translate-x-32';
    case 7:
      return '-translate-x-6 sm:-translate-x-14 md:-translate-x-20';
    default:
      return 'translate-x-0';
  }
};

const LatihanSoal = () => {
  const navigate = useNavigate();

  // Mata Pelajaran Terpilih ('bahasa_indonesia' | 'matematika' | null)
  const [selectedSubject, setSelectedSubject] = useState(null);

  // State Aktivitas Pengguna (Tersimpan di localStorage)
  const [activity, setActivity] = useState(() => getActivityData());
  const completedLatihanIds = activity?.latihanCompleted || [];
  const unlockedLatihanIds = activity?.unlockedLatihan || ['mtk_lat_1', 'bi_lat_1'];
  const latihanStars = activity?.latihanStars || {};

  // Helper dapatkan jumlah bintang yang diraih pada latihan tertentu
  const getLevelStars = (lvlId) => {
    if (latihanStars && latihanStars[lvlId] !== undefined) {
      return latihanStars[lvlId];
    }
    if (completedLatihanIds.includes(lvlId)) {
      return 3;
    }
    return 0;
  };

  // State Navigasi & Modal
  const [activeLatihan, setActiveLatihan] = useState(null); // Sedang mengerjakan latihan soal
  const [selectedLevelModal, setSelectedLevelModal] = useState(null); // Latihan yang dipilih untuk melihat info/aksi
  const [viewMode, setViewMode] = useState('roadmap'); // 'roadmap' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(null);

  // State Saat Mengerjakan Soal Latihan Penuh
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: answerValue }
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'wrong' | 'correct'
  const [latestScoreResult, setLatestScoreResult] = useState(null);

  // State Mode Tantangan Lompat Latihan (Jump Challenge)
  const [jumpChallengeLevel, setJumpChallengeLevel] = useState(null);
  const [jumpQuizIndex, setJumpQuizIndex] = useState(0);
  const [jumpSelectedAnswer, setJumpSelectedAnswer] = useState(null);
  const [jumpHasSubmitted, setJumpHasSubmitted] = useState(false);
  const [jumpIsCorrect, setJumpIsCorrect] = useState(false);
  const [showJumpHint, setShowJumpHint] = useState(false);
  const [jumpFinished, setJumpFinished] = useState(false);

  // State Transisi Anti-Spam
  const isJumpTransitioningRef = useRef(false);
  const [isJumpTransitioning, setIsJumpTransitioning] = useState(false);

  // Refresh data aktivitas saat ada perubahan
  const refreshActivity = () => {
    setActivity(getActivityData());
  };

  // Helper Cek Status Latihan
  const isLevelCompleted = (lvlId) => completedLatihanIds.includes(lvlId);

  const isLevelUnlocked = (index, lvl, levelsList) => {
    // Latihan 1 selalu terbuka
    if (index === 0) return true;
    // Terbuka jika sudah selesai
    if (completedLatihanIds.includes(lvl.id)) return true;
    // Terbuka jika sudah di-unlock via tantangan
    if (unlockedLatihanIds.includes(lvl.id)) return true;
    // Terbuka jika latihan sebelumnya sudah tuntas dikerjakan
    const prevLvl = levelsList[index - 1];
    if (prevLvl && completedLatihanIds.includes(prevLvl.id)) return true;

    return false;
  };

  // Data mapel aktif
  const currentSubject = selectedSubject ? SUBJECTS_CONFIG[selectedSubject] : null;
  const currentLevels = currentSubject ? currentSubject.levels : [];

  // Menentukan index latihan yang sedang aktif sekarang di mapel aktif
  const currentActiveLevelIndex = currentLevels.findIndex(
    (lvl, idx) => isLevelUnlocked(idx, lvl, currentLevels) && !isLevelCompleted(lvl.id)
  );

  // Helper verifikasi jawaban detail (MCQ, MCMA, Category) dengan skor proporsional
  const evaluateQuestion = (q, userAns) => {
    if (userAns === undefined || userAns === null) {
      return { isCorrect: false, score: 0 };
    }
    const qType = q.type || 'mcq';

    // 1. Pilihan Ganda Tunggal (MCQ)
    if (qType === 'mcq') {
      let isCorrect = false;
      if (typeof q.jawabanBenar === 'string') {
        isCorrect = String(userAns).trim() === String(q.jawabanBenar).trim();
      } else if (typeof q.jawabanBenar === 'number') {
        isCorrect =
          userAns === q.jawabanBenar ||
          String(userAns).trim() === String(q.pilihan?.[q.jawabanBenar]).trim();
      }
      return { isCorrect, score: isCorrect ? 1 : 0 };
    }

    // 2. Pilihan Ganda Kompleks (MCMA)
    if (qType === 'mcma') {
      if (!Array.isArray(userAns) || !Array.isArray(q.jawabanBenar) || q.jawabanBenar.length === 0) {
        return { isCorrect: false, score: 0 };
      }
      const correctKeys = q.jawabanBenar;
      const correctSelected = userAns.filter((ans) => correctKeys.includes(ans)).length;
      const wrongSelected = userAns.filter((ans) => !correctKeys.includes(ans)).length;
      const isCorrect = correctSelected === correctKeys.length && wrongSelected === 0;
      // Skor proporsional jika ada pilihan yang benar
      const earnedRatio = Math.max(0, (correctSelected - wrongSelected * 0.5) / correctKeys.length);
      return { isCorrect, score: Math.min(1, Math.max(0, earnedRatio)) };
    }

    // 3. Pernyataan Benar / Salah (Category)
    if (qType === 'category') {
      if (typeof userAns !== 'object' || userAns === null || !q.statements || q.statements.length === 0) {
        return { isCorrect: false, score: 0 };
      }
      let correctStmts = 0;
      q.statements.forEach((stmt, sIdx) => {
        if (userAns[sIdx] === stmt.answer) {
          correctStmts++;
        }
      });
      const isCorrect = correctStmts === q.statements.length;
      const score = correctStmts / q.statements.length;
      return { isCorrect, score };
    }

    return { isCorrect: false, score: 0 };
  };

  const isQuestionCorrect = (q, userAns) => evaluateQuestion(q, userAns).isCorrect;

  // Cek apakah suatu butir soal sudah dijawab oleh pengguna
  const isQuestionAnswered = (q, ans) => {
    if (ans === undefined || ans === null) return false;
    const qType = q?.type || 'mcq';
    if (qType === 'mcq') return String(ans).trim() !== '';
    if (qType === 'mcma') return Array.isArray(ans) && ans.length > 0;
    if (qType === 'category') {
      if (typeof ans !== 'object' || ans === null) return false;
      if (Array.isArray(q.statements) && q.statements.length > 0) {
        return q.statements.every((_, sIdx) => ans[sIdx] !== undefined);
      }
      return Object.keys(ans).length > 0;
    }
    if (qType === 'isian') return typeof ans === 'string' && ans.trim().length > 0;
    return true;
  };

  // Buka dan Mulai Pengerjaan Latihan Normal
  const handleStartLatihan = (lvl) => {
    setSelectedLevelModal(null);
    setActiveLatihan(lvl);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsFinished(false);
    setIsReviewMode(false);
    setLatestScoreResult(null);
  };

  // Pilih/Ubah jawaban latihan
  const handleAnswerChange = (val) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: val,
    }));
  };

  // Selesai & Hitung Nilai Latihan
  const handleFinishQuiz = () => {
    const questions = activeLatihan.soal;
    let totalScorePoints = 0;
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const evaluation = evaluateQuestion(q, userAnswers[idx]);
      totalScorePoints += evaluation.score;
      if (evaluation.isCorrect || evaluation.score >= 0.7) {
        correctCount++;
      }
    });

    const isCompletedAll = questions.every((q, idx) => isQuestionAnswered(q, userAnswers[idx]));
    const answeredCount = questions.filter((q, idx) => isQuestionAnswered(q, userAnswers[idx])).length;

    // Hitung persentase skor akhir (0 - 100)
    const score = Math.round((totalScorePoints / questions.length) * 100);

    // Hitung perolehan bintang:
    // >= 80%: 3 bintang (⭐⭐⭐ Sempurna!)
    // >= 50%: 2 bintang (⭐⭐☆ Hebat!)
    // > 0% atau ada jawaban benar: 1 bintang (⭐☆☆ Bagus!)
    let starsEarned = 0;
    if (score >= 80) {
      starsEarned = 3;
    } else if (score >= 50) {
      starsEarned = 2;
    } else if (score > 0 || totalScorePoints > 0) {
      starsEarned = 1;
    }

    // EXP HANYA DIBERIKAN JIKA MENYELESAIKAN SEMUA SOAL LATIHAN
    // DAN HANYA JIKA LATIHAN INI BELUM PERNAH DISELESAIKAN SEBELUMNYA (mencegah farming EXP saat kerjakan ulang latihan)
    const actData = getActivityData();
    const isAlreadyCompleted = (actData.latihanCompleted || []).includes(activeLatihan.id);
    const expEarned = (isCompletedAll && !isAlreadyCompleted) ? (80 + starsEarned * 15) : 0;

    const result = {
      score,
      correctCount,
      totalCount: questions.length,
      wrongCount: questions.length - correctCount,
      starsEarned,
      isCompletedAll,
      answeredCount,
      expEarned,
      isReplay: isAlreadyCompleted,
    };

    setLatestScoreResult(result);
    setIsFinished(true);

    // Rekam aktivitas ke tracker untuk riwayat latihan (EXP hanya diberikan jika isCompletedAll === true)
    recordLatihan({
      subject: selectedSubject,
      level: `Latihan ${activeLatihan.level}`,
      score,
      correct: correctCount,
      total: questions.length,
      isCompletedAll,
      expEarned,
    });

    // Tandai tuntas & berikan bintang jika ada yang benar (minimal 1 bintang) dan semua soal dijawab
    if (starsEarned >= 1 && isCompletedAll) {
      markLatihanComplete(activeLatihan.id, starsEarned, false); // false = jangan tambah EXP dobel karena sudah tercatat di recordLatihan

      // Otomatis buka latihan berikutnya jika ada
      const currentIndex = currentLevels.findIndex((l) => l.id === activeLatihan.id);
      if (currentIndex !== -1 && currentIndex < currentLevels.length - 1) {
        unlockLatihan(currentLevels[currentIndex + 1].id);
      }
    }

    refreshActivity();
  };

  // Mulai Tantangan Lompat Latihan
  const handleStartJumpChallenge = (lvl) => {
    setSelectedLevelModal(null);
    setJumpChallengeLevel(lvl);
    setJumpQuizIndex(0);
    setJumpSelectedAnswer(null);
    setJumpHasSubmitted(false);
    setJumpIsCorrect(false);
    setShowJumpHint(false);
    setJumpFinished(false);
    isJumpTransitioningRef.current = false;
    setIsJumpTransitioning(false);
  };

  // Dapatkan soal tantangan dari level (utamakan pilihan ganda sederhana)
  const getJumpQuestions = (lvl) => {
    if (!lvl || !lvl.soal || lvl.soal.length === 0) return [];
    const mcqs = lvl.soal.filter((q) => !q.type || q.type === 'mcq');
    return mcqs.length > 0 ? mcqs.slice(0, 2) : lvl.soal.slice(0, 1);
  };

  // Submit Jawaban Tantangan Lompat Latihan
  const handleCheckJumpAnswer = () => {
    if (isJumpTransitioningRef.current || (jumpHasSubmitted && jumpIsCorrect)) return;
    if (jumpSelectedAnswer === null) return;

    const challengeList = getJumpQuestions(jumpChallengeLevel);
    const currentQ = challengeList[jumpQuizIndex];
    const correct = isQuestionCorrect(currentQ, jumpSelectedAnswer);

    setJumpHasSubmitted(true);
    setJumpIsCorrect(correct);

    if (!correct) {
      setShowJumpHint(true);
    } else {
      isJumpTransitioningRef.current = true;
      setIsJumpTransitioning(true);
      setShowJumpHint(false);

      if (jumpQuizIndex < challengeList.length - 1) {
        setTimeout(() => {
          setJumpQuizIndex((prev) => prev + 1);
          setJumpSelectedAnswer(null);
          setJumpHasSubmitted(false);
          setJumpIsCorrect(false);
          setShowJumpHint(false);
          isJumpTransitioningRef.current = false;
          setIsJumpTransitioning(false);
        }, 1100);
      } else {
        // Berhasil menyelesaikan tantangan lompat latihan!
        setJumpFinished(true);
        unlockLatihan(jumpChallengeLevel.id);
        refreshActivity();
        isJumpTransitioningRef.current = false;
        setIsJumpTransitioning(false);
      }
    }
  };

  // Coba lagi pada tantangan lompat latihan
  const handleRetryJumpQuestion = () => {
    if (isJumpTransitioningRef.current) return;
    setJumpSelectedAnswer(null);
    setJumpHasSubmitted(false);
    setJumpIsCorrect(false);
  };

  // Reset Progres Latihan
  const handleResetProgress = () => {
    resetLatihanProgress(selectedSubject);
    refreshActivity();
    setShowResetConfirm(false);
    setSelectedLevelModal(null);
  };

  // Hitung jumlah tuntas mapel aktif
  const completedCount = currentLevels.filter((l) => isLevelCompleted(l.id)).length;
  const progressPercent = currentLevels.length
    ? Math.round((completedCount / currentLevels.length) * 100)
    : 0;

  // Filter pencarian
  const filteredLevels = currentLevels.filter((lvl) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      `latihan ${lvl.level}`.includes(q) ||
      lvl.subjudul?.toLowerCase().includes(q) ||
      lvl.deskripsi?.toLowerCase().includes(q) ||
      lvl.namaLevel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-800 pb-12">
      {/* 1. Navbar Utama */}
      <Navbar />

      {/* 2. Konten Utama */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col animate-fade-in">
        {/* Navigasi Breadcrumb */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-blue-200 flex-wrap">
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:text-white font-medium flex items-center space-x-1 transition-colors text-blue-200"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span className="text-blue-300/50">/</span>
            <button
              onClick={() => {
                setActiveLatihan(null);
                setJumpChallengeLevel(null);
                setSelectedSubject(null);
              }}
              className={`font-medium hover:text-white transition-colors ${
                !selectedSubject ? 'text-white font-bold' : 'text-blue-200'
              }`}
            >
              Bank Latihan Soal
            </button>
            {selectedSubject && (
              <>
                <span className="text-blue-300/50">/</span>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      activeLatihan &&
                      !isFinished &&
                      Object.keys(userAnswers).length > 0 &&
                      !window.confirm('Yakin ingin kembali ke peta latihan? Jawaban latihan ini belum disimpan.')
                    ) {
                      return;
                    }
                    setActiveLatihan(null);
                    setJumpChallengeLevel(null);
                    setSearchQuery('');
                    refreshActivity();
                  }}
                  className={`font-medium hover:text-white transition-colors cursor-pointer ${
                    !activeLatihan ? 'text-white font-bold' : 'text-blue-200'
                  }`}
                >
                  {currentSubject?.title}
                </button>
              </>
            )}
            {activeLatihan && (
              <>
                <span className="text-blue-300/50">/</span>
                <span className="text-amber-300 font-medium truncate max-w-[150px] sm:max-w-xs">
                  Latihan {activeLatihan.level}: {activeLatihan.subjudul}
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => {
              if (activeLatihan || jumpChallengeLevel) {
                if (
                  activeLatihan &&
                  !isFinished &&
                  Object.keys(userAnswers).length > 0 &&
                  !window.confirm('Yakin ingin kembali ke peta latihan? Jawaban latihan ini belum disimpan.')
                ) {
                  return;
                }
                setActiveLatihan(null);
                setJumpChallengeLevel(null);
                refreshActivity();
              } else if (selectedSubject) {
                setSelectedSubject(null);
              } else {
                navigate('/dashboard');
              }
            }}
            className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 hover:text-blue-700 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {activeLatihan || jumpChallengeLevel
                ? 'Kembali ke Peta Latihan'
                : selectedSubject
                ? 'Ganti Mata Pelajaran'
                : 'Dashboard'}
            </span>
          </button>
        </div>

        {/* --- TAHAP 1: PILIHAN MATA PELAJARAN (BAHASA INDONESIA & MATEMATIKA) --- */}
        {!selectedSubject && (
          <div className="max-w-3xl mx-auto w-full py-4 sm:py-8 space-y-6 animate-fade-in">
            {/* Header Pilihan */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Pilih Mata Pelajaran
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-md mx-auto">
                Pilih mata pelajaran untuk melihat peta latihan berjenjang dan raih bintang.
              </p>
            </div>

            {/* 2 Kartu Mata Pelajaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Kartu 1: Bahasa Indonesia */}
              {(() => {
                const biLevels = SUBJECTS_CONFIG.bahasa_indonesia.levels;
                const biDone = biLevels.filter((l) => isLevelCompleted(l.id)).length;
                const biPercent = Math.round((biDone / biLevels.length) * 100);

                return (
                  <div
                    onClick={() => {
                      setSelectedSubject('bahasa_indonesia');
                      setSearchQuery('');
                    }}
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                    }}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-white border-2 border-[#047857] hover:border-[#047857] hover:ring-4 hover:ring-[#047857]/20 hover:shadow-2xl hover:shadow-[#047857]/20 hover:-translate-y-2 active:scale-[0.985] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between select-none"
                  >
                    {/* Interactive Cursor Spotlight Glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'radial-gradient(350px circle at var(--mx, 50%) var(--my, 50%), rgba(4, 120, 87, 0.1), transparent 75%)',
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] group-hover:shadow-md group-hover:bg-[#D1FAE5]">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] transition-all duration-300 group-hover:scale-105 shadow-2xs">
                          10 Latihan Soal
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#261C14] group-hover:text-[#047857] transition-colors duration-200">
                        Bahasa Indonesia
                      </h3>
                      <p className="text-xs text-[#6E6258] mt-2 leading-relaxed">
                        Latihan berjenjang dari Fondasi Dasar hingga Penalaran HOTS Nasional: makna kata, kalimat efektif, sastra, dan teks inferensial.
                      </p>

                      {/* Bar Progres & Bintang */}
                      <div className="mt-4 pt-3 border-t border-[#E6DFD5] space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6258]">
                          <span>Progres: {biDone} dari 10 Latihan</span>
                          <span className="text-[#047857] font-semibold">{biPercent}%</span>
                        </div>
                        <div className="w-full bg-[#F2ECE4] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#047857] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(4, biPercent)}%` }}
                          />
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#D97E26]">
                          <Star className="w-3.5 h-3.5 fill-[#E5A875] text-[#D97E26]" />
                          <span>{biLevels.reduce((acc, l) => acc + getLevelStars(l.id), 0)} / {biLevels.length * 3} Bintang</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-5 pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs font-bold text-[#047857] transition-all">
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        Buka Peta 10 Latihan Bahasa Indonesia
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center group-hover:translate-x-1.5 group-hover:bg-[#047857] group-hover:text-white transition-all duration-300 shadow-2xs">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Kartu 2: Matematika */}
              {(() => {
                const mtkLevels = SUBJECTS_CONFIG.matematika.levels;
                const mtkDone = mtkLevels.filter((l) => isLevelCompleted(l.id)).length;
                const mtkPercent = Math.round((mtkDone / mtkLevels.length) * 100);

                return (
                  <div
                    onClick={() => {
                      setSelectedSubject('matematika');
                      setSearchQuery('');
                    }}
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                    }}
                    className="group relative overflow-hidden p-6 rounded-2xl bg-white border-2 border-[#881337] hover:border-[#881337] hover:ring-4 hover:ring-[#881337]/20 hover:shadow-2xl hover:shadow-[#881337]/20 hover:-translate-y-2 active:scale-[0.985] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between select-none"
                  >
                    {/* Interactive Cursor Spotlight Glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: 'radial-gradient(350px circle at var(--mx, 50%) var(--my, 50%), rgba(136, 19, 55, 0.1), transparent 75%)',
                      }}
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] text-[#881337] border border-[#FECDD3] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-[4deg] group-hover:shadow-md group-hover:bg-[#FFE4E6]">
                          <Calculator className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF1F2] text-[#881337] border border-[#FECDD3] transition-all duration-300 group-hover:scale-105 shadow-2xs">
                          10 Latihan Soal
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#261C14] group-hover:text-[#881337] transition-colors duration-200">
                        Matematika
                      </h3>
                      <p className="text-xs text-[#6E6258] mt-2 leading-relaxed">
                        Latihan berjenjang dari Fondasi Dasar hingga Penalaran HOTS: operasi hitung, KPK/FPB, skala, pecahan, geometri, dan statistika.
                      </p>

                      {/* Bar Progres & Bintang */}
                      <div className="mt-4 pt-3 border-t border-[#E6DFD5] space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-[#6E6258]">
                          <span>Progres: {mtkDone} dari 10 Latihan</span>
                          <span className="text-[#881337] font-semibold">{mtkPercent}%</span>
                        </div>
                        <div className="w-full bg-[#F2ECE4] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#881337] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(4, mtkPercent)}%` }}
                          />
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#D97E26]">
                          <Star className="w-3.5 h-3.5 fill-[#E5A875] text-[#D97E26]" />
                          <span>{mtkLevels.reduce((acc, l) => acc + getLevelStars(l.id), 0)} / {mtkLevels.length * 3} Bintang</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 mt-5 pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs font-bold text-[#881337] transition-all">
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        Buka Peta 10 Latihan Matematika
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

        {/* --- TAHAP 2: PENGERJAAN SOAL LATIHAN PADA LEVEL TERPILIH --- */}
        {selectedSubject && activeLatihan && (
          <div className={`bg-white rounded-2xl w-full shadow-xs overflow-hidden p-4 sm:p-6 animate-fade-in border-2 ${
            selectedSubject === 'matematika' ? 'border-[#881337]' : 'border-[#047857]'
          }`}>
            {/* Header Pengerjaan Latihan */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD5] mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (
                      !isFinished &&
                      Object.keys(userAnswers).length > 0 &&
                      !window.confirm('Yakin ingin kembali? Lembar jawaban belum dikumpulkan.')
                    ) {
                      return;
                    }
                    setActiveLatihan(null);
                    refreshActivity();
                  }}
                  className="w-8 h-8 rounded-lg bg-[#F2ECE4] hover:bg-[#E6DFD5] text-[#261C14] flex items-center justify-center transition-colors cursor-pointer"
                  title="Kembali ke Peta Latihan"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        selectedSubject === 'bahasa_indonesia'
                          ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                          : 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                      }`}
                    >
                      LATIHAN {activeLatihan.level} DARI {currentLevels.length} • {currentSubject.title.toUpperCase()}
                    </span>
                    {isLevelCompleted(activeLatihan.id) && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center space-x-1 ${
                        selectedSubject === 'matematika'
                          ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                          : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                      }`}>
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Tuntas</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#261C14] mt-0.5">
                    {activeLatihan.subjudul}
                  </h2>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs text-[#6E6258]">
                  {activeLatihan.targetSoal} Soal Standar Pusmendik
                </span>
              </div>
            </div>

            {/* KONTEN: PENGERJAAN SOAL AKTIF */}
            {!isFinished ? (
              <div className="max-w-3xl mx-auto py-2 space-y-4">
                {(() => {
                  const answeredCount = activeLatihan.soal.filter((q, idx) =>
                    isQuestionAnswered(q, userAnswers[idx])
                  ).length;
                  const answeredPercent = Math.round(
                    (answeredCount / activeLatihan.soal.length) * 100
                  );

                  return (
                    <>
                      {/* Header Progress & Navigasi */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#6E6258] pb-2 border-b border-[#E6DFD5] gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#261C14] text-sm">
                            Soal {currentQuestionIndex + 1} dari {activeLatihan.soal.length}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#F2ECE4] text-[#261C14] font-medium text-[10px] border border-[#E6DFD5]">
                            {activeLatihan.soal[currentQuestionIndex]?.type === 'mcma'
                              ? 'PG Kompleks'
                              : activeLatihan.soal[currentQuestionIndex]?.type === 'category'
                              ? 'Benar / Salah'
                              : 'Pilihan Ganda'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-medium text-[#6E6258]">
                            Terjawab:{' '}
                            <strong
                              className={`font-semibold ${
                                selectedSubject === 'bahasa_indonesia' ? 'text-[#047857]' : 'text-[#881337]'
                              }`}
                            >
                              {answeredCount}
                            </strong> /{' '}
                            {activeLatihan.soal.length}
                          </span>
                          <span className="text-[10px] text-[#8C7E72] font-medium">
                            ({answeredPercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Bar Progres Visual Lembar Soal */}
                      <div className="w-full bg-[#F2ECE4] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            selectedSubject === 'bahasa_indonesia' ? 'bg-[#047857]' : 'bg-[#881337]'
                          }`}
                          style={{ width: `${Math.max(3, answeredPercent)}%` }}
                        />
                      </div>

                      {/* Grid Soal Navigation Strip */}
                      <div className="flex items-center space-x-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                        {activeLatihan.soal.map((q, idx) => {
                          const answered = isQuestionAnswered(q, userAnswers[idx]);
                          const isCurrent = currentQuestionIndex === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-300 flex-shrink-0 cursor-pointer flex items-center justify-center relative ${
                                isCurrent
                                  ? selectedSubject === 'bahasa_indonesia'
                                    ? 'bg-[#047857] text-white ring-2 ring-[#ECFDF5]'
                                    : 'bg-[#881337] text-white ring-2 ring-[#FFF1F2]'
                                  : answered
                                  ? selectedSubject === 'bahasa_indonesia'
                                    ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] hover:bg-[#A7F3D0]/60'
                                    : 'bg-[#FFF1F2] text-[#881337] border border-[#FECDD3] hover:bg-[#FECDD3]/60'
                                  : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#6E6258] border border-[#E6DFD5]'
                              }`}
                              title={`Soal ${idx + 1} (${answered ? 'Sudah Terjawab' : 'Belum Dijawab'})`}
                            >
                              <span>{idx + 1}</span>
                              {answered && !isCurrent && (
                                <span
                                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                    selectedSubject === 'bahasa_indonesia' ? 'bg-[#047857]' : 'bg-[#881337]'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {/* Kartu Soal */}
                {(() => {
                  const currentQ = activeLatihan.soal[currentQuestionIndex];
                  const qType = currentQ?.type || 'mcq';
                  const currentAns = userAnswers[currentQuestionIndex];

                  if (!currentQ) return null;

                  return (
                    <div className={`p-5 sm:p-6 rounded-2xl bg-white shadow-xs space-y-4 border-2 ${
                      selectedSubject === 'matematika'
                        ? 'border-[#881337] ring-1 ring-[#881337]/20'
                        : 'border-[#047857] ring-1 ring-[#047857]/20'
                    }`}>
                      {/* Indikator Kurikulum */}
                      {currentQ.indicator && (
                        <div
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center space-x-2 ${
                            selectedSubject === 'bahasa_indonesia'
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                              : 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337]'
                          }`}
                        >
                          <HelpCircle className="w-4 h-4 flex-shrink-0" />
                          <span>
                            <strong>Indikator:</strong> {currentQ.indicator}
                          </span>
                        </div>
                      )}

                      {/* Stimulus Bacaan (jika ada) */}
                      {currentQ.stimulus && (
                        <div className={`p-4 rounded-lg text-[#261C14] text-xs sm:text-sm leading-relaxed space-y-1 border-l-4 ${
                          selectedSubject === 'matematika'
                            ? 'bg-[#FFF1F2]/50 border-l-[#881337]'
                            : 'bg-[#ECFDF5]/50 border-l-[#047857]'
                        }`}>
                          <span className={`font-semibold block text-xs ${
                            selectedSubject === 'matematika' ? 'text-[#881337]' : 'text-[#047857]'
                          }`}>Konteks Stimulus:</span>
                          <div dangerouslySetInnerHTML={{ __html: formatMath(currentQ.stimulus) }} />
                        </div>
                      )}

                      {/* Teks Pertanyaan */}
                      <h3
                        className="text-sm sm:text-base font-semibold text-[#261C14] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMath(currentQ.pertanyaan) }}
                      />

                      {/* Opsi 1: MCQ (Single Choice) */}
                      {qType === 'mcq' && (
                        <div className="space-y-2 pt-2">
                          {currentQ.pilihan?.map((opt, oIdx) => {
                            const isSelected =
                              currentAns === opt ||
                              currentAns === oIdx ||
                              (typeof currentAns === 'number' && currentAns === oIdx);
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleAnswerChange(opt)}
                                className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? selectedSubject === 'bahasa_indonesia'
                                      ? 'bg-[#ECFDF5] border-2 border-[#047857] text-[#261C14] font-semibold ring-1 ring-[#047857]/20 shadow-xs'
                                      : 'bg-[#FFF1F2] border-2 border-[#881337] text-[#261C14] font-semibold ring-1 ring-[#881337]/20 shadow-xs'
                                    : selectedSubject === 'bahasa_indonesia'
                                    ? 'bg-white border-[#E6DFD5] hover:border-[#047857]/60 hover:bg-[#ECFDF5]/30 text-[#261C14]'
                                    : 'bg-white border-[#E6DFD5] hover:border-[#881337]/60 hover:bg-[#FFF1F2]/30 text-[#261C14]'
                                }`}
                              >
                                <span dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                                <div
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 ml-2 transition-colors ${
                                    isSelected
                                      ? selectedSubject === 'bahasa_indonesia'
                                        ? 'border-[#047857] bg-[#047857] text-white'
                                        : 'border-[#881337] bg-[#881337] text-white'
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

                      {/* Opsi 2: MCMA (Multi-select) */}
                      {qType === 'mcma' && (
                        <div className="space-y-2 pt-2">
                          <div
                            className={`p-2.5 rounded-lg border text-xs font-medium flex items-center space-x-2 ${
                              selectedSubject === 'bahasa_indonesia'
                                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                                : 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337]'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>Pilihan Ganda Kompleks: Anda dapat memilih lebih dari satu jawaban.</span>
                          </div>
                          {currentQ.pilihan?.map((opt, oIdx) => {
                            const list = Array.isArray(currentAns) ? currentAns : [];
                            const isSelected = list.includes(opt);
                            return (
                              <button
                                key={oIdx}
                                onClick={() => {
                                  const nextList = isSelected
                                    ? list.filter((x) => x !== opt)
                                    : [...list, opt];
                                  handleAnswerChange(nextList);
                                }}
                                className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? selectedSubject === 'bahasa_indonesia'
                                      ? 'bg-[#ECFDF5] border-2 border-[#047857] text-[#261C14] font-semibold ring-1 ring-[#047857]/20 shadow-xs'
                                      : 'bg-[#FFF1F2] border-2 border-[#881337] text-[#261C14] font-semibold ring-1 ring-[#881337]/20 shadow-xs'
                                    : selectedSubject === 'bahasa_indonesia'
                                    ? 'bg-white border-[#E6DFD5] hover:border-[#047857]/60 hover:bg-[#ECFDF5]/30 text-[#261C14]'
                                    : 'bg-white border-[#E6DFD5] hover:border-[#881337]/60 hover:bg-[#FFF1F2]/30 text-[#261C14]'
                                }`}
                              >
                                <span dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                                <div
                                  className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-bold flex-shrink-0 ml-2 transition-colors ${
                                    isSelected
                                      ? selectedSubject === 'bahasa_indonesia'
                                        ? 'border-[#047857] bg-[#047857] text-white'
                                        : 'border-[#881337] bg-[#881337] text-white'
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

                      {/* Opsi 3: CATEGORY (Benar / Salah) */}
                      {qType === 'category' && (
                        <div className="space-y-3 pt-2">
                          <div className="p-2.5 rounded-lg bg-[#FEF7EE] border border-[#F4D3C4] text-xs text-[#D97E26] font-medium flex items-center space-x-2">
                            <HelpCircle className="w-4 h-4 text-[#D97E26] flex-shrink-0" />
                            <span>Tentukan apakah setiap pernyataan bernilai Benar atau Salah.</span>
                          </div>
                          <div className={`divide-y divide-[#E6DFD5] border-2 rounded-xl overflow-hidden bg-white ${
                            selectedSubject === 'matematika' ? 'border-[#881337]/40' : 'border-[#047857]/40'
                          }`}>
                            {currentQ.statements?.map((stmt, sIdx) => {
                              const stmtVal =
                                typeof currentAns === 'object' && currentAns !== null
                                  ? currentAns[sIdx]
                                  : undefined;
                              return (
                                <div
                                  key={sIdx}
                                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2]"
                                >
                                  <span
                                    className="text-xs sm:text-sm text-[#261C14] flex-1 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: formatMath(stmt.text) }}
                                  />
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        const obj =
                                          typeof currentAns === 'object' && currentAns !== null
                                            ? currentAns
                                            : {};
                                        handleAnswerChange({ ...obj, [sIdx]: true });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        stmtVal === true
                                          ? selectedSubject === 'matematika'
                                            ? 'bg-[#881337] text-white'
                                            : 'bg-[#047857] text-white'
                                          : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#6E6258] border border-[#E6DFD5]'
                                      }`}
                                    >
                                      Benar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const obj =
                                          typeof currentAns === 'object' && currentAns !== null
                                            ? currentAns
                                            : {};
                                        handleAnswerChange({ ...obj, [sIdx]: false });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        stmtVal === false
                                          ? 'bg-[#C93B3B] text-white'
                                          : 'bg-[#FAF7F2] hover:bg-[#F2ECE4] text-[#6E6258] border border-[#E6DFD5]'
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

                      {/* Navigasi Bawah */}
                      <div className="mt-6 pt-4 border-t border-[#E6DFD5] flex items-center justify-between">
                        <button
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer ${
                            currentQuestionIndex === 0
                              ? 'text-[#8C7E72] bg-[#FAF7F2] border border-[#E6DFD5] cursor-not-allowed'
                              : 'text-[#261C14] hover:text-[#261C14] bg-[#F2ECE4] hover:bg-[#E6DFD5]'
                          }`}
                        >
                          &larr; Sebelumnya
                        </button>

                        <div className="flex items-center space-x-2">
                          {currentQuestionIndex < activeLatihan.soal.length - 1 ? (
                            <button
                              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                              className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all duration-300 cursor-pointer ${
                                selectedSubject === 'bahasa_indonesia'
                                  ? 'bg-[#047857] hover:bg-[#065F46]'
                                  : 'bg-[#881337] hover:bg-[#700D2B]'
                              }`}
                            >
                              Selanjutnya &rarr;
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const answered = activeLatihan.soal.filter((q, idx) =>
                                  isQuestionAnswered(q, userAnswers[idx])
                                ).length;
                                const unanswered = activeLatihan.soal.length - answered;

                                if (unanswered > 0) {
                                  if (
                                    window.confirm(
                                      `Perhatian: Masih ada ${unanswered} soal yang belum kamu jawab!\n\nSesuai sistem kenaikan level, jika kamu TIDAK MENYELESAIKAN SEMUA SOAL (${activeLatihan.soal.length}/${activeLatihan.soal.length}), kamu TIDAK AKAN MENDAPATKAN EXP.\n\nApakah kamu tetap ingin mengumpulkan latihan sekarang?`
                                    )
                                  ) {
                                    handleFinishQuiz();
                                  }
                                } else {
                                  if (
                                    window.confirm('Apakah Anda yakin ingin mengumpulkan lembar jawaban latihan sekarang?')
                                  ) {
                                    handleFinishQuiz();
                                  }
                                }
                              }}
                              className={`px-4 py-2 rounded-lg text-white text-xs font-semibold transition-all duration-300 cursor-pointer ${
                                selectedSubject === 'bahasa_indonesia'
                                  ? 'bg-[#047857] hover:bg-[#065F46]'
                                  : 'bg-[#881337] hover:bg-[#700D2B]'
                              }`}
                            >
                              Kumpulkan Latihan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : !isReviewMode ? (
              /* HASIL NILAI DI AKHIR */
              <div className="max-w-md mx-auto py-8 text-center space-y-5 animate-fade-in">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border-2 ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                    : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                }`}>
                  <Trophy className="w-7 h-7" />
                </div>

                <div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    selectedSubject === 'matematika' ? 'text-[#881337]' : 'text-[#047857]'
                  }`}>
                    Latihan Selesai
                  </span>
                  <h3 className="text-xl font-bold text-[#261C14] mt-1">
                    Hasil Latihan {activeLatihan.level}
                  </h3>
                </div>

                {/* Skor Card */}
                <div className={`p-6 rounded-2xl bg-[#FAF7F2] border-2 shadow-xs space-y-4 ${
                  selectedSubject === 'matematika' ? 'border-[#881337]' : 'border-[#047857]'
                }`}>
                  <div className="text-4xl font-extrabold text-[#261C14]">
                    {latestScoreResult?.score}
                    <span className="text-sm text-[#6E6258] font-normal"> / 100</span>
                  </div>

                  {/* Perolehan Bintang */}
                  <div className="flex items-center justify-center space-x-2 py-1">
                    {[1, 2, 3].map((starNum) => {
                      const isEarned = starNum <= (latestScoreResult?.starsEarned || 0);
                      return (
                        <div
                          key={starNum}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isEarned
                              ? 'bg-[#FEF7EE] border border-[#F4D3C4]'
                              : 'bg-[#F2ECE4] border border-[#E6DFD5] opacity-50'
                          }`}
                        >
                          <Star
                            className={`w-5 h-5 ${
                              isEarned
                                ? 'text-[#D97E26] fill-[#E5A875]'
                                : 'text-[#8C7E72] fill-transparent'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-[#D97E26]">
                    {latestScoreResult?.starsEarned === 3
                      ? 'Sempurna! Kamu meraih 3 Bintang Emas.'
                      : latestScoreResult?.starsEarned === 2
                      ? 'Hebat! Kamu meraih 2 Bintang Emas.'
                      : latestScoreResult?.starsEarned === 1
                      ? 'Bagus! Kamu berhasil meraih 1 Bintang.'
                      : 'Belum meraih bintang. Ulangi latihan untuk hasil lebih baik.'}
                  </p>

                  {/* Status EXP Sesuai Kelengkapan Soal */}
                  <div className="pt-0.5">
                    {latestScoreResult?.isCompletedAll ? (
                      latestScoreResult?.expEarned > 0 ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E8F2EF] text-[#286657] border border-[#BCD9D0] text-xs font-bold shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-[#286657]" />
                          <span>+{latestScoreResult?.expEarned} EXP Didapatkan! (Semua Soal Selesai)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium">
                          <span>0 EXP (Latihan Diulang - Tidak Menambah EXP)</span>
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FDF1F1] text-[#C93B3B] border border-[#F4C7C7] text-xs font-medium">
                        <span>0 EXP (EXP hanya didapat jika menyelesaikan seluruh {latestScoreResult?.totalCount} soal latihan)</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E6DFD5] text-xs">
                    <div className="p-2.5 rounded-lg bg-[#E8F2EF] border border-[#C5DDD6] text-[#286657]">
                      <span className="block font-bold text-base">
                        {latestScoreResult?.correctCount} / {latestScoreResult?.totalCount}
                      </span>
                      <span>Jawaban Benar</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDF1F1] border border-[#F4C7C7] text-[#C93B3B]">
                      <span className="block font-bold text-base">
                        {latestScoreResult?.wrongCount}
                      </span>
                      <span>Jawaban Salah</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      setReviewFilter('all');
                      setIsReviewMode(true);
                    }}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white font-semibold text-xs shadow-xs transition-all duration-300 flex items-center justify-center space-x-1.5 cursor-pointer ${
                      selectedSubject === 'matematika'
                        ? 'bg-[#881337] hover:bg-[#700D2B]'
                        : 'bg-[#047857] hover:bg-[#065F46]'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Pembahasan</span>
                  </button>

                  <button
                    onClick={() => handleStartLatihan(activeLatihan)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Coba Lagi</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveLatihan(null);
                      refreshActivity();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#261C14] hover:bg-[#3D2E24] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Peta Latihan
                  </button>
                </div>
              </div>
            ) : (
              /* REVIEW LATIHAN SOAL LENGKAP */
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E6DFD5] gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#261C14]">
                      Review Latihan {activeLatihan.level} & Pembahasan Lengkap
                    </h3>
                    <p className="text-xs text-[#6E6258]">
                      Pelajari penjelasan setiap butir soal untuk menguasai kompetensi TKA SD.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-[#F2ECE4] p-1 rounded-lg text-xs font-medium">
                      <button
                        onClick={() => setReviewFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          reviewFilter === 'all'
                            ? 'bg-white text-[#261C14] shadow-xs font-semibold'
                            : 'text-[#6E6258] hover:text-[#261C14]'
                        }`}
                      >
                        Semua ({activeLatihan.soal.length})
                      </button>
                      <button
                        onClick={() => setReviewFilter('wrong')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          reviewFilter === 'wrong'
                            ? 'bg-[#C93B3B] text-white font-semibold'
                            : 'text-[#6E6258] hover:text-[#261C14]'
                        }`}
                      >
                        Salah ({latestScoreResult?.wrongCount})
                      </button>
                      <button
                        onClick={() => setReviewFilter('correct')}
                        className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          reviewFilter === 'correct'
                            ? 'bg-[#286657] text-white font-semibold'
                            : 'text-[#6E6258] hover:text-[#261C14]'
                        }`}
                      >
                        Benar ({latestScoreResult?.correctCount})
                      </button>
                    </div>

                    <button
                      onClick={() => setIsReviewMode(false)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-medium text-[#261C14] transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>

                {/* Daftar Soal & Penjelasannya */}
                <div className="space-y-4">
                  {activeLatihan.soal
                    .filter((q, idx) => {
                      const isCorrect = isQuestionCorrect(q, userAnswers[idx]);
                      if (reviewFilter === 'wrong') return !isCorrect;
                      if (reviewFilter === 'correct') return isCorrect;
                      return true;
                    })
                    .map((q) => {
                      const origIdx = activeLatihan.soal.indexOf(q);
                      const userAnswer = userAnswers[origIdx];
                      const isCorrect = isQuestionCorrect(q, userAnswer);
                      const qType = q.type || 'mcq';

                      return (
                        <div
                          key={q.id || origIdx}
                          className={`p-4 rounded-lg border bg-white ${
                            isCorrect ? 'border-[#C5DDD6]' : 'border-[#F4C7C7]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#261C14] text-white">
                                Soal #{origIdx + 1}
                              </span>
                              {q.indicator && (
                                <span className="text-[11px] text-[#6E6258] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E6DFD5]">
                                  {q.indicator}
                                </span>
                              )}
                            </div>

                            {isCorrect ? (
                              <span className="inline-flex items-center space-x-1 text-xs font-medium text-[#286657] bg-[#E8F2EF] px-2 py-0.5 rounded border border-[#C5DDD6]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#286657]" />
                                <span>Jawabanmu Benar</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-xs font-medium text-[#C93B3B] bg-[#FDF1F1] px-2 py-0.5 rounded border border-[#F4C7C7]">
                                <XCircle className="w-3.5 h-3.5 text-[#C93B3B]" />
                                <span>Jawabanmu Salah</span>
                              </span>
                            )}
                          </div>

                          {q.stimulus && (
                            <div className="p-3 mb-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] text-xs">
                              <span className="font-semibold text-[#261C14] block mb-1">Stimulus:</span>
                              <div dangerouslySetInnerHTML={{ __html: formatMath(q.stimulus) }} />
                            </div>
                          )}

                          <h4
                            className="text-xs sm:text-sm font-semibold text-[#261C14] mb-3 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatMath(q.pertanyaan) }}
                          />

                          {/* Pilihan MCQ */}
                          {qType === 'mcq' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                              {q.pilihan?.map((opt, oIdx) => {
                                const isOptionCorrect =
                                  opt === q.jawabanBenar ||
                                  (typeof q.jawabanBenar === 'number' && oIdx === q.jawabanBenar);
                                const isOptionSelected =
                                  opt === userAnswer ||
                                  (typeof userAnswer === 'number' && oIdx === userAnswer);

                                let badgeStyle = 'bg-white border-[#E6DFD5] text-[#6E6258]';
                                if (isOptionCorrect) {
                                  badgeStyle = 'bg-[#E8F2EF] border-[#C5DDD6] text-[#286657] font-medium';
                                } else if (isOptionSelected && !isCorrect) {
                                  badgeStyle = 'bg-[#FDF1F1] border-[#F4C7C7] text-[#C93B3B] line-through';
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${badgeStyle}`}
                                  >
                                    <span dangerouslySetInnerHTML={{ __html: `${String.fromCharCode(65 + oIdx)}. ${formatMath(opt)}` }} />
                                    {isOptionCorrect && (
                                      <span className="text-[10px] bg-[#286657] text-white font-semibold px-1.5 py-0.5 rounded ml-2">
                                        Kunci
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Pilihan MCMA */}
                          {qType === 'mcma' && (
                            <div className="space-y-1.5 mb-3">
                              {q.pilihan?.map((opt, oIdx) => {
                                const isKey = Array.isArray(q.jawabanBenar) && q.jawabanBenar.includes(opt);
                                const isUser = Array.isArray(userAnswer) && userAnswer.includes(opt);
                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2 rounded-lg text-xs flex items-center justify-between border ${
                                      isKey
                                        ? 'bg-[#E8F2EF] border-[#C5DDD6] text-[#286657] font-medium'
                                        : isUser
                                        ? 'bg-[#FDF1F1] border-[#F4C7C7] text-[#C93B3B]'
                                        : 'bg-white border-[#E6DFD5] text-[#6E6258]'
                                    }`}
                                  >
                                    <span dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                                    <div className="flex items-center space-x-1">
                                      {isKey && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#286657] text-white">
                                          Kunci
                                        </span>
                                      )}
                                      {isUser && (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white transition-colors duration-300 ${
                                          selectedSubject === 'matematika' ? 'bg-[#881337]' : 'bg-[#047857]'
                                        }`}>
                                          Dipilih
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Detail Category (Benar / Salah) */}
                          {qType === 'category' && (
                            <div className="divide-y divide-[#E6DFD5] border border-[#E6DFD5] rounded-lg overflow-hidden bg-white mb-3 text-xs">
                              {q.statements?.map((stmt, sIdx) => {
                                const userVal =
                                  typeof userAnswer === 'object' && userAnswer !== null
                                    ? userAnswer[sIdx]
                                    : undefined;
                                const isStmtCorrect = userVal === stmt.answer;
                                return (
                                  <div key={sIdx} className="p-2.5 flex items-center justify-between gap-2">
                                    <span
                                      className="flex-1 text-[#261C14]"
                                      dangerouslySetInnerHTML={{ __html: formatMath(stmt.text) }}
                                    />
                                    <div className="flex items-center space-x-2 text-[11px] font-medium">
                                      <span className={stmt.answer ? 'text-[#047857]' : 'text-[#C93B3B]'}>
                                        Kunci: {stmt.answer ? 'Benar' : 'Salah'}
                                      </span>
                                      <span className="text-[#8C7E72]">|</span>
                                      <span className={isStmtCorrect ? 'text-[#047857]' : 'text-[#C93B3B]'}>
                                        Kamu: {userVal === undefined ? 'Belum dijawab' : userVal ? 'Benar' : 'Salah'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Penjelasan */}
                          <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs">
                            <strong className="text-[#261C14] flex items-center space-x-1.5 mb-1 font-semibold">
                              <HelpCircle className={`w-3.5 h-3.5 transition-colors duration-300 ${selectedSubject === 'matematika' ? 'text-[#881337]' : 'text-[#047857]'}`} />
                              <span>Penjelasan & Pembahasan:</span>
                            </strong>
                            <div
                              className="text-[#6E6258] leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatMath(q.penjelasan) }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAHAP 3: PETA PETUALANGAN LATIHAN & GRID VIEW --- */}
        {selectedSubject && !activeLatihan && (
          <div className="w-full space-y-4">
            {/* Header Hero Banner Mapel Aktif */}
            <div className={`p-5 sm:p-6 rounded-2xl bg-white border-2 text-[#261C14] shadow-sm relative overflow-hidden ${
              selectedSubject === 'bahasa_indonesia' ? 'border-[#047857]' : 'border-[#881337]'
            }`}>
              <div className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#FAF7F2] text-xs font-medium text-[#6E6258] border border-[#E6DFD5]">
                      <currentSubject.icon className={`w-3.5 h-3.5 transition-colors duration-300 ${selectedSubject === 'matematika' ? 'text-[#881337]' : 'text-[#047857]'}`} />
                      <span>{currentSubject.tagline}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#261C14]">
                      {currentSubject.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6E6258] max-w-xl leading-relaxed">
                      {currentSubject.deskripsi}
                    </p>
                  </div>

                  <div className="flex flex-col items-stretch sm:items-end space-y-2 flex-shrink-0 self-start sm:self-center">
                    {/* Tombol Buku Panduan - Sesuai Mata Pelajaran */}
                    <button
                      onClick={() => setShowGuideModal(true)}
                      className={`w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center space-x-2 border-2 cursor-pointer shadow-xs ${
                        selectedSubject === 'matematika'
                          ? 'bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#881337] border-[#881337]'
                          : 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border-[#047857]'
                      }`}
                      title={`Buku Panduan ${currentSubject?.title || ''}`}
                    >
                      {selectedSubject === 'matematika' ? (
                        <Calculator className="w-4 h-4 text-[#881337]" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-[#047857]" />
                      )}
                      <span>Buku Panduan</span>
                    </button>

                    {/* Switcher Mode Tampilan (Peta / Daftar) */}
                    <div className="w-full sm:w-auto bg-[#FAF7F2] p-1 rounded-lg flex items-center border-2 border-slate-300">
                      <button
                        onClick={() => setViewMode('roadmap')}
                        className={`flex-1 sm:flex-initial py-1 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-300 cursor-pointer ${
                          viewMode === 'roadmap'
                            ? `bg-white ${selectedSubject === 'matematika' ? 'text-[#881337]' : 'text-[#047857]'} font-semibold shadow-xs`
                            : 'text-[#6E6258] hover:text-[#261C14]'
                        }`}
                        title="Tampilan Peta Jalan"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Peta</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`flex-1 sm:flex-initial py-1 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all duration-300 cursor-pointer ${
                          viewMode === 'grid'
                            ? `bg-white ${selectedSubject === 'matematika' ? 'text-[#881337]' : 'text-[#047857]'} font-semibold shadow-xs`
                            : 'text-[#6E6258] hover:text-[#261C14]'
                        }`}
                        title="Tampilan Daftar Kartu"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Daftar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Indikator Status */}
                <div className="pt-3 border-t border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-medium text-[#6E6258]">
                      <span>Progres {currentSubject.title}</span>
                      <span className="font-semibold text-[#261C14]">
                        {completedCount} dari {currentLevels.length} Selesai ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F2ECE4] rounded-full h-2 overflow-hidden">
                      <div
                        className={`${selectedSubject === 'matematika' ? 'bg-[#881337]' : 'bg-[#047857]'} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(4, progressPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-md bg-[#FAF7F2] border border-[#E6DFD5] font-medium text-[#6E6258] flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-[#D97E26]" />
                      <span>
                        Fokus: Latihan{' '}
                        {currentActiveLevelIndex !== -1
                          ? currentLevels[currentActiveLevelIndex].level
                          : currentLevels.length}
                      </span>
                    </span>

                    <span className="px-2.5 py-1 rounded-md bg-[#FEF7EE] border border-[#FCD9BD] font-medium text-[#D97E26] flex items-center space-x-1">
                      <Star className="w-3 h-3 text-[#D97E26] fill-[#E5A875]" />
                      <span>
                        {currentLevels.reduce((acc, lvl) => acc + getLevelStars(lvl.id), 0)}/{currentLevels.length * 3} Bintang
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pencarian Latihan Instan */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8C7E72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari tingkat latihan ${currentSubject.title}...`}
                className={`w-full pl-10 pr-9 py-2.5 rounded-lg bg-white border border-[#E6DFD5] text-xs sm:text-sm text-[#261C14] placeholder-[#8C7E72] focus:outline-hidden ${selectedSubject === 'matematika' ? 'focus:border-[#881337] focus:ring-[#881337]' : 'focus:border-[#047857] focus:ring-[#047857]'} focus:ring-1 shadow-xs transition-all duration-300`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7E72] hover:text-[#261C14] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* --- JIKA MODE GRID TAMPILAN KARTU --- */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
                {filteredLevels.map((lvl) => {
                  const originalIndex = currentLevels.findIndex((l) => l.id === lvl.id);
                  const isCompleted = isLevelCompleted(lvl.id);
                  const isUnlocked = isLevelUnlocked(originalIndex, lvl, currentLevels);
                  const isCurrent = originalIndex === currentActiveLevelIndex;
                  const isMtk = selectedSubject === 'matematika';

                  return (
                    <div
                      key={lvl.id}
                      onClick={() => setSelectedLevelModal(lvl)}
                      className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                        isCompleted
                          ? isMtk
                            ? 'bg-white border-[#FECDD3] hover:border-[#881337] shadow-xs'
                            : 'bg-white border-[#A7F3D0] hover:border-[#047857] shadow-xs'
                          : isCurrent
                          ? isMtk
                            ? 'bg-white border-[#881337] shadow-xs ring-1 ring-[#881337]'
                            : 'bg-white border-[#047857] shadow-xs ring-1 ring-[#047857]'
                          : isUnlocked
                          ? 'bg-white border-[#E6DFD5] hover:border-[#8C7E72] shadow-xs'
                          : 'bg-[#FAF7F2] border-[#E6DFD5] text-[#8C7E72] hover:border-[#8C7E72]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold transition-colors duration-300 ${
                              isCompleted || isCurrent
                                ? isMtk
                                  ? 'bg-[#881337] text-white'
                                  : 'bg-[#047857] text-white'
                                : isUnlocked
                                ? 'bg-[#F2ECE4] text-[#261C14]'
                                : 'bg-[#E6DFD5] text-[#8C7E72]'
                            }`}
                          >
                            {lvl.level}
                          </span>

                          {isCompleted ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center space-x-1 transition-colors duration-300 ${
                              isMtk
                                ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                                : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                            }`}>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Selesai</span>
                            </span>
                          ) : isCurrent ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors duration-300 ${
                              isMtk
                                ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                                : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                            }`}>
                              Fokus Saat Ini
                            </span>
                          ) : isUnlocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF7F2] text-[#6E6258] border border-[#E6DFD5]">
                              Terbuka
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2ECE4] text-[#8C7E72] flex items-center space-x-1 border border-[#E6DFD5]">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Terkunci</span>
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-semibold leading-snug ${
                            isCompleted || isUnlocked
                              ? 'text-[#261C14]'
                              : 'text-[#8C7E72]'
                          }`}
                        >
                          Latihan {lvl.level}: {lvl.subjudul}
                        </h4>

                        <p className="text-xs text-[#6E6258] mt-1 line-clamp-2 leading-relaxed">
                          {lvl.deskripsi}
                        </p>

                        {/* Capaian Bintang Level di Grid */}
                        <div className="flex items-center space-x-1 mt-2.5">
                          {[1, 2, 3].map((s) => {
                            const stars = getLevelStars(lvl.id);
                            return (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= stars
                                    ? 'text-[#D97E26] fill-[#E5A875]'
                                    : 'text-[#8C7E72] fill-transparent'
                                }`}
                              />
                            );
                          })}
                          <span className="text-[10px] font-medium text-[#6E6258] ml-1">
                            {getLevelStars(lvl.id) > 0 ? `${getLevelStars(lvl.id)}/3` : '0/3'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-xs font-medium">
                        <span className={`transition-colors duration-300 ${isUnlocked ? (isMtk ? 'text-[#881337]' : 'text-[#047857]') : 'text-[#8C7E72]'}`}>
                          {isUnlocked ? 'Kerjakan Latihan' : 'Lompat Latihan'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#8C7E72]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- Winding Path Petualangan --- */
              <div className={`bg-white rounded-2xl border-2 p-4 sm:p-8 shadow-xs relative overflow-hidden ${
                selectedSubject === 'matematika' ? 'border-[#881337]' : 'border-[#047857]'
              }`}>
                {/* Subtitle Alur */}
                <div className="text-center mb-6">
                  <span className="text-xs font-semibold text-[#6E6258] uppercase tracking-wider">
                    Peta Latihan {currentLevels.length} Level • {currentSubject.title}
                  </span>
                  <p className="text-xs text-[#6E6258] mt-1">
                    Pilih tingkat latihan untuk mulai mengerjakan soal dan raih 3 bintang.
                  </p>
                </div>

                {/* Kontainer Alur Zig-Zag (Roadmap Path) */}
                <div className="relative max-w-md mx-auto py-2 flex flex-col items-center space-y-6">
                  {currentLevels.map((lvl, index) => {
                    const isCompleted = isLevelCompleted(lvl.id);
                    const isUnlocked = isLevelUnlocked(index, lvl, currentLevels);
                    const isCurrent = index === currentActiveLevelIndex;
                    const offsetClass = getPathOffset(index);
                    const starsEarned = getLevelStars(lvl.id);

                    // Cek Milestone Peti
                    const milestoneItem = currentSubject.milestones[lvl.level];
                    const isFinalLevel = lvl.level === currentLevels.length;

                    return (
                      <React.Fragment key={lvl.id}>
                        {/* Item Level Node */}
                        <div
                          className={`relative flex flex-col items-center transition-all duration-300 ${offsetClass}`}
                        >
                          {/* Balon Tag Level Aktif Sekarang */}
                          {isCurrent && (
                            <div
                              className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full ${
                                selectedSubject === 'matematika'
                                  ? 'bg-[#881337] border-[#4C0519]'
                                  : 'bg-[#047857] border-[#064E3B]'
                              } text-white font-bold text-[11px] shadow-md flex items-center space-x-1.5 z-20 border animate-bounce select-none pointer-events-none transition-all duration-300`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                              <span>Mulai di Sini</span>
                              <div
                                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-[6px] ${
                                  selectedSubject === 'matematika'
                                    ? 'border-t-[#881337]'
                                    : 'border-t-[#047857]'
                                }`}
                              />
                            </div>
                          )}

                          {/* Tombol Lingkaran Interaktif Tactile 3D Node */}
                          <button
                            onClick={() => setSelectedLevelModal(lvl)}
                            className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center font-bold border-2 transition-all duration-300 cursor-pointer relative z-10 select-none group ${
                              isCompleted
                                ? selectedSubject === 'matematika'
                                  ? 'bg-[#881337] border-[#4C0519] text-white shadow-[0_6px_0_0_#4C0519] hover:shadow-[0_7px_0_0_#4C0519] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#4C0519]'
                                  : 'bg-[#047857] border-[#064E3B] text-white shadow-[0_6px_0_0_#064E3B] hover:shadow-[0_7px_0_0_#064E3B] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#064E3B]'
                                : isCurrent
                                ? selectedSubject === 'matematika'
                                  ? 'bg-[#881337] border-[#4C0519] text-white shadow-[0_6px_0_0_#4C0519] hover:shadow-[0_7px_0_0_#4C0519] ring-4 ring-offset-2 ring-[#881337]/30 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#4C0519]'
                                  : 'bg-[#047857] border-[#064E3B] text-white shadow-[0_6px_0_0_#064E3B] hover:shadow-[0_7px_0_0_#064E3B] ring-4 ring-offset-2 ring-[#047857]/30 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#064E3B]'
                                : isUnlocked
                                ? selectedSubject === 'matematika'
                                  ? 'bg-white border-[#D8CDC2] text-[#261C14] shadow-[0_6px_0_0_#C5B8AC] hover:border-[#881337] hover:text-[#881337] hover:shadow-[0_7px_0_0_#4C0519] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#C5B8AC]'
                                  : 'bg-white border-[#D8CDC2] text-[#261C14] shadow-[0_6px_0_0_#C5B8AC] hover:border-[#047857] hover:text-[#047857] hover:shadow-[0_7px_0_0_#064E3B] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#C5B8AC]'
                                : 'bg-[#F2ECE4] border-[#E6DFD5] text-[#8C7E72] shadow-[0_5px_0_0_#D8CDC2] hover:bg-[#EAE2D8] hover:text-[#6E6258] hover:shadow-[0_6px_0_0_#C5B8AC] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_0_#D8CDC2]'
                            }`}
                            title={`Latihan ${lvl.level}: ${lvl.subjudul || lvl.namaLevel} (${
                              isCompleted ? 'Tuntas' : isUnlocked ? 'Terbuka' : 'Terkunci - Klik untuk Lompat'
                            })`}
                          >
                            {/* Ikon di dalam node */}
                            {isCompleted ? (
                              <Check className="w-8 h-8 stroke-[3] group-hover:scale-110 transition-transform" />
                            ) : isCurrent ? (
                              <Sparkles className="w-7 h-7 text-amber-300 group-hover:scale-110 transition-transform" />
                            ) : isUnlocked ? (
                              <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                                <span className="text-xl font-black leading-none">{lvl.level}</span>
                                <span className="text-[9px] font-bold uppercase opacity-75 mt-0.5">Soal</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center opacity-75 group-hover:opacity-100 transition-opacity">
                                <Lock className="w-5 h-5 mb-0.5" />
                                <span className="text-[9px] font-bold">{lvl.level}</span>
                              </div>
                            )}

                            {/* Badge Bintang jika Tuntas */}
                            {isCompleted && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-amber-950 border-2 border-white flex items-center justify-center text-xs font-black shadow-xs">
                                ★
                              </div>
                            )}
                          </button>

                          {/* Pill Judul Level (Hanya Indikator, Bukan Tombol) */}
                          <div
                            className={`mt-2.5 px-3.5 py-1.5 rounded-lg text-center select-none max-w-[170px] sm:max-w-[200px] border shadow-2xs transition-all duration-300 ${
                              isCompleted
                                ? selectedSubject === 'matematika'
                                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337]'
                                  : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                                : isCurrent
                                ? selectedSubject === 'matematika'
                                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337] font-bold shadow-xs'
                                  : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857] font-bold shadow-xs'
                                : isUnlocked
                                ? 'bg-white border-[#E6DFD5] text-[#261C14]'
                                : 'bg-[#FAF7F2] border-[#E6DFD5] text-[#8C7E72]'
                            }`}
                          >
                            <span className="block text-[10px] font-semibold uppercase tracking-wider opacity-75">
                              Latihan {lvl.level}
                            </span>
                            <span className="block text-xs font-medium truncate">
                              {lvl.subjudul || lvl.namaLevel}
                            </span>
                          </div>

                          {/* 3 Bintang Horizontal Capaian Latihan (Indikator Saja) */}
                          <div
                            className="flex items-center justify-center space-x-1.5 mt-2 select-none py-1 px-2.5 rounded-full bg-white border border-[#E6DFD5] shadow-2xs"
                            title={`Latihan ${lvl.level}: Meraih ${starsEarned} dari 3 Bintang`}
                          >
                            {[1, 2, 3].map((starIdx) => {
                              const isFilled = starIdx <= starsEarned;
                              return (
                                <Star
                                  key={starIdx}
                                  className={`w-3.5 h-3.5 transition-colors ${
                                    isFilled
                                      ? 'text-amber-500 fill-amber-400'
                                      : 'text-[#D4C8BC] fill-[#FAF7F2] stroke-[#D4C8BC]'
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* --- MILESTONE PETI BONUS (Jika ada di level ini) --- */}
                        {milestoneItem && !isFinalLevel && (
                          <div
                            onClick={() =>
                              setMilestoneModal({
                                title: milestoneItem.title,
                                desc: milestoneItem.desc,
                                requiredLevel: milestoneItem.requiredLevel,
                                unlocked: completedCount >= milestoneItem.requiredLevel,
                                reward: milestoneItem.reward,
                                avatarIds: milestoneItem.avatarIds || [],
                              })
                            }
                            className="relative flex flex-col items-center my-3 cursor-pointer group"
                          >
                            <div
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-150 cursor-pointer ${
                                completedCount >= milestoneItem.requiredLevel
                                  ? 'bg-[#FEF7EE] border-amber-300 text-amber-700 shadow-[0_5px_0_0_#D97E26] hover:shadow-[0_6px_0_0_#D97E26] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                                  : 'bg-[#F2ECE4] border-[#E6DFD5] text-[#8C7E72] shadow-[0_4px_0_0_#D8CDC2] hover:bg-[#EAE2D8] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                              }`}
                            >
                              <Gift className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="mt-2 px-2.5 py-0.5 rounded-full bg-white border border-[#E6DFD5] text-[10px] font-bold text-[#6E6258] shadow-2xs group-hover:border-[#8C7E72]">
                              {completedCount >= milestoneItem.requiredLevel
                                ? '🎁 Peti Terbuka'
                                : `Peti Latihan ${milestoneItem.requiredLevel}`}
                            </div>
                          </div>
                        )}

                        {/* --- GRAND TROPHY (Puncak Akhir Mapel) --- */}
                        {isFinalLevel && (
                          <div
                            onClick={() =>
                              setMilestoneModal({
                                title: milestoneItem?.title || `Piala Juara ${currentSubject.title}`,
                                desc: milestoneItem?.desc || `Piala kebanggaan setelah menuntaskan seluruh ${currentLevels.length} Latihan ${currentSubject.title}.`,
                                requiredLevel: currentLevels.length,
                                unlocked: completedCount === currentLevels.length,
                                reward: milestoneItem?.reward || `👑 Gelar Maestro ${currentSubject.title} TKA SD 100%`,
                                avatarIds: milestoneItem?.avatarIds || [],
                              })
                            }
                            className="relative flex flex-col items-center pt-4 pb-2 cursor-pointer group animate-fade-in"
                          >
                            <div
                              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-150 cursor-pointer ${
                                completedCount === currentLevels.length
                                  ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-[0_6px_0_0_#B8731E] hover:shadow-[0_7px_0_0_#B8731E] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none ring-4 ring-amber-300/40'
                                  : 'bg-[#F2ECE4] border-[#E6DFD5] text-[#8C7E72] shadow-[0_4px_0_0_#D8CDC2] hover:bg-[#EAE2D8] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                              }`}
                            >
                              <Trophy className="w-8 h-8 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="mt-2 text-center">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs inline-block transition-transform group-hover:scale-105 ${
                                  completedCount === currentLevels.length
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-[#F2ECE4] text-[#6E6258] border-[#E6DFD5]'
                                }`}
                              >
                                {completedCount === currentLevels.length
                                  ? `👑 MAESTRO ${currentSubject.title.toUpperCase()}`
                                  : `Piala Puncak (Latihan ${currentLevels.length} Selesai)`}
                              </span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODAL 1: DETAIL LATIHAN --- */}
      {selectedLevelModal && currentLevels.length > 0 && (() => {
        const modalIndex = currentLevels.findIndex((l) => l.id === selectedLevelModal.id);
        const isCompleted = isLevelCompleted(selectedLevelModal.id);
        const isUnlocked = isLevelUnlocked(modalIndex, selectedLevelModal, currentLevels);
        const prevLvl = modalIndex > 0 ? currentLevels[modalIndex - 1] : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1914]/50 backdrop-blur-xs">
            <div className={`bg-white rounded-2xl border-2 shadow-xl max-w-md w-full overflow-hidden relative ${
              selectedSubject === 'matematika' ? 'border-[#881337]' : 'border-[#047857]'
            }`}>
              {/* Header Modal */}
              <div className={`p-4 text-white relative border-b-2 ${
                selectedSubject === 'matematika' ? 'bg-[#881337] border-[#700D2B]' : 'bg-[#047857] border-[#065F46]'
              }`}>
                <button
                  onClick={() => setSelectedLevelModal(null)}
                  className="absolute right-3.5 top-3.5 w-7 h-7 rounded-md hover:bg-[#2D241C] text-[#D4C8BC] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2D241C] text-[#D4C8BC] border border-[#3D3126]">
                    LATIHAN {selectedLevelModal.level} • {currentSubject?.title.toUpperCase()}
                  </span>
                  {isCompleted ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      selectedSubject === 'matematika'
                        ? 'bg-[#881337] text-white border-[#4C0519]'
                        : 'bg-[#047857] text-white border-[#064E3B]'
                    }`}>
                      Tuntas ({getLevelStars(selectedLevelModal.id)}/3 ★)
                    </span>
                  ) : isUnlocked ? (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      selectedSubject === 'matematika'
                        ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                        : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                    }`}>
                      Terbuka
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#2D241C] text-[#8C7E72] border border-[#3D3126]">
                      Terkunci
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">{selectedLevelModal.subjudul}</h3>
              </div>

              {/* Body Modal */}
              <div className="p-4 space-y-3.5">
                {/* Capaian Bintang Latihan */}
                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#6E6258] font-medium block">
                      Capaian Latihan
                    </span>
                    <span className="text-xs font-semibold text-[#261C14]">
                      {isCompleted
                        ? `${getLevelStars(selectedLevelModal.id)} dari 3 Bintang Diraih`
                        : isUnlocked
                        ? 'Belum dikerjakan (0/3 Bintang)'
                        : 'Latihan masih terkunci'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3].map((starIdx) => {
                      const isFilled = starIdx <= getLevelStars(selectedLevelModal.id);
                      return (
                        <div
                          key={starIdx}
                          className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            isFilled
                              ? 'bg-[#FEF7EE] border border-[#F4D3C4]'
                              : 'bg-[#F2ECE4] border border-[#E6DFD5]'
                          }`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isFilled
                                ? 'text-[#D97E26] fill-[#E5A875]'
                                : 'text-[#8C7E72] fill-transparent'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-semibold text-[#6E6258] uppercase tracking-wider">
                    Deskripsi Latihan
                  </h5>
                  <p className="text-xs text-[#261C14] mt-1 leading-relaxed">
                    {selectedLevelModal.deskripsi}
                  </p>
                </div>

                <div className={`p-2.5 rounded-lg border text-xs font-medium transition-colors duration-300 ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#881337]'
                    : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                }`}>
                  <span>Target: <strong>{selectedLevelModal.targetSoal} Soal</strong> Standar Pusmendik Kemendikdasmen RI</span>
                </div>

                {/* Status Penjelasan jika terkunci */}
                {!isUnlocked && (
                  <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs text-[#6E6258] space-y-1">
                    <div className="flex items-start space-x-2">
                      <Lock className="w-4 h-4 text-[#8C7E72] flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold text-[#261C14]">
                          Latihan ini masih terkunci
                        </strong>
                        <p className="mt-0.5 text-[#6E6258] leading-relaxed">
                          Selesaikan Latihan {prevLvl?.level} terlebih dahulu, atau langsung melompat dengan menyelesaikan kuis tantangan.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tombol Aksi */}
                <div className="pt-2 space-y-2">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleStartLatihan(selectedLevelModal)}
                      className={`w-full py-2.5 rounded-lg text-white font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
                        selectedSubject === 'matematika'
                          ? 'bg-[#881337] hover:bg-[#700D2B]'
                          : 'bg-[#047857] hover:bg-[#065F46]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCompleted ? 'Kerjakan Ulang Latihan' : 'Mulai Kerjakan Latihan'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartJumpChallenge(selectedLevelModal)}
                      className="w-full py-2.5 rounded-lg bg-[#D97E26] hover:bg-[#B5671B] text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Lompat ke Latihan Ini (Tantangan)</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedLevelModal(null)}
                    className="w-full py-2 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] font-medium text-xs transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- MODAL 2: TANTANGAN LOMPAT LATIHAN (JUMP CHALLENGE) --- */}
      {jumpChallengeLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1914]/50 backdrop-blur-xs overflow-y-auto">
          <div className={`bg-white rounded-2xl border-2 shadow-xl max-w-lg w-full overflow-hidden relative my-auto ${
            selectedSubject === 'matematika' ? 'border-[#881337]' : 'border-[#047857]'
          }`}>
            {/* Header Tantangan Lompat */}
            <div className={`p-4 text-white relative border-b-2 ${
              selectedSubject === 'matematika' ? 'bg-[#881337] border-[#700D2B]' : 'bg-[#047857] border-[#065F46]'
            }`}>
              <button
                onClick={() => setJumpChallengeLevel(null)}
                className="absolute right-3.5 top-3.5 w-7 h-7 rounded-md hover:bg-[#2D241C] text-[#D4C8BC] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#2D241C] text-[10px] font-semibold text-[#E5A875] border border-[#3D3126] mb-1.5">
                <Zap className="w-3 h-3 fill-current" />
                <span>Tantangan Lompat • {currentSubject?.title}</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Uji Pemahaman: Latihan {jumpChallengeLevel.level} ({jumpChallengeLevel.subjudul})
              </h3>
              <p className="text-xs text-[#D4C8BC] mt-0.5">
                Jawab soal tantangan dengan tepat untuk membuka latihan ini lebih awal.
              </p>
            </div>

            {/* Body Tantangan */}
            <div className="p-4 sm:p-5">
              {jumpFinished ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#E8F2EF] text-[#286657] flex items-center justify-center mx-auto border border-[#C5DDD6]">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#261C14]">
                      Tantangan Berhasil Dituntaskan!
                    </h4>
                    <p className="text-xs text-[#6E6258] max-w-sm mx-auto mt-1 leading-relaxed">
                      Latihan {jumpChallengeLevel.level} ({jumpChallengeLevel.subjudul}) kini resmi <strong>TERBUKA</strong>.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        const target = jumpChallengeLevel;
                        setJumpChallengeLevel(null);
                        handleStartLatihan(target);
                      }}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white font-semibold text-xs transition-all duration-300 cursor-pointer ${
                        selectedSubject === 'matematika'
                          ? 'bg-[#881337] hover:bg-[#700D2B]'
                          : 'bg-[#047857] hover:bg-[#065F46]'
                      }`}
                    >
                      Langsung Kerjakan Latihan
                    </button>
                    <button
                      onClick={() => setJumpChallengeLevel(null)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] font-medium text-xs transition-colors cursor-pointer"
                    >
                      Kembali ke Peta Latihan
                    </button>
                  </div>
                </div>
              ) : (
                (() => {
                  const challengeList = getJumpQuestions(jumpChallengeLevel);
                  const currentQ = challengeList[jumpQuizIndex];
                  if (!currentQ) return null;

                  return (
                    <div className="space-y-3.5">
                      {/* Stepper Progress */}
                      <div className="flex items-center justify-between text-xs font-medium text-[#6E6258] border-b border-[#E6DFD5] pb-2">
                        <span>Soal Tantangan {jumpQuizIndex + 1} dari {challengeList.length}</span>
                        <div className="flex space-x-1">
                          {challengeList.map((_, i) => (
                            <span
                              key={i}
                              className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                                i < jumpQuizIndex
                                  ? selectedSubject === 'matematika'
                                    ? 'bg-[#881337]'
                                    : 'bg-[#047857]'
                                  : i === jumpQuizIndex
                                  ? selectedSubject === 'matematika'
                                    ? 'bg-[#9F1239]'
                                    : 'bg-[#059669]'
                                  : 'bg-[#F2ECE4]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Stimulus jika ada */}
                      {currentQ.stimulus && (
                        <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] text-xs leading-relaxed">
                          <strong className="block text-[#261C14] mb-0.5">Stimulus:</strong>
                          <div dangerouslySetInnerHTML={{ __html: formatMath(currentQ.stimulus) }} />
                        </div>
                      )}

                      {/* Pertanyaan */}
                      <h4
                        className="text-xs sm:text-sm font-semibold text-[#261C14] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMath(currentQ.pertanyaan) }}
                      />

                      {/* Pilihan Jawaban */}
                      <div className="space-y-1.5">
                        {currentQ.pilihan?.map((opt, idx) => {
                          const isSelected = jumpSelectedAnswer === opt;
                          const isWrongSubmitted = jumpHasSubmitted && !jumpIsCorrect && isSelected;

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (isJumpTransitioningRef.current || (jumpHasSubmitted && jumpIsCorrect)) return;
                                setJumpSelectedAnswer(opt);
                                setJumpHasSubmitted(false);
                                setJumpIsCorrect(false);
                                setShowJumpHint(false);
                              }}
                              className={`w-full p-2.5 rounded-lg text-left text-xs font-medium border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                                isWrongSubmitted
                                  ? 'bg-[#FDF1F1] border-[#F4C7C7] text-[#C93B3B]'
                                  : isSelected
                                  ? selectedSubject === 'matematika'
                                    ? 'bg-[#FFF1F2] border-[#881337] text-[#261C14]'
                                    : 'bg-[#ECFDF5] border-[#047857] text-[#261C14]'
                                  : 'bg-white border-[#E6DFD5] text-[#261C14] hover:bg-[#FAF7F2]'
                              }`}
                            >
                              <span dangerouslySetInnerHTML={{ __html: formatMath(opt) }} />
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-semibold transition-all duration-300 ${
                                  isWrongSubmitted
                                    ? 'border-[#C93B3B] bg-[#C93B3B] text-white'
                                    : isSelected
                                    ? selectedSubject === 'matematika'
                                      ? 'border-[#881337] bg-[#881337] text-white'
                                      : 'border-[#047857] bg-[#047857] text-white'
                                    : 'border-[#E6DFD5] text-[#8C7E72]'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Hint jika salah */}
                      {(showJumpHint || (jumpHasSubmitted && !jumpIsCorrect)) && (
                        <div className="p-3 rounded-lg bg-[#FDF1F1] border border-[#F4C7C7] text-[#C93B3B] text-xs flex items-start space-x-2">
                          <HelpCircle className="w-4 h-4 text-[#C93B3B] flex-shrink-0 mt-0.5" />
                          <div>
                            <strong>Jawaban Kurang Tepat</strong>
                            <p className="mt-0.5 text-[#6E6258]">
                              Baca pertanyaan dengan cermat dan coba pilih opsi lain yang sesuai.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Aksi Tombol Bawah */}
                      <div className="pt-2 border-t border-[#E6DFD5] flex items-center justify-between">
                        <button
                          onClick={() => setJumpChallengeLevel(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6E6258] hover:text-[#261C14] cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={
                            jumpHasSubmitted && !jumpIsCorrect
                              ? handleRetryJumpQuestion
                              : handleCheckJumpAnswer
                          }
                          disabled={
                            isJumpTransitioning ||
                            (jumpHasSubmitted && jumpIsCorrect) ||
                            (!jumpHasSubmitted && jumpSelectedAnswer === null)
                          }
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            isJumpTransitioning || (jumpHasSubmitted && jumpIsCorrect)
                              ? 'bg-[#F2ECE4] text-[#8C7E72] cursor-not-allowed'
                              : jumpHasSubmitted && !jumpIsCorrect
                              ? 'bg-[#D97E26] hover:bg-[#B5671B] text-white cursor-pointer'
                              : jumpSelectedAnswer !== null
                              ? selectedSubject === 'matematika'
                                ? 'bg-[#881337] hover:bg-[#700D2B] text-white cursor-pointer'
                                : 'bg-[#047857] hover:bg-[#065F46] text-white cursor-pointer'
                              : 'bg-[#F2ECE4] text-[#8C7E72] cursor-not-allowed'
                          }`}
                        >
                          {isJumpTransitioning || (jumpHasSubmitted && jumpIsCorrect)
                            ? 'Memproses...'
                            : jumpHasSubmitted && !jumpIsCorrect
                            ? 'Coba Lagi'
                            : 'Periksa Jawaban'}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: BUKU PANDUAN CARA BERMAIN --- */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F1914]/50 backdrop-blur-xs animate-fade-in">
          <div className={`bg-white rounded-2xl border-2 shadow-2xl max-w-md w-full overflow-hidden relative ${
            selectedSubject === 'matematika' ? 'border-[#881337]' : 'border-[#047857]'
          }`}>
            <div className={`p-5 text-white border-b-2 relative ${
              selectedSubject === 'matematika' ? 'bg-[#881337] border-[#700D2B]' : 'bg-[#047857] border-[#065F46]'
            }`}>
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute right-4 top-4 w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-base sm:text-lg font-bold flex items-center space-x-2 text-white">
                {selectedSubject === 'matematika' ? (
                  <Calculator className="w-5 h-5 text-rose-200" />
                ) : (
                  <BookOpen className="w-5 h-5 text-emerald-200" />
                )}
                <span>Buku Panduan {currentSubject?.title || 'Latihan'}</span>
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                Aturan & Cara Menuntaskan Latihan Soal {currentSubject?.title || 'TKA SD'}
              </p>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-[#261C14] leading-relaxed">
              <div className="flex items-start space-x-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold flex-shrink-0 text-xs border ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                    : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                }`}>
                  1
                </span>
                <div>
                  <strong className="block text-[#261C14] font-semibold">Posisi Awal Belajar</strong>
                  Hanya <strong>Latihan 1</strong> pada masing-masing mata pelajaran yang terbuka di awal. Latihan selanjutnya masih terkunci.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold flex-shrink-0 text-xs border ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                    : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                }`}>
                  2
                </span>
                <div>
                  <strong className="block text-[#261C14] font-semibold">Membuka Latihan Berurutan</strong>
                  Untuk membuka latihan berikutnya secara bertahap, kerjakan seluruh soal latihan saat ini dan raih nilai memuaskan.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold flex-shrink-0 text-xs border ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                    : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                }`}>
                  3
                </span>
                <div>
                  <strong className="block text-[#261C14] font-semibold">Fitur Tantangan Lompat Latihan</strong>
                  Ingin langsung berlatih di tingkat tertentu? Kamu bisa membuka latihan lebih awal dengan menyelesaikan <strong>Tantangan Kuis</strong>.
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold flex-shrink-0 text-xs border ${
                  selectedSubject === 'matematika'
                    ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                    : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                }`}>
                  4
                </span>
                <div>
                  <strong className="block text-[#261C14] font-semibold">Milestone Peti & Piala Puncak</strong>
                  Kumpulkan 3 bintang di setiap latihan dan buka peti bonus di setiap tahapan, hingga Piala Maestro di puncak latihan terakhir.
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className={`w-full py-2.5 rounded-lg text-white font-semibold text-xs transition-all duration-300 cursor-pointer shadow-xs ${
                    selectedSubject === 'matematika'
                      ? 'bg-[#881337] hover:bg-[#700D2B]'
                      : 'bg-[#047857] hover:bg-[#065F46]'
                  }`}
                >
                  Saya Mengerti, Tutup Panduan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: MILESTONE PETI & PIALA --- */}
      {milestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1914]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E6DFD5] shadow-xl max-w-sm w-full overflow-hidden relative text-center p-5 space-y-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto border ${
                milestoneModal.unlocked
                  ? 'bg-[#FEF7EE] border-[#F4D3C4] text-[#D97E26]'
                  : 'bg-[#F2ECE4] border-[#E6DFD5] text-[#8C7E72]'
              }`}
            >
              {milestoneModal.unlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7E72]">
                Pencapaian Milestone
              </span>
              <h3 className="text-base font-bold text-[#261C14] mt-0.5">{milestoneModal.title}</h3>
              <p className="text-xs text-[#6E6258] mt-1 leading-relaxed">{milestoneModal.desc}</p>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-medium space-y-2">
              {milestoneModal.avatarIds && milestoneModal.avatarIds.length > 0 && (
                <div className="flex items-center justify-center gap-2.5 py-1">
                  {milestoneModal.avatarIds.map((avId) => {
                    const char = getCharacterAvatar(avId);
                    return (
                      <div key={avId} className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-amber-400 overflow-hidden shadow-xs flex items-center justify-center">
                          <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 mt-1 truncate max-w-[85px]">
                          {char.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {milestoneModal.unlocked ? (
                <div className="text-[#286657]">
                  <span>Status: <strong>Terbuka!</strong></span>
                  <div className="text-[11px] text-[#6E6258] mt-0.5">{milestoneModal.reward}</div>
                </div>
              ) : (
                <div className="text-[#6E6258]">
                  <span>Perlu menyelesaikan minimal <strong>{milestoneModal.requiredLevel} Latihan</strong></span>
                  <div className="text-[11px] text-[#8C7E72] mt-0.5">Saat ini: {completedCount} / {milestoneModal.requiredLevel} Selesai</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMilestoneModal(null)}
              className="w-full py-2 rounded-lg bg-[#261C14] hover:bg-[#3D2E24] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL 5: KONFIRMASI RESET PROGRES --- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1914]/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#E6DFD5] shadow-xl max-w-sm w-full p-5 space-y-3.5 text-center">
            <div className="w-10 h-10 rounded-full bg-[#FDF1F1] text-[#C93B3B] flex items-center justify-center mx-auto border border-[#F4C7C7]">
              <RotateCcw className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#261C14]">
                Reset Progres Latihan {currentSubject?.title || ''}?
              </h4>
              <p className="text-xs text-[#6E6258] mt-1 leading-relaxed">
                Tindakan ini akan mengunci kembali Latihan 2 sampai {currentLevels.length} pada mata pelajaran ini, dan mengembalikan status ke Latihan 1 awal.
              </p>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#E6DFD5] text-[#261C14] font-medium text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleResetProgress}
                className="flex-1 py-2 rounded-lg bg-[#C93B3B] hover:bg-[#A92A2A] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatihanSoal;
