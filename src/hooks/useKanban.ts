import { useEffect } from "react";
import { useBoardStore, type Card } from "../store/useBoardStore";
import type { DropResult } from "@hello-pangea/dnd";

export const useKanban = () => {
    const {
        columns, // cards 대신 columns 사용
        fetchBoard,
        moveCardRequest,
        moveCardOptimistic, // [추가] Store에서 만든 액션
        connect,
        disconnect,
        connected
    } = useBoardStore();

    useEffect(() => {
        fetchBoard();
        connect();
        return () => disconnect();
    }, []);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // 1. 유효성 검사
        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) return;

        // ID 변환 (라이브러리는 string으로 줌)
        const currentCardId = Number(draggableId);
        const sourceColId = Number(source.droppableId);
        const destColId = Number(destination.droppableId);

        // 2. UI 낙관적 업데이트 (Store 액션 호출)
        moveCardOptimistic(
            currentCardId,
            sourceColId,
            destColId,
            source.index,
            destination.index
        );

        // 3. 서버 전송을 위한 위치 계산 (prev, next 찾기)
        // 주의: 이미 UI는 업데이트(이동)된 상태라고 가정하거나, 
        // 이동할 위치(destination.index)를 기준으로 가상의 앞뒤 카드를 찾아야 합니다.
        
        // 목적지 컬럼의 카드 리스트 가져오기 (Store 상태는 비동기일 수 있으므로 columns에서 직접 찾음)
        const destColumn = columns.find(c => c.columnId === destColId);
        if (!destColumn) return;

        // 이동 시뮬레이션을 위한 임시 배열 생성
        const targetCards = [...destColumn.cards];
        
        // (같은 컬럼 이동인 경우, 기존 위치에서 제거 후 시뮬레이션해야 정확한 인덱스가 나옴)
        if (sourceColId === destColId) {
            const [removed] = targetCards.splice(source.index, 1);
            targetCards.splice(destination.index, 0, removed);
        } else {
            // (다른 컬럼 이동인 경우, 현재 리스트에 '들어갈 자리'를 봄)
            // 실제 객체는 없어도 인덱스 계산을 위해 빈 객체나 더미를 넣었다고 가정해도 됨
            // 하지만 여기서는 간단히 'destination.index' 기준으로 앞뒤만 보면 됨
            
            // 다른 컬럼에서 넘어왔다면 targetCards에는 아직 해당 카드가 없음 (낙관적 업데이트 전 상태의 columns라면)
            // 따라서 targetCards 배열에 끼어들었다고 가정하고 앞뒤를 찾습니다.
        }

        /* [중요] 낙관적 업데이트와 별개로, '어디로 들어가는지'만 알면 앞뒤 카드를 알 수 있습니다.
           목적지 컬럼(업데이트 전)의 cards 배열을 기준으로:
           - index 자리에 들어가면, index-1이 prev, index가 next가 됩니다.
        */
        
        const cardsInDest = destColumn.cards; // (주의: 낙관적 업데이트가 Store에 반영되기 전의 스냅샷일 수 있음)
        
        let prevCard: Card | null = null;
        let nextCard: Card | null = null;

        if (sourceColId === destColId) {
            // 같은 컬럼 이동: 배열에서 뺐다가 다시 끼워넣은 결과로 계산 필요
            const tempList = [...cardsInDest];
            const [moved] = tempList.splice(source.index, 1);
            tempList.splice(destination.index, 0, moved);
            
            prevCard = tempList[destination.index - 1] || null;
            nextCard = tempList[destination.index + 1] || null;
        } else {
            // 다른 컬럼 이동: cardsInDest 배열의 destination.index 위치에 '끼어듦'
            // 들어갈 자리(destination.index)의 바로 앞이 prev
            prevCard = cardsInDest[destination.index - 1] || null;
            // 들어갈 자리(destination.index)에 원래 있던 녀석이 next로 밀려남
            nextCard = cardsInDest[destination.index] || null;
        }

        // 4. 서버로 요청 전송
        moveCardRequest(
            currentCardId,
            destColId,
            prevCard ? prevCard.id : null,
            nextCard ? nextCard.id : null
        );
    };

    return {
        columns, // Board 컴포넌트에서 렌더링하기 위해 columns 반환
        connected,
        onDragEnd,
    };
};