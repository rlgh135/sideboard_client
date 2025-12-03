import { useEffect } from "react";
import { useBoardStore } from "../store/useBoardStore"
import type { DropResult } from "@hello-pangea/dnd";

export const useKanban = () => {
    const {
        cards,
        fetchCards,
        setCards,
        moveCardRequest,
        connect,
        disconnect,
        connected
    } = useBoardStore();

    // 1. 초기화 로직 (데이터 로딩 및 소켓 연결)
    useEffect(()=> {
        fetchCards();
        connect();
        return () => disconnect();
    }, []);

    // 2. drag and drop handler (비즈니스 로직)
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        // 2-1. UI 낙관적 업데이트
        const newCards = Array.from(cards);
        // 동일 컬럼 내 이동인지, 다른 컬럼 이동인지에 따라 로직이 달라질 수 있음
        // 현재는 단일 리스트로 우선 처리. 추후 수정.
        const [moveCard] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, moveCard);
        
        // 임시: 컬럼 아이디 변경 반영 (UI상에서만)
        const targetColumnId = Number(destination.droppableId);
        moveCard.columnId = targetColumnId;

        setCards(newCards);

        // 2-2. 서버 전송을 위한 데이터 계산
        const currentCardId = Number(draggableId);
        const targetIndex = destination.index;

        // 정확한 위치 계산을 위해 같은 컬럼에 있는 카드들 중에서 앞뒤를 찾도록 함
        const cardsInTargetColumn = newCards.filter(c => c.columnId === targetColumnId);
        const realTargetIndex = cardsInTargetColumn.findIndex(c => c.id === currentCardId);

        const prevCard = realTargetIndex > 0 ? cardsInTargetColumn[realTargetIndex - 1] : null;
        const nextCard = realTargetIndex < cardsInTargetColumn.length - 1 ? cardsInTargetColumn[realTargetIndex + 1] : null;

        moveCardRequest(
            currentCardId,
            targetColumnId,
            prevCard ? prevCard.id : null,
            nextCard ? nextCard.id : null
        );
    };

    return {
        cards,
        connected,
        onDragEnd,
    };
}