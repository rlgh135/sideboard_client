/**
 * Droppable 영역을 담당하는 컴포넌트
 */

import { Droppable } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import type { Card } from "../../store/useBoardStore";

interface Props {
  columnId: number;
  title: string;
  cards: Card[];
}

export const KanbanColumn = ({ columnId, title, cards }: Props) => {
  return (
    <div className="flex flex-col w-80 min-w-[320px] bg-gray-100/80 rounded-xl p-4 mr-6 h-full max-h-[calc(100vh-120px)]">
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-bold text-gray-700 text-lg">{title}</h2>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
          {cards.length}
        </span>
      </div>

      {/* 드롭 영역 */}
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
                onClick={(c) => console.log('Open Modal', c)} 
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};