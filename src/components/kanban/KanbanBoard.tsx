import { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';
import { CardModal } from './CardModal';
import { useBoardStore } from '../../store/useBoardStore'; // [추가]

export const KanbanBoard = () => {
  const { columns, onDragEnd, connected } = useKanban();
  
  // [추가] 유저 정보와 로그아웃 함수 가져오기
  const user = useBoardStore((state) => state.user);
  const logout = useBoardStore((state) => state.logout);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const handleCardClick = (cardId: number) => {
    setSelectedCardId(cardId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCardId(null), 200);
  };

  const handleCreateClick = () => {
    setSelectedCardId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* 상단 헤더 */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shadow-sm z-10">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          SyncFlow
        </h1>
        
        <div className="flex items-center gap-4">
          {/* [추가] 사용자 정보 표시 */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-sm font-bold text-gray-700">
              {user?.nickname || 'Guest'}님
            </span>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 rounded-full uppercase tracking-wider">
              {user?.role}
            </span>
          </div>

          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {connected ? 'Live' : 'Off'}
          </span>
          
          {/* [추가] 로그아웃 버튼 */}
          <button 
            onClick={() => logout()}
            className="text-gray-400 hover:text-red-500 text-sm font-semibold transition-colors mr-2"
          >
            로그아웃
          </button>
          
          <button 
            onClick={handleCreateClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            + 새 이슈
          </button>
        </div>
      </header>

      {/* ... 이하 main, CardModal 영역은 기존과 동일 ... */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full items-start gap-6">
            {columns.map((col) => (
              <KanbanColumn
                key={col.columnId}
                columnId={col.columnId}
                title={col.title}
                cards={col.cards}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        </DragDropContext>
      </main>

      <CardModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        columnId={1}
        cardId={selectedCardId}
      />
    </div>
  );
};