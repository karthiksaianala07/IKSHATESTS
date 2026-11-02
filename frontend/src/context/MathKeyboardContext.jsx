import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const MathKeyboardContext = createContext(null);

export function MathKeyboardProvider({ children }) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [activeFieldId, setActiveFieldId] = useState(null);
  
  // Direct reference to the active <math-field> web component
  const activeFieldRef = useRef(null);

  const registerField = useCallback((id, element) => {
    if (activeFieldId === id) {
      activeFieldRef.current = element;
    }
  }, [activeFieldId]);

  const setActiveField = useCallback((id, element) => {
    setActiveFieldId(id);
    activeFieldRef.current = element;
    setIsKeyboardOpen(true);
  }, []);

  const openKeyboard = useCallback(() => {
    setIsKeyboardOpen(true);
  }, []);

  const closeKeyboard = useCallback(() => {
    setIsKeyboardOpen(false);
  }, []);

  // Execute commands directly against the active MathLive field
  const executeMathCommand = useCallback((commandName, arg) => {
    const mf = activeFieldRef.current;
    if (!mf) return;

    // Refocus the mathfield so typing and selection state persist
    if (typeof mf.focus === 'function') {
      mf.focus();
    }

    try {
      if (commandName === 'insert') {
        // MathLive insert with placeholder selection
        if (typeof mf.insert === 'function') {
          mf.insert(arg, {
            mode: 'math',
            selectionMode: 'placeholder',
            format: 'latex'
          });
        } else if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['insert', arg]);
        }
      } else if (commandName === 'keystroke') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['performWithFeedback', arg]);
        }
      } else if (commandName === 'deleteBackward') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['deleteBackward']);
        }
      } else if (commandName === 'deleteForward') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['deleteForward']);
        }
      } else if (commandName === 'clear') {
        if (typeof mf.setValue === 'function') {
          mf.setValue('');
        } else {
          mf.value = '';
        }
        // Dispatch synthetic input event so React state updates
        mf.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (commandName === 'undo') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['undo']);
        }
      } else if (commandName === 'redo') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['redo']);
        }
      } else if (commandName === 'moveLeft') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['moveToPreviousChar']);
        }
      } else if (commandName === 'moveRight') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['moveToNextChar']);
        }
      } else if (commandName === 'moveUp') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['moveToPreviousPlaceholder']);
        }
      } else if (commandName === 'moveDown') {
        if (typeof mf.executeCommand === 'function') {
          mf.executeCommand(['moveToNextPlaceholder']);
        }
      }
    } catch (err) {
      console.warn('MathLive command execution error:', err);
    }
  }, []);

  const value = {
    isKeyboardOpen,
    openKeyboard,
    closeKeyboard,
    activeTab,
    setActiveTab,
    activeFieldId,
    activeFieldRef,
    setActiveField,
    registerField,
    executeMathCommand
  };

  return (
    <MathKeyboardContext.Provider value={value}>
      {children}
    </MathKeyboardContext.Provider>
  );
}

export function useMathKeyboard() {
  const context = useContext(MathKeyboardContext);
  if (!context) {
    throw new Error('useMathKeyboard must be used within a MathKeyboardProvider');
  }
  return context;
}

export default MathKeyboardContext;
