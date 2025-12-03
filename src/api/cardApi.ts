import type { Card } from "../store/useBoardStore";
import { api } from "./axios";

export const cardApi = {
    // 목록 조회
    getCards: async (): Promise<Card[]> => {
        const { data } = await api.get<Card[]>('/api/cards');
        return data;
    },

    // 카드 이동
    // (웹소켓을 쓰더라도, HTTP Fallback이나 초기 로딩을 위해 필요할 수 있음. 
    // 현재 구조상 이동은 WebSocket으로 하지만, 게시글 등록 등은 HTTP로 할 예정이므로 미리 구조를 잡습니다.)
}