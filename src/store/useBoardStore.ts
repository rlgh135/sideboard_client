import { Client, type IMessage } from "@stomp/stompjs";
import axios from "axios";
import SockJS from "sockjs-client";
import { create } from "zustand";

export interface Card {
    id: number;
    title: string;
    position: number;
    columnId: number;
}

interface BoardState {
    cards: Card[];
    stompClient: Client | null;
    connected: boolean;
    myUuid: string;

    setCards: (cards: Card[]) => void;
    connect: () => void;
    disconnect: () => void;
    moveCardRequest: (cardId: number, targetColumnId: number, prevCardId: number | null, nextCardId: number | null) => void;
    fetchCards: () => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    cards: [],
    stompClient: null,
    connected: false,
    myUuid: 'user-' + Math.random().toString(36).substr(2, 9),

    setCards: (cards) => set({ cards }),

    fetchCards: async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/cards');
            set({ cards: response.data });
            console.log('>>> 카드 목록 로딩 완료', response.data);
        } catch (error) {
            console.error('카드 목록 불러오기 실패', error);
        }
    },

    connect: () => {
        if (get().stompClient?.active) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            
            onConnect: () => {
                console.log('>>> WebSocket Connected!');
                set({ connected: true });

                client.subscribe('/sub/board/1', (message: IMessage) => {
                    const body = JSON.parse(message.body);

                    if (body.type === 'ERROR') {
                        if (body.clientUuid === get().myUuid) {
                            alert(`⚠️ 실패: ${body.message}`);
                            window.location.reload();
                        }
                        return;
                    }

                    if (body.type === 'SUCCESS') {
                        const { cardId, newPosition, columnId } = body;
                        
                        // [디버깅 로그] 메시지 수신 확인
                        console.log(`>>> [Sync] 수신: ID(${cardId}) -> NewPos(${newPosition})`);

                        set((state) => {
                            const currentCards = [...state.cards];
                            
                            // [수정 핵심 1] String으로 변환해서 안전하게 비교
                            const targetIndex = currentCards.findIndex(c => String(c.id) === String(cardId));
                            
                            if (targetIndex !== -1) {
                                console.log(`>>> [Sync] 업데이트 적용: ${currentCards[targetIndex].title}`);
                                
                                currentCards[targetIndex] = {
                                    ...currentCards[targetIndex],
                                    position: newPosition,
                                    columnId: columnId
                                };
                                
                                // 위치 기준 재정렬
                                currentCards.sort((a, b) => a.position - b.position);
                            } else {
                                console.warn(`>>> [Sync] 경고: 카드 ID(${cardId})를 찾을 수 없습니다! 현재 목록:`, currentCards);
                            }
                            
                            return { cards: currentCards };
                        });
                    }
                });
            },
            onDisconnect: () => {
                console.log('Disconnected');
                set({ connected: false });
            },
        });

        client.activate();
        set({ stompClient: client });
    },

    disconnect: () => {
        get().stompClient?.deactivate();
        set({ connected: false, stompClient: null });
    },

    moveCardRequest: (cardId, targetColumnId, prevCardId, nextCardId) => {
        const client = get().stompClient;
        if (!client || !client.active) {
            console.error('Not connected to WebSocket');
            return;
        }

        const payload = {
            cardId,
            targetColumnId,
            prevCardId,
            nextCardId,
            clientUuid: get().myUuid
        };

        client.publish({
            destination: '/pub/card/move',
            body: JSON.stringify(payload),
        });
    },
}));