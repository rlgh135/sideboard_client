import { useEffect, useState } from 'react';
import { useBoardStore } from './store/useBoardStore';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { LoginPage } from './components/auth/LoginPage';

function App() {
  const user = useBoardStore((state) => state.user);
  const checkAuth = useBoardStore((state) => state.checkAuth);
  
  // 로딩 상태 (새로고침 시 깜빡임 방지)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 로그인 여부 체크
    checkAuth().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // 로그인이 안 되어 있으면 로그인 페이지 렌더링
  if (!user) {
    return <LoginPage />;
  }

  // 로그인 되어 있으면 보드 렌더링
  return <KanbanBoard />;
}

export default App;