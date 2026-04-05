import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from "react";

interface PageState {
  loading: boolean;
  error: string | null;
}

interface PageContextValue extends PageState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const PageContext = createContext<PageContextValue | null>(null);

/** Hook 与 Provider 同文件；拆出会过度碎片化 */
// eslint-disable-next-line react-refresh/only-export-components -- see above
export const usePageContext = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("usePageContext must be used within PageProvider");
  }
  return context;
};

interface PageProviderProps {
  children: ReactNode;
}

export const PageProvider: React.FC<PageProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetLoading = useCallback((value: boolean) => {
    setLoading(value);
  }, []);

  const handleSetError = useCallback((value: string | null) => {
    setError(value);
  }, []);

  return (
    <PageContext.Provider
      value={{
        loading,
        error,
        setLoading: handleSetLoading,
        setError: handleSetError,
      }}
    >
      {children}
    </PageContext.Provider>
  );
};
