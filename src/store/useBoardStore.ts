import { Client, type IMessage } from "@stomp/stompjs";
import axios from "axios";
import SockJS from "sockjs-client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer"; // Immer 미들웨어 추가
import { api } from "../api/axios";

// 환경 변수 처리 (Vite 기준, 없으면 로컬호스트)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface User {
    id: number;
    email: string;
    nickname: string;
    role: 'MANAGER' | 'MEMBER';
}
export interface Card {
    id: number;
    title: string;
    position: number;
    columnId: number;
}

export interface ColumnData {
    columnId: number;
    title: string;
    cards: Card[];
}

interface BoardState {
    // State
    columns: ColumnData[];
    stompClient: Client | null;
    connected: boolean;
    myUuid: string;

    // 로그인 관련 상태
    user: User | null;

    // Authorization action
    login: (email: string, passwor: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>; // 새로고침 시 로그인 유지 확인

    // Actions
    fetchBoard: () => Promise<void>;
    connect: () => void;
    disconnect: () => void;
    moveCardRequest: (cardId: number, targetColumnId: number, prevCardId: number | null, nextCardId: number | null) => void;
    moveCardOptimistic: (cardId: number, sourceColId: number, destColId: number, sourceIndex: number, destIndex: number) => void;
    createCard: (title: string, content: string, columnId: number) => Promise<void>;
    updateCard: (cardId: number, title: string, content: string) => Promise<void>;

    // Internal Actions (소켓 수신 처리용)
    handleMoveSuccess: (cardId: number, newPosition: number, columnId: number) => void;
    handleError: (message: string) => void;
}

export const useBoardStore = create<BoardState>()(
    immer((set, get) => ({
        columns: [],
        stompClient: null,
        connected: false,
        myUuid: 'user-' + Math.random().toString(36).substr(2, 9),
        user: null,

        fetchBoard: async () => {
            try {
                const response = await axios.get(`${API_URL}/api/board`);
                // Immer를 쓰면 그냥 대입해도 되지만, 통채로 바꿀 땐 set이 편함
                set({ columns: response.data });
                console.log('>>> 보드 데이터 로딩 완료', response.data);
            } catch (error) {
                console.error('보드 데이터 로딩 실패', error);
            }
        },

        connect: () => {
            if (get().stompClient?.active) return;

            const client = new Client({
                webSocketFactory: () => new SockJS(`${API_URL}/ws`),
                
                onConnect: () => {
                    console.log('>>> WebSocket Connected!');
                    set({ connected: true });

                    client.subscribe('/sub/board/1', (message: IMessage) => {
                        const body = JSON.parse(message.body);
                        const { myUuid, handleMoveSuccess, handleError } = get();

                        // 1. 에러 처리
                        if (body.type === 'ERROR') {
                            if (body.clientUuid === myUuid) {
                                handleError(body.message);
                            }
                            return;
                        }

                        // 2. 성공 처리
                        if (body.type === 'SUCCESS') {
                            const { cardId, newPosition, columnId } = body;
                            handleMoveSuccess(cardId, newPosition, columnId);
                        }
                    });

                    // [추가] 에러 메시지 구독 (롤백 로직)
                    client.subscribe('/user/queue/errors', (message) => {
                        const errorMessage = message.body;
                        
                        // 알림 표시
                        alert(`🚫 오류: ${errorMessage}`);
                        
                        // 중요: 에러가 났으므로 서버의 최신 상태(이동 전 상태)를 다시 가져옴
                        get().fetchBoard(); 
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

        login: async (email, password) => {
            try {
                await api.post('/api/login', {email, password});
                await get().checkAuth();
            } catch (error) {
                console.error('로그인 실패', error);
                throw error;
            }
        },

        logout: async () => {
            try {
                await api.post('/api/logout');
                set({ user: null, connected: false, columns: [] });
                get().disconnect();
            } catch (error) {
                console.error('로그아웃 살패', error);
                
            }
        },
        
        checkAuth: async () => {
            try {
                const response = await api.get('/api/me');
                set({ user: response.data });
                get().fetchBoard();
                get().connect();
            } catch (error) {
                set({ user: null });
            }
        },

        moveCardRequest: (cardId, targetColumnId, prevCardId, nextCardId) => {
            const { stompClient, connected, myUuid } = get();
            if (!stompClient || !connected) {
                console.error('Not connected to WebSocket');
                return;
            }

            const payload = {
                cardId,
                targetColumnId,
                prevCardId,
                nextCardId,
                clientUuid: myUuid
            };

            stompClient.publish({
                destination: '/pub/card/move',
                body: JSON.stringify(payload),
            });
        },

        moveCardOptimistic: (cardId, sourceColId, destColId, sourceIndex, destIndex) => {
            set((state) => {
                const sourceCol = state.columns.find(c => c.columnId === sourceColId);
                const destCol = state.columns.find(c => c.columnId === destColId);

                if (!sourceCol || !destCol) return;

                // 1. 출발지에서 카드 꺼내기
                const [movedCard] = sourceCol.cards.splice(sourceIndex, 1);
                
                // 2. 카드 정보 업데이트 (화면상에서만 일단 변경)
                movedCard.columnId = destColId;

                // 3. 목적지에 넣기
                destCol.cards.splice(destIndex, 0, movedCard);
            });
        },

        // 카드 생성
        createCard: async (title, content, columnId) => {
            try {
                await axios.post(`${API_URL}/api/cards`, {
                    title,
                    content,
                    columnId
                });
                console.log('>>> 카드 생성 성공');
            } catch (error) {
                console.error('카드 생성 실패', error);
                throw error; // UI에서 에러 처리를 위해 throw
            }
        },

        // 카드 수정
        updateCard: async (cardId, title, content) => {
            try {
                await axios.put(`${API_URL}/api/cards/${cardId}`, {
                    title,
                    content
                });
                console.log('>>> 카드 수정 성공');
            } catch (error) {
                console.error('카드 수정 실패', error);
                throw error;
            }
        },

        // ✨ 최적화된 상태 업데이트 로직 (Immer 사용으로 간결해짐)
        handleMoveSuccess: (cardId, newPosition, targetColumnId) => {
            set((state) => {
                // 1. 기존 컬럼에서 카드 찾아서 제거 (Draft 상태를 직접 수정 가능)
                let movedCard: Card | undefined;
                
                // for...of 문을 사용하여 찾으면 즉시 break (성능 최적화)
                for (const col of state.columns) {
                    const cardIndex = col.cards.findIndex((c) => String(c.id) === String(cardId));
                    if (cardIndex !== -1) {
                        [movedCard] = col.cards.splice(cardIndex, 1);
                        break; // 찾았으면 루프 종료
                    }
                }

                // 2. 목적지 컬럼에 추가 및 정렬
                if (movedCard) {
                    const destCol = state.columns.find((c) => c.columnId === targetColumnId);
                    if (destCol) {
                        // 카드 정보 업데이트
                        movedCard.position = newPosition;
                        movedCard.columnId = targetColumnId;
                        
                        destCol.cards.push(movedCard);
                        destCol.cards.sort((a, b) => a.position - b.position);
                    }
                }
            });
        },

        handleError: (message) => {
            alert(`⚠️ 실패: ${message}`);
            window.location.reload(); // UX 개선 시 Toast 등으로 변경 권장
        }
    }))
);