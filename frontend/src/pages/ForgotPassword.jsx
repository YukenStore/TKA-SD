import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Button from '../components/Button';
import {
  KeyRound,
  AlertCircle,
  Mail,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Lock,
} from 'lucide-react';

/**
 * Halaman Lupa Password & Reset Password dengan 3 Tahapan Terpisah:
 * 1. Step 'request': Masukkan Username / Email untuk meminta OTP
 * 2. Step 'otp': Verifikasi 6 digit kode OTP (tampilan terpisah selaras Registrasi)
 * 3. Step 'new-password': Atur password baru setelah OTP terverifikasi
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, verifyResetOtp, resetPassword } = useAuth();

  // Step: 'request' | 'otp' | 'new-password'
  const [step, setStep] = useState('request');

  // State Step 1: Input Identitas
  const [identifier, setIdentifier] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // State Step 2: Input Kode OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');

  // State Step 3: Password Baru
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback UI
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Refs untuk 6 kotak input OTP
  const otpInputRefs = useRef([]);

  // Timer hitung mundur untuk kirim ulang OTP
  useEffect(() => {
    let timer;
    if (step === 'otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  // Handler Submit Step 1: Minta Kode OTP Reset
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});

    if (!identifier.trim()) {
      setErrors({ identifier: 'Username atau alamat email wajib diisi.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(identifier.trim());
      setTargetEmail(res.email);
      setMaskedEmail(res.maskedEmail || res.email);
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setStep('otp');

      // Fokuskan ke kotak OTP pertama
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      const errMsg = err.message || 'Gagal mengirimkan kode pemulihan.';
      setServerError(errMsg);
      if (
        errMsg.toLowerCase().includes('tidak ditemukan') ||
        errMsg.toLowerCase().includes('username') ||
        errMsg.toLowerCase().includes('email') ||
        errMsg.toLowerCase().includes('belum diverifikasi')
      ) {
        setErrors({ identifier: errMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Kirim Ulang Kode OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);
    setServerError('');
    try {
      await forgotPassword(targetEmail);
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setServerError(err.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsResending(false);
    }
  };

  // Handler input OTP per-karakter dengan auto-advance
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setServerError('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handler navigasi backspace pada kotak OTP
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handler paste kode OTP 6 digit
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      setServerError('');
      otpInputRefs.current[5]?.focus();
    }
  };

  // Handler Submit Step 2: Verifikasi Kode OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setServerError('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await verifyResetOtp(targetEmail, fullOtp);
      setVerifiedOtp(fullOtp);
      setServerError('');
      setStep('new-password');
    } catch (err) {
      setServerError(err.message || 'Kode OTP tidak valid atau kedaluwarsa.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handler Submit Step 3: Simpan Password Baru
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});

    const formErrors = {};

    if (!newPassword) {
      formErrors.newPassword = 'Password baru wajib diisi.';
    } else if (newPassword.length < 8) {
      formErrors.newPassword = 'Password baru minimal 8 karakter.';
    }

    if (!confirmPassword) {
      formErrors.confirmPassword = 'Konfirmasi password wajib diisi.';
    } else if (newPassword !== confirmPassword) {
      formErrors.confirmPassword = 'Konfirmasi password tidak cocok.';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(targetEmail, verifiedOtp, newPassword);

      // Setelah berhasil, arahkan ke login dengan pesan sukses hijau
      navigate('/', {
        state: {
          message: res.message || 'Password Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru.',
        },
      });
    } catch (err) {
      setServerError(err.message || 'Gagal mereset password. Pastikan kode OTP benar.');
    } finally {
      setIsLoading(false);
    }
  };

  // Teks Header Dinamis Sesuai Step
  const getHeaderInfo = () => {
    switch (step) {
      case 'otp':
        return {
          icon: <Mail className="w-8 h-8" />,
          title: 'Verifikasi Kode OTP',
          subtitle: 'Masukkan 6 digit kode keamanan yang telah dikirim ke email Anda',
        };
      case 'new-password':
        return {
          icon: <Lock className="w-8 h-8" />,
          title: 'Atur Password Baru',
          subtitle: 'Buat kata sandi baru yang aman untuk akun Anda',
        };
      case 'request':
      default:
        return {
          icon: <KeyRound className="w-8 h-8" />,
          title: 'Lupa Password?',
          subtitle: 'Masukkan username atau email akun Anda untuk menerima kode OTP pemulihan',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Header Identitas */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3 p-2 bg-white rounded-2xl shadow-md border border-white/30">
            <img
              src="/logo.png"
              alt="Logo EDU TKA"
              className="h-14 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {headerInfo.title}
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xs mx-auto">
            {headerInfo.subtitle}
          </p>
        </div>

        {/* Card Form Utama */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xl">
          {/* Banner Error Server */}
          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-[#FDF1F1] border border-[#F5C2C2] flex items-start space-x-2.5 text-[#C93B3B] text-sm">
              <AlertCircle className="w-4 h-4 text-[#C93B3B] flex-shrink-0 mt-0.5" />
              <p className="font-medium text-[#A82828]">{serverError}</p>
            </div>
          )}

          {/* STEP 1: INPUT IDENTIFIER */}
          {step === 'request' && (
            <div>
              <form onSubmit={handleRequestSubmit} noValidate>
                <InputField
                  label="Username atau Alamat Email"
                  id="reset-identifier"
                  name="identifier"
                  type="text"
                  placeholder="contoh: siswa123 atau nama@gmail.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errors.identifier) setErrors({});
                    if (serverError) setServerError('');
                  }}
                  error={errors.identifier}
                  required
                  autoComplete="username"
                />

                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isLoading}
                    loadingText="Mengirim Kode OTP..."
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Kirim Kode OTP Pemulihan
                  </Button>
                </div>
              </form>

              {/* Kembali ke Login */}
              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFIKASI KODE OTP (TERPISAH) */}
          {step === 'otp' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Periksa Email Anda</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Kami telah mengirimkan 6 digit kode keamanan ke:
                </p>
                <div className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50/80 rounded-full text-slate-800 font-semibold text-xs mt-2 border border-blue-200">
                  <span>{maskedEmail}</span>
                </div>
              </div>

              {/* Petunjuk Folder Spam/Promosi */}
              <div className="mb-5 p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-left">
                <div className="flex items-start space-x-2.5">
                  <span className="text-base flex-shrink-0">💡</span>
                  <div className="text-xs text-slate-800 leading-relaxed">
                    <p className="font-bold text-[#1E3A8A]">Email belum masuk ke Kotak Masuk?</p>
                    <p className="text-slate-600 mt-0.5">
                      Periksa folder <strong className="text-slate-800">Spam</strong> atau <strong className="text-slate-800">Promosi</strong> di email Anda. Tandai sebagai <em>"Bukan Spam"</em> agar email berikutnya langsung masuk ke Kotak Masuk utama.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerifyOtpSubmit} noValidate>
                {/* 6 Kotak Input OTP */}
                <div className="flex justify-between items-center gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border outline-none transition-colors ${
                        digit
                          ? 'border-[#1E3A8A] bg-blue-50/30 text-slate-900 ring-1 ring-[#1E3A8A]'
                          : 'border-slate-300 bg-white text-slate-800 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isVerifyingOtp}
                  loadingText="Memverifikasi OTP..."
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verifikasi Kode OTP
                </Button>

                {/* Kirim Ulang Kode OTP */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-500 mb-1.5">Tidak menerima kode OTP?</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCountdown > 0 || isResending}
                    className={`inline-flex items-center space-x-1.5 text-xs font-semibold cursor-pointer ${
                      resendCountdown > 0
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-[#1E3A8A] hover:text-[#172554] hover:underline'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCountdown > 0
                        ? `Kirim ulang kode dalam (${resendCountdown}s)`
                        : 'Kirim Ulang Kode OTP'}
                    </span>
                  </button>
                </div>
              </form>

              {/* Kembali ke Step 1 */}
              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request');
                    setServerError('');
                    setErrors({});
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-[#1E3A8A] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah data akun / input ulang</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ATUR PASSWORD BARU (TERPISAH SETELAH OTP DIVERIFIKASI) */}
          {step === 'new-password' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#1E3A8A] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Kata Sandi Baru</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Untuk akun terverifikasi:
                </p>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50/80 rounded-full text-slate-800 font-semibold text-xs mt-2 border border-blue-200">
                  <span>{maskedEmail}</span>
                </div>
              </div>

              <form onSubmit={handleResetSubmit} noValidate>
                {/* Input Password Baru */}
                <InputField
                  label="Password Baru (minimal 8 karakter)"
                  id="reset-newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Buat password baru yang kuat"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                    if (serverError) setServerError('');
                  }}
                  error={errors.newPassword}
                  required
                  showPasswordToggle
                  autoComplete="new-password"
                />

                {/* Konfirmasi Password Baru */}
                <InputField
                  label="Konfirmasi Password Baru"
                  id="reset-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ketik ulang password baru Anda"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    if (serverError) setServerError('');
                  }}
                  error={errors.confirmPassword}
                  required
                  showPasswordToggle
                  autoComplete="new-password"
                />

                <div className="mt-6">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isLoading}
                    loadingText="Menyimpan Password Baru..."
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Simpan Password Baru
                  </Button>
                </div>
              </form>

              {/* Kembali ke Login */}
              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-[#1E3A8A] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-blue-200/70 mt-6">
          &copy; {new Date().getFullYear()} TKA SD. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
