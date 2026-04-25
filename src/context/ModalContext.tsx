import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    resolve?: (value: boolean) => void;
}

interface ToastState {
    show: boolean;
    message: string;
    title: string;
}

interface ModalContextType {
    showAlert: (message: string, title?: string) => Promise<void>;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
    showToast: (message: string, title?: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        title: '',
        message: '',
        type: 'alert',
    });

    const [toast, setToast] = useState<ToastState>({
        show: false,
        message: '',
        title: '',
    });

    const showAlert = useCallback((message: string, title: string = 'Notification'): Promise<void> => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                title,
                message,
                type: 'alert',
                resolve: () => resolve(),
            });
        });
    }, []);

    const showConfirm = useCallback((message: string, title: string = 'Confirmation'): Promise<boolean> => {
        return new Promise((resolve) => {
            setModal({
                isOpen: true,
                title,
                message,
                type: 'confirm',
                resolve,
            });
        });
    }, []);

    const showToast = useCallback((message: string, title: string = 'Success') => {
        setToast({ show: true, message, title });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 2000);
    }, []);

    const handleClose = (result: boolean) => {
        if (modal.resolve) {
            modal.resolve(result as any);
        }
        setModal((prev) => ({ ...prev, isOpen: false, resolve: undefined }));
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showToast }}>
            {children}

            {/* Modal UI */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-base-content/20 backdrop-blur-md transition-all duration-300">
                    <div className="surface-elevated max-w-md w-full overflow-hidden transform animate-in zoom-in-95 duration-300 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)]">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${modal.type === 'confirm' ? 'bg-secondary/10 text-secondary' :
                                    modal.title.toLowerCase().includes('error') ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                                    }`}>
                                    {modal.type === 'confirm' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black tracking-tight text-base-content">
                                    {modal.title}
                                </h3>
                            </div>
                            <p className="text-secondary-content leading-relaxed font-medium">
                                {modal.message}
                            </p>
                        </div>
                        <div className="bg-base-200/50 p-6 flex justify-end gap-3 border-t border-base-300/50">
                            {modal.type === 'confirm' && (
                                <button
                                    onClick={() => handleClose(false)}
                                    className="px-6 py-3 rounded-xl text-secondary-content hover:bg-base-300 transition-colors font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={() => handleClose(true)}
                                className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${modal.type === 'confirm' ? 'bg-secondary hover:bg-secondary/90 shadow-secondary/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                                    }`}
                            >
                                {modal.type === 'confirm' ? 'Confirm Action' : 'Acknowledge'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast UI */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[10001] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}>
                <div className="surface-elevated px-8 py-5 flex items-center gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-primary/20 backdrop-blur-xl bg-base-100/90 rounded-[24px]">
                    <div className="w-10 h-10 rounded-xl bg-success/20 text-success flex items-center justify-center shrink-0 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary">{toast.title}</h4>
                        <p className="text-xs font-bold text-secondary-content/80 mt-0.5">{toast.message}</p>
                    </div>
                </div>
            </div>
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

