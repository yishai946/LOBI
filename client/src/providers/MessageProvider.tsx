import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

type MessageSeverity = 'success' | 'error' | 'info' | 'warning';

type MessageState = {
  open: boolean;
  text: string;
  severity: MessageSeverity;
};

type MessageContextType = {
  showMessage: (_text: string, _severity?: MessageSeverity) => void;
  showSuccess: (_text: string) => void;
  showError: (_text: string) => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: '',
    severity: 'info',
  });

  const showMessage = useCallback((text: string, severity: MessageSeverity = 'info') => {
    setMessage({ open: true, text, severity });
  }, []);

  const showSuccess = useCallback(
    (text: string) => {
      showMessage(text, 'success');
    },
    [showMessage]
  );

  const showError = useCallback(
    (text: string) => {
      showMessage(text, 'error');
    },
    [showMessage]
  );

  const handleClose = useCallback(() => {
    setMessage((prev) => ({ ...prev, open: false }));
  }, []);

  const contextValue = useMemo(
    () => ({
      showMessage,
      showSuccess,
      showError,
    }),
    [showMessage, showSuccess, showError]
  );

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={message.open}
        autoHideDuration={2000}
        onClose={handleClose}
        sx={{ bottom: { xs: 90, sm: 80 } }}
      >
        <Alert onClose={handleClose} severity={message.severity} variant="filled">
          {message.text}
        </Alert>
      </Snackbar>
    </MessageContext.Provider>
  );
};

export const useGlobalMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useGlobalMessage must be used within a MessageProvider');
  }

  return context;
};
