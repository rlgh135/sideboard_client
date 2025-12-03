import axios from "axios";

export const api = axios.create({
    baseURL: 'http://localhost:8080',   // 추후 환경변수로 빼기
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// [TODO] api.interceptors.request.use(...) 로 토큰 주입 로직 추가