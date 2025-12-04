/**
 * Droppable 영역을 담당하는 컴포넌트
 */

import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';
import type { Card } from '../../store/useBoardStore'; // Card 타입 import 경로 주의

interface Props {
  columnId: number;
  title: string;
  cards: Card[];
  // [추가] 클릭 이벤트 핸들러 받기
  onCardClick: (cardId: number) => void;
}

export const KanbanColumn = ({ columnId, title, cards, onCardClick }: Props) => {
  return (
    <div className="flex flex-col w-80 min-w-[320px] bg-gray-100/80 rounded-xl p-4 mr-6 h-full max-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-bold text-gray-700 text-lg">{title}</h2>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
          {cards.length}
        </span>
      </div>

      <Droppable droppableId={String(columnId)}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`
              flex-1 overflow-y-auto px-1 py-1 custom-scrollbar
              ${snapshot.isDraggingOver ? 'bg-blue-100/50 rounded-lg transition-colors' : ''}
            `}
          >
            {cards.map((card, index) => (
              <KanbanCard 
                key={card.id} 
                card={card} 
                index={index} 
                // [수정] 클릭 시 ID 전달
                onClick={() => onCardClick(card.id)} 
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};