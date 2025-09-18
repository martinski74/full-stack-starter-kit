'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from './utils/toast';

const LoginPage = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showTwoFactorInput, setShowTwoFactorInput] = useState<boolean>(false); // New state for 2FA
  const [twoFactorCode, setTwoFactorCode] = useState<string>(''); // New state for 2FA code
  const [twoFactorUserId, setTwoFactorUserId] = useState<number | null>(null); // New state for 2FA user ID
  const [twoFactorUserEmail, setTwoFactorUserEmail] = useState<string | null>(null); // New state for 2FA user email
  const router = useRouter();
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:8201/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (response.status === 202) {
          setMessage(data.message);
          setShowTwoFactorInput(true);
          setTwoFactorUserId(data.user_id);
          setTwoFactorUserEmail(data.email);
          addToast('Проверете имейла си за код за двуфакторна автентикация.', 'info');
        } else {
          // Original successful login without 2FA (should not happen with current backend logic)
          setMessage(data.message);
          localStorage.setItem('auth_token', data.token);
          addToast('Влязохте успешно.', 'success');
          router.push('/dashboard');
        }
      } else {
        const msg = data.message || `Login failed: ${response.status} ${response.statusText}`;
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err) {
      const msg = 'Мрежова грешка или недостъпен сървър.';
      setError(msg);
      addToast(msg, 'error');
      console.error('Network error during login:', err);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (twoFactorUserId === null) {
      addToast('Няма идентификатор на потребител за 2FA.', 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8201/api/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: twoFactorUserId, two_factor_code: twoFactorCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        localStorage.setItem('auth_token', data.token);
        addToast('Двуфакторната автентикация е успешна.', 'success');
        router.push('/dashboard');
      } else {
        const msg = data.message || `2FA verification failed: ${response.status} ${response.statusText}`;
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err) {
      const msg = 'Мрежова грешка или недостъпен сървър.';
      setError(msg);
      addToast(msg, 'error');
      console.error('Network error during 2FA verification:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      const msg = 'Паролите не съвпадат.';
      setError(msg);
      addToast(msg, 'error');
      return;
    }

    try {
      const response = await fetch('http://localhost:8201/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, password_confirmation: confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        localStorage.setItem('auth_token', data.token);
        addToast('Регистрацията беше успешна.', 'success');
        router.push('/dashboard');
      } else {
        const msg = data.message || `Registration failed: ${response.status} ${response.statusText}`;
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err) {
      const msg = 'Мрежова грешка или недостъпен сървър.';
      setError(msg);
      addToast(msg, 'error');
      console.error('Network error during registration:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f2f5f9' }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <span className="text-2xl">⚡</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold" style={{ color: '#2d3b8f' }}>
            AI Tools Platform
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#5e6b8c' }}>
            {isRegistering ? 'Създайте нов акаунт' : showTwoFactorInput ? 'Въведете кода за двуфакторна автентикация' : 'Влезте в корпоративната платформа за AI инструменти'}
          </p>
        </div>
        {!isRegistering ? (
          showTwoFactorInput ? (
            <form className="mt-2 space-y-5" onSubmit={handleTwoFactorSubmit}>
              <div>
                <label htmlFor="two-factor-code" className="sr-only">Код за 2FA</label>
                <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Код за двуфакторна автентикация (изпратен на {twoFactorUserEmail})</p>
                <input
                  id="two-factor-code"
                  name="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  autoComplete="one-time-code"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Въведете 6-цифрен код"
                  value={twoFactorCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwoFactorCode(e.target.value)}
                  maxLength={6}
                />
              </div>
              {error && <p className="text-center text-sm text-red-600">{error}</p>}
              {message && <p className="text-center text-sm text-green-600">{message}</p>}
              <button
                type="submit"
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                style={{ background: 'linear-gradient(90deg, #4a69ff, #7a5dff)' }}
              >
                Потвърдете 2FA
              </button>
            </form>
          ) : (
            <form className="mt-2 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-address" className="sr-only">Email</label>
                <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Email</p>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Парола</label>
                <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Парола</p>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder=""
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-center text-sm text-red-600">{error}</p>}
              {message && <p className="text-center text-sm text-green-600">{message}</p>}

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                style={{ background: 'linear-gradient(90deg, #4a69ff, #7a5dff)' }}
              >
                Влизане
              </button>
            </form>
          )
        ) : (
          <form className="mt-2 space-y-5" onSubmit={handleRegister}>
            <div>
              <label htmlFor="name" className="sr-only">Име</label>
              <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Име</p>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Вашето име"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Email</p>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Парола</label>
              <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Парола</p>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder=""
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Потвърдете паролата</label>
              <p className="text-sm font-medium mb-2" style={{ color: '#333' }}>Потвърдете паролата</p>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder=""
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            {message && <p className="text-center text-sm text-green-600">{message}</p>}

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              style={{ background: 'linear-gradient(90deg, #4a69ff, #7a5dff)' }}
            >
              Регистрация
            </button>
          </form>
        )}
        <div className="text-center text-sm" style={{ color: '#5e6b8c' }}>
          {isRegistering ? 'Вече имате акаунт?' : 'Нямате акаунт?'}{' '}
          <a
            href="#"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null); // Clear errors when switching forms
              setMessage(null); // Clear messages when switching forms
            }}
            className="font-medium hover:underline" style={{ color: '#4a69ff' }}
          >
            {isRegistering ? 'Влезте' : 'Регистрирайте се'}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
