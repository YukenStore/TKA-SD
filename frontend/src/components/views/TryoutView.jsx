import React, { useState, useEffect } from 'react';
import { PUSMENDIK_TRYOUT } from '../../data/tryoutData';
import { recordTryout } from '../../utils/activityTracker';
import {
  BookOpen,
  Calculator,
  ArrowLeft,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  RotateCcw,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';

/**
 * Komponen Simulasi Tryout Akbar TKA SD Nasional
 * 
 * Ketentuan:
 * - Mapel: Bahasa Indonesia & Matematika
 * - Total 5 Tryout (Paket 1 - 5)
 * - Standar TKA SD Nasional (30 Soal, 60 Menit)
 * - Tipe kesulitan HOTS, Mudah, Sedang diacak posisinya
 * - Format: Sebagian besar Pilihan Ganda (PG) dan beberapa soal Isian Singkat
 * - Timer hitung mundur, lembar navigasi nomor, skor & pembahasan
 */
const TryoutView = ({ isOpen, onClose }) => {
  const [selectedSubject, setSelectedSubject] = useState(null); // 'bahasa_indonesia' | 'matematika'
  const [activePackage, setActivePackage] = useState(null); // Object paket tryout
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: optionIndex (PG) | text (Isian) }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(3600); // 60 menit = 3600 detik
  const [isExamRunning, setIsExamRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

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

  if (!isOpen) return null;

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
      if (q.tipe === 'isian') {
        // Normalisasi isian (case insensitive & trim)
        if (
          userVal &&
          String(userVal).trim().toLowerCase() === String(q.jawabanBenar).trim().toLowerCase()
        ) {
          correctCount++;
        }
      } else {
        if (userVal === q.jawabanBenar) {
          correctCount++;
        }
      }
    });

    const score = Number(((correctCount / questions.length) * 100).toFixed(1));
    const result = {
      score,
      correctCount,
      totalCount: questions.length,
      wrongCount: questions.length - correctCount,
      timeSpentSeconds: activePackage.durasiMenit * 60 - timeLeftSeconds,
    };

    setScoreResult(result);
    setIsFinished(true);

    // Rekam ke tracker aktivitas
    recordTryout({
      subject: selectedSubject,
      packageNum: activePackage.nomorPaket,
      score,
      correct: correctCount,
      total: questions.length,
      isCompletedAll: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className={`bg-white border-2 rounded-2xl sm:rounded-3xl max-w-4xl w-full min-h-0 sm:min-h-[520px] max-h-[92vh] flex flex-col shadow-2xl text-slate-800 overflow-hidden relative ${
        activePackage && isExamRunning
          ? 'border-[#C25E38]'
          : selectedSubject === 'matematika'
          ? 'border-[#881337]'
          : selectedSubject === 'bahasa_indonesia'
          ? 'border-[#047857]'
          : 'border-slate-300'
      }`}>
        {/* Glow ambient */}
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-[#C25E38]/10 blur-3xl pointer-events-none" />

        {/* 1. Header Bar */}
        <div className={`p-4 sm:p-5 border-b-2 flex items-center justify-between ${
          activePackage && isExamRunning
            ? 'bg-[#FAECE6]/50 border-[#F4D3C4]'
            : selectedSubject === 'matematika'
            ? 'bg-[#FFF1F2]/50 border-[#FECDD3]'
            : selectedSubject === 'bahasa_indonesia'
            ? 'bg-[#ECFDF5]/50 border-[#A7F3D0]'
            : 'bg-slate-50/80 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3">
            {activePackage && !isExamRunning ? (
              <button
                onClick={() => {
                  setActivePackage(null);
                  setIsFinished(false);
                  setIsReviewMode(false);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Pilih Paket Lain"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : selectedSubject && !isExamRunning ? (
              <button
                onClick={() => setSelectedSubject(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Pilih Mapel Lain"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}

            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>🏆 Simulasi Tryout Akbar TKA SD</span>
              </h2>
              <p className="text-xs text-slate-500">
                {activePackage
                  ? `${PUSMENDIK_TRYOUT[selectedSubject].nama} - ${activePackage.namaPaket}`
                  : selectedSubject
                  ? `Pilih Paket Tryout (${PUSMENDIK_TRYOUT[selectedSubject].nama})`
                  : 'Pilih Mata Pelajaran (Bahasa Indonesia / Matematika)'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Timer Display saat ujian berlangsung */}
            {isExamRunning && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-sm bg-[#FAECE6] border-[#F4D3C4] text-[#C25E38]">
                <Clock className="w-3.5 h-3.5 text-[#C25E38] animate-pulse" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {!isExamRunning && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Body Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* TAHAP 1: Pilih Mata Pelajaran (BI / MTK) */}
          {!selectedSubject && (
            <div className="max-w-2xl mx-auto py-6">
              <div className="text-center mb-8">
                <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  Simulasi Ujian Nasional TKA SD
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-3">
                  Pilih Mata Pelajaran Tryout
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Masing-masing mapel memiliki 5 Paket Tryout lengkap berstandar Pusmendik.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div
                  onClick={() => setSelectedSubject('bahasa_indonesia')}
                  className="p-6 rounded-2xl bg-white border-2 border-[#047857] hover:border-[#065F46] transition-all cursor-pointer group hover:scale-[1.02] shadow-md hover:shadow-xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#047857] transition-colors">
                    Tryout Bahasa Indonesia
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    5 Paket Tryout Nasional: 30 Soal (PG & Isian), durasi 60 menit, variasi HOTS & Sedang.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#A7F3D0] flex items-center justify-between text-xs text-[#047857] font-semibold">
                    <span>Pilih Paket 1 s.d. 5</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                <div
                  onClick={() => setSelectedSubject('matematika')}
                  className="p-6 rounded-2xl bg-white border-2 border-[#881337] hover:border-[#700D2B] transition-all cursor-pointer group hover:scale-[1.02] shadow-md hover:shadow-xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] text-[#881337] border border-[#FECDD3] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#881337] transition-colors">
                    Tryout Matematika
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    5 Paket Tryout Nasional: 30 Soal (PG & Isian), durasi 60 menit, penerapan problem solving nyata.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#FECDD3] flex items-center justify-between text-xs text-[#881337] font-semibold">
                    <span>Pilih Paket 1 s.d. 5</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAHAP 2: Pilih dari 5 Paket Tryout */}
          {selectedSubject && !activePackage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Pilihan 5 Paket Tryout {PUSMENDIK_TRYOUT[selectedSubject].nama}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standar TKA SD Nasional: 30 Soal (PG + Isian), 60 Menit.
                </div>
              </div>              {/* Grid 5 Paket Tryout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PUSMENDIK_TRYOUT[selectedSubject].paket.map((pkg) => {
                  const isMath = selectedSubject === 'matematika';
                  return (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-2xl bg-white border-2 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
                        isMath
                          ? 'border-[#881337] hover:border-[#700D2B]'
                          : 'border-[#047857] hover:border-[#065F46]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isMath
                              ? 'bg-[#FFF1F2] text-[#881337] border-[#FECDD3]'
                              : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                          }`}>
                            {pkg.namaPaket}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>60 Menit</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900">
                          Simulasi TKA SD Akbar
                        </h4>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {pkg.totalSoal} Soal campuran tingkat HOTS, Sedang, Mudah (Pilihan Ganda & Isian).
                        </p>
                      </div>

                      <div className={`mt-5 pt-3 border-t ${isMath ? 'border-rose-100' : 'border-emerald-100'}`}>
                        <button
                          onClick={() => handleStartExam(pkg)}
                          className={`w-full py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer ${
                            isMath
                              ? 'bg-[#881337] hover:bg-[#700D2B] shadow-rose-900/20'
                              : 'bg-[#047857] hover:bg-[#065F46] shadow-emerald-700/20'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mulai Tryout Sekarang</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAHAP 3: Ruang Ujian Tryout (Timer 60 Menit, PG + Isian Singkat) */}
          {activePackage && isExamRunning && !isFinished && (() => {
            return (
              <div className="space-y-4">
                {/* Navigator Kotak Nomor Soal (1 - 30) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-[#C25E38]">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="text-slate-600 font-medium">Lembar Navigasi Soal ({activePackage.soal.length} Soal):</span>
                    <span className="font-bold">
                      Terjawab: <strong className="text-[#C25E38]">{Object.keys(userAnswers).length}</strong> / {activePackage.soal.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-2.5 pt-0.5 exam-nav-scrollbar">
                    {activePackage.soal.map((_, idx) => {
                      const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== '';
                      const isCurrent = currentQuestionIndex === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isCurrent
                              ? 'bg-[#C25E38] text-white font-extrabold ring-2 ring-[#FAECE6] shadow'
                              : isAnswered
                              ? 'bg-[#261C14] text-white shadow-sm'
                              : 'bg-white text-slate-700 border border-[#E6DFD5] hover:bg-[#FAECE6] hover:border-[#C25E38]'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kartu Soal Sedang Dibuka */}
                {(() => {
                  const currentQ = activePackage.soal[currentQuestionIndex];
                  const currentAnswer = userAnswers[currentQuestionIndex];

                  return (
                    <div className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#C25E38] shadow-md space-y-4">
                      {/* Header Soal: Nomor, Tipe, & Tingkat Kesulitan Acak */}
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-[#E6DFD5]">
                        <span className="font-bold text-slate-900">
                          Nomor {currentQuestionIndex + 1} dari {activePackage.soal.length}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] border bg-[#FAECE6] text-[#C25E38] border-[#F4D3C4]">
                            Tingkat: {currentQ.kesulitan}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border bg-[#FAECE6] text-[#C25E38] border-[#F4D3C4]">
                            {currentQ.tipe === 'isian' ? 'Isian Singkat' : 'Pilihan Ganda'}
                          </span>
                        </div>
                      </div>

                      {/* Teks Pertanyaan */}
                      <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                        {currentQ.pertanyaan}
                      </h4>

                      {/* Input Jawaban Sesuai Format: PG atau Isian Singkat */}
                      {currentQ.tipe === 'isian' ? (
                        <div className="space-y-2 pt-2">
                          <label className="block text-xs font-medium text-slate-700">
                            Ketik jawaban singkat Anda di bawah ini:
                          </label>
                          <input
                            type="text"
                            value={currentAnswer || ''}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            placeholder="Ketik jawabanmu di sini..."
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#F4D3C4] text-slate-900 text-sm focus:border-[#C25E38] focus:ring-2 focus:ring-[#C25E38]/20 focus:outline-none transition-colors"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2.5 pt-2">
                          {currentQ.pilihan.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              onClick={() => handleAnswerChange(oIdx)}
                              className={`w-full p-3.5 rounded-xl text-left text-xs sm:text-sm font-medium border-2 transition-all flex items-center justify-between cursor-pointer ${
                                currentAnswer === oIdx
                                  ? 'bg-[#FAECE6] border-[#C25E38] text-slate-900 shadow-sm font-semibold'
                                  : 'bg-white border-[#E6DFD5] hover:border-[#C25E38] hover:bg-[#FAECE6]/40 text-slate-700'
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                                  currentAnswer === oIdx
                                    ? 'border-[#C25E38] bg-[#C25E38] text-white'
                                    : 'border-[#E6DFD5] text-[#6E6258] bg-[#FAF7F2]'
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Navigasi Bawah */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 cursor-pointer ${
                            currentQuestionIndex === 0
                              ? 'text-slate-300 bg-slate-50 cursor-not-allowed border-slate-200'
                              : 'text-[#C25E38] hover:bg-[#FAECE6] hover:border-[#C25E38] bg-white border-[#F4D3C4]'
                          }`}
                        >
                          &larr; Sebelumnya
                        </button>

                        <div className="flex items-center space-x-2">
                          {currentQuestionIndex < activePackage.soal.length - 1 ? (
                            <button
                              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                              className="px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer bg-[#C25E38] hover:bg-[#A94D2B]"
                            >
                              Selanjutnya &rarr;
                            </button>
                          ) : null}

                          <button
                            onClick={() => {
                              if (window.confirm('Apakah Anda yakin ingin mengumpulkan lembar jawaban Tryout sekarang?')) {
                                handleFinishExam();
                              }
                            }}
                            className="px-5 py-2 rounded-xl text-white text-xs font-extrabold transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer bg-[#C25E38] hover:bg-[#A94D2B]"
                          >
                            Kumpulkan Ujian 🏁
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* TAHAP 4: Hasil Skor Tryout di Akhir */}
          {activePackage && isFinished && !isReviewMode && (() => {
            return (
              <div className="max-w-md mx-auto py-6 text-center space-y-5 animate-fade-in">
                <div className="w-20 h-20 rounded-3xl text-white flex items-center justify-center mx-auto shadow-xl font-black text-3xl border-2 bg-[#FAECE6] border-[#F4D3C4] text-[#C25E38]">
                  <Trophy className="w-10 h-10 text-[#C25E38]" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C25E38]">
                    Hasil Tryout Nasional
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    Skor {activePackage.namaPaket}
                  </h3>
                </div>

                {/* Skor Card */}
                <div className="p-6 rounded-3xl bg-slate-50 border-2 border-[#C25E38] shadow-md space-y-4">
                  <div className="text-4xl font-extrabold text-slate-900">
                    {scoreResult?.score}
                    <span className="text-sm text-slate-500 font-normal"> / 100</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <span className="block font-bold text-base text-emerald-700">
                        {scoreResult?.correctCount} / {scoreResult?.totalCount}
                      </span>
                      <span>Soal Terjawab Benar</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
                      <span className="block font-bold text-base text-blue-700">
                        {Math.round((scoreResult?.timeSpentSeconds || 0) / 60)} Menit
                      </span>
                      <span>Waktu Pengerjaan</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsReviewMode(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl text-white font-bold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 cursor-pointer bg-[#C25E38] hover:bg-[#A94D2B]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Review & Pembahasan 30 Soal</span>
                  </button>

                  <button
                    onClick={() => handleStartExam(activePackage)}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white border-2 border-[#F4D3C4] text-[#C25E38] text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-[#FAECE6]"
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
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pembahasan 30 Soal {activePackage.namaPaket}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simak solusi langkah demi langkah untuk setiap nomor soal berikut.
                  </p>
                </div>
                <button
                  onClick={() => setIsReviewMode(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                >
                  Kembali ke Skor
                </button>
              </div>

              <div className="space-y-5">
                {activePackage.soal.map((q, idx) => {
                  const userVal = userAnswers[idx];
                  let isCorrect = false;

                  if (q.tipe === 'isian') {
                    isCorrect =
                      userVal &&
                      String(userVal).trim().toLowerCase() === String(q.jawabanBenar).trim().toLowerCase();
                  } else {
                    isCorrect = userVal === q.jawabanBenar;
                  }

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border-2 ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-white">
                            Soal #{idx + 1}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                            {q.kesulitan} • {q.tipe === 'isian' ? 'Isian' : 'PG'}
                          </span>
                        </div>

                        {isCorrect ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Benar</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-rose-600">
                            <XCircle className="w-4 h-4" />
                            <span>Salah</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 mb-3 leading-relaxed whitespace-pre-line">
                        {q.pertanyaan}
                      </h4>

                      {/* Info Jawaban Siswa & Kunci */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1 mb-3">
                        <div>
                          <span className="text-slate-500">Jawaban Anda: </span>
                          <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            {q.tipe === 'isian'
                              ? userVal || '(Tidak dijawab)'
                              : userVal !== undefined
                              ? `${String.fromCharCode(65 + userVal)}. ${q.pilihan[userVal]}`
                              : '(Tidak dijawab)'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Kunci Jawaban: </span>
                          <strong className="text-emerald-700">
                            {q.tipe === 'isian'
                              ? q.jawabanBenar
                              : `${String.fromCharCode(65 + q.jawabanBenar)}. ${q.pilihan[q.jawabanBenar]}`}
                          </strong>
                        </div>
                      </div>

                      {/* Pembahasan */}
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                        <strong className="text-amber-900 flex items-center space-x-1.5 mb-1 font-bold">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pembahasan Soal:</span>
                        </strong>
                        <p className="text-slate-700 leading-relaxed">{q.pembahasan}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryoutView;
