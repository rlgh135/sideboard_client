/**
 * 화면 구성 메인 컨테이너
 */

import { DragDropContext } from '@hello-pangea/dnd';
import { useKanban } from '../../hooks/useKanban';
import { KanbanColumn } from './KanbanColumn';

// 임시 컬럼 정의 (나중에 DB에서 불러옴)
const COLUMNS = [
  { id: 1, title: 'To Do' },
  { id: 2, title: 'In Progress' },
  { id: 3, title: 'Done' },
];

export const KanbanBoard = () => {
  const { cards, onDragEnd, connected } = useKanban();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* 상단 헤더 */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shadow-sm z-10">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          SyncFlow
        </h1>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {connected ? 'Realtime On' : 'Disconnected'}
          </span>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
            + 새 이슈
          </button>
        </div>
      </header>

      {/* 보드 영역 (가로 스크롤) */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full items-start">
            {COLUMNS.map((col) => {
              // 해당 컬럼에 속한 카드만 필터링
              const columnCards = cards.filter(c => c.columnId === col.id);
              
              return (
                <KanbanColumn
                  key={col.id}
                  columnId={col.id}
                  title={col.title}
                  cards={columnCards}
                />
              );
            })}
          </div>
        </DragDropContext>
      </main>
    </div>
  );
};