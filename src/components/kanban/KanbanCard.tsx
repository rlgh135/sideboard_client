/**
 * 개별 카드 컴포넌트
 */
import { Draggable } from "@hello-pangea/dnd";
import type { Card } from "../../store/useBoardStore";

interface Props {
    card: Card;
    index: number;
    onClick: (card: Card) => void;  // 추후 클릭 시 모달 띄울 때 사용
}

export const KanbanCard = ({card, index, onClick}: Props) => {
    return (
        <Draggable draggableId={String(card.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={()=>onClick(card)}
                    className={`
                        p-4 mb-3 rounded-lg border shadow-sm cursor-pointer
                        ${snapshot.isDragging 
                        ? 'bg-blue-50 border-blue-400 shadow-xl scale-105 z-50' 
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                        } 
                        transition-all duration-200
                    `}
                    style={{ ...provided.draggableProps.style }}
                >
                    <div className="font-semibold text-gray-800 mb-1">{card.title}</div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        #{card.id}
                        </span>
                        {/* 나중에 여기에 작성자 프로필이나 댓글 수 아이콘 추가 */}
                    </div>
                </div>
            )}
        </Draggable>
    );
};