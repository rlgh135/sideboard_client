import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';

export const LoginPage = () => {
  const login = useBoardStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      alert('로그인 실패! 이메일과 비밀번호를 확인하세요.');
    }
  };

  // 편의기능: 테스트 계정 자동 입력
  const fillManager = () => { setEmail('manager@test.com'); setPassword('1234'); };
  const fillMember = () => { setEmail('member@test.com'); setPassword('1234'); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">SyncFlow 로그인</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">이메일</label>
            <input
              type="email"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              className="mt-1 w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
            로그인
          </button>
        </form>

        <div className="mt-6 flex gap-2 justify-center">
          <button onClick={fillManager} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">
            매니저 계정 채우기
          </button>
          <button onClick={fillMember} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">
            멤버 계정 채우기
          </button>
        </div>
      </div>
    </div>
  );
};