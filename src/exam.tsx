// Active-exam context. Holds which exam (PSTAR / ROC-A) is being studied,
// persists the choice, and exposes a dataset-bound API via `useExam()`.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeExamApi, type ExamApi } from './data';
import { EXAMS, isExamId, type ExamId, type ExamMeta } from './exams';

const EXAM_KEY = 'pstar:exam:v1';
const DEFAULT_EXAM: ExamId = 'pstar';

type ExamContextValue = {
  id: ExamId;
  meta: ExamMeta;
  api: ExamApi;
  setExam: (id: ExamId) => void;
};

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<ExamId>(DEFAULT_EXAM);

  // Restore the previously selected exam on launch.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(EXAM_KEY)
      .then((v) => {
        if (active && isExamId(v)) setId(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setExam = useCallback((next: ExamId) => {
    setId(next);
    AsyncStorage.setItem(EXAM_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<ExamContextValue>(() => {
    const meta = EXAMS[id];
    return {
      id,
      meta,
      setExam,
      api: makeExamApi({ dataset: meta.dataset, examSize: meta.examSize, passPct: meta.passPct }),
    };
  }, [id, setExam]);

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

function useExamContext(): ExamContextValue {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam outside ExamProvider');
  return ctx;
}

// Primary hook used by screens: dataset-bound helpers plus the active id + meta.
export function useExam(): ExamApi & { id: ExamId; meta: ExamMeta } {
  const { api, id, meta } = useExamContext();
  return { ...api, id, meta };
}

// Just the active exam id (cheaper subscription for the storage layer).
export function useExamId(): ExamId {
  return useExamContext().id;
}

export function useSetExam(): (id: ExamId) => void {
  return useExamContext().setExam;
}
