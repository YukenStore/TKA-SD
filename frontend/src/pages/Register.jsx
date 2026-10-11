import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateRegisterForm } from '../utils/validation';
import { registerUserToLeaderboard } from '../utils/leaderboardData';
import InputField from '../components/InputField';
import Button from '../components/Button';
import {
  GraduationCap,
  AlertCircle,
  UserPlus,
  Mail,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

/**
 * Halaman Pendaftaran Akun dengan Verifikasi OTP 6-Digit (Route "/register")
 */
const Register = () => {
  const navigate = useNavigate();
  const { register, verifyOtp, resendOtp } = useAuth();

  // Step: 'form' (isi data) atau 'otp' (verifikasi 6 digit)
  const [step, setStep] = useState('form');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // State untuk OTP
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'username' && value.includes('@')) {
      setErrors((prev) => ({
        ...prev,
        username: 'Username tidak boleh berupa alamat email (jangan sertakan tanda @).',
      }));
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (serverError) {
      setServerError('');
    }
  };

  // Submit Step 1: Pendaftaran Akun
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validation = validateRegisterForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.username, formData.email, formData.password);
      if (formData.username) {
        registerUserToLeaderboard(formData.username);
      }

      setRegisteredEmail(formData.email);
      setResendCountdown(60);
      setStep('otp');
      // Otomatis fokus ke kotak pertama setelah beralih ke layar OTP
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      const errMsg = err.message || 'Maaf, belum bisa melakukan registrasi.';
      setServerError(errMsg);

      // Berikan warna merah dan pesan error pada kolom/field spesifik
      if (err.field === 'username' || errMsg.toLowerCase().includes('username')) {
        setErrors((prev) => ({
          ...prev,
          username: errMsg.includes('sudah digunakan')
            ? 'Username sudah digunakan. Silakan pilih username lain.'
            : errMsg,
        }));
      } else if (err.field === 'email' || errMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({
          ...prev,
          email: errMsg,
        }));
      } else if (err.field === 'password' || errMsg.toLowerCase().includes('password')) {
        setErrors((prev) => ({
          ...prev,
          password: errMsg,
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler input OTP per-karakter dengan auto-advance
  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Hanya angka

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Ambil karakter terakhir jika diketik ganda
    setOtpDigits(newDigits);
    setOtpError('');

    // Jika mengisi angka dan belum di kotak terakhir, pindah ke kotak berikutnya
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handler navigasi tombol backspace pada OTP
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handler paste kode OTP 6 digit langsung
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      setOtpError('');
      otpInputRefs.current[5]?.focus();
    }
  };

  // Submit Step 2: Verifikasi OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setOtpError('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyOtp(registeredEmail, fullOtp);

      // Daftarkan username ke leaderboard
      if (formData.username) {
        registerUserToLeaderboard(formData.username);
      }

      // Alur penting: setelah verifikasi berhasil, arahkan ke halaman Login dengan pesan sukses
      navigate('/', {
        state: {
          message: response.message || 'Verifikasi berhasil! Silakan login dengan akun baru Anda.',
        },
      });
    } catch (err) {
      setOtpError(err.message || 'Kode OTP tidak valid atau kedaluwarsa.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handler Kirim Ulang OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);
    setOtpError('');
    try {
      await resendOtp(registeredEmail);
      setResendCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setOtpError(err.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsResending(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
            {step === 'form' ? 'Daftar Akun TKA SD' : 'Verifikasi Akun'}
          </h1>
          <p className="text-teal-50/90 text-sm mt-1 font-medium">
            {step === 'form'
              ? 'Buat akun baru untuk mulai latihan Tes Kemampuan Akademik'
              : `Kode verifikasi telah dikirimkan ke email Anda`}
          </p>
        </div>

        {/* Card Form Utama */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xl">
          {/* STEP 1: FORMULIR PENDAFTARAN */}
          {step === 'form' && (
            <div>
              {serverError && (
                <div className="mb-5 p-3 rounded-lg bg-[#FDF1F1] border border-[#F5C2C2] flex items-start space-x-2.5 text-[#C93B3B] text-sm">
                  <AlertCircle className="w-4 h-4 text-[#C93B3B] flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-[#A82828]">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} noValidate>
                <InputField
                  label="Username / Nama Panggilan"
                  id="register-username"
                  name="username"
                  type="text"
                  placeholder="contoh: siswa123 atau siswa_sd"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors.username}
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                />

                <InputField
                  label="Alamat Email"
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="contoh: siswa@sekolah.id atau nama@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  autoComplete="email"
                />

                <InputField
                  label="Password (minimal 8 karakter)"
                  id="register-password"
                  name="password"
                  type="password"
                  placeholder="Buat password yang kuat"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  showPasswordToggle
                  autoComplete="new-password"
                />

                <InputField
                  label="Konfirmasi Password"
                  id="register-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ketik ulang password Anda"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                    loadingText="Mengirim Kode OTP..."
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Daftar Sekarang
                  </Button>
                </div>
              </form>

              {/* Link ke Login */}
              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600">
                  Sudah punya akun?{' '}
                  <Link
                    to="/"
                    className="font-bold text-[#1E3A8A] hover:text-[#172554] hover:underline"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: VERIFIKASI KODE OTP 6 DIGIT */}
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
                  <span>{registeredEmail}</span>
                </div>
              </div>

              {otpError && (
                <div className="mb-5 p-3 rounded-lg bg-[#FDF1F1] border border-[#F5C2C2] text-[#C93B3B] text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#C93B3B] flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

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
                  isLoading={isVerifying}
                  loadingText="Memverifikasi OTP..."
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verifikasi & Aktifkan Akun
                </Button>

                {/* Kirim Ulang Kode OTP */}
                <div className="mt-5 text-center">
                  <p className="text-xs text-slate-500 mb-2">Tidak menerima kode verifikasi?</p>
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

              {/* Kembali ke Step 1 (Ubah Email) */}
              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setOtpError('');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-[#1E3A8A] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah alamat email atau data pendaftaran</span>
                </button>
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

export default Register;

