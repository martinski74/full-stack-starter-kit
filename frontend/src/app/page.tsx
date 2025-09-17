'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from './utils/toast';

const LoginPage = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
        setMessage(data.message);
        localStorage.setItem('auth_token', data.token);
        addToast('Влязохте успешно.', 'success');
        router.push('/dashboard');
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
            Влезте в корпоративната платформа за AI инструменти
          </p>
        </div>
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
        <div className="text-center text-sm" style={{ color: '#5e6b8c' }}>
          Нямате акаунт?{' '}
          <a href="#" className="font-medium hover:underline" style={{ color: '#4a69ff' }}>
            Регистрирайте се
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
