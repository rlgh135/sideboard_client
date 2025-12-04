import { useState, useEffect, useMemo } from 'react'; // useMemo 추가
import { Modal } from '../ui/Modal';
import { useBoardStore } from '../../store/useBoardStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  columnId?: number;
  cardId?: number | null;
}

export const CardModal = ({ isOpen, onClose, columnId = 1, cardId }: Props) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const createCard = useBoardStore((state) => state.createCard);
  const updateCard = useBoardStore((state) => state.updateCard);
  const fetchBoard = useBoardStore((state) => state.fetchBoard);
  
  // [수정] cards를 통째로 flatMap으로 가져오지 말고, columns만 가져옵니다. (참조 안정성 확보)
  const columns = useBoardStore((state) => state.columns);

  // [수정] 컴포넌트 내부에서 연산 (useMemo로 최적화하면 더 좋음)
  const targetCard = useMemo(() => {
    if (!cardId) return null;
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === cardId);
      if (found) return found;
    }
    return null;
  }, [columns, cardId]);

  useEffect(() => {
    if (isOpen && targetCard) {
      setTitle(targetCard.title);
      // 'content' 속성이 타입에 없다면 임시로 any 처리하거나 타입을 맞춰주세요
      setContent((targetCard as any).content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [isOpen, targetCard]); // cardId 대신 targetCard 객체를 의존성으로

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요!');
      return;
    }

    try {
      if (cardId) {
        await updateCard(cardId, title, content);
      } else {
        await createCard(title, content, columnId);
      }
      
      await fetchBoard();
      onClose();
    } catch (e) {
      alert('저장에 실패했습니다.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {cardId ? '카드 수정 ✏️' : '새 이슈 등록 ✨'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="작업 제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-2 h-40 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="상세 내용을 입력하세요..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all active:scale-95"
          >
            {cardId ? '저장하기' : '등록하기'}
          </button>
        </div>
      </div>
    </Modal>
  );
};