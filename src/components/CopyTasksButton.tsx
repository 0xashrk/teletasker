import React, { useState, useCallback } from 'react';
import styles from './CopyTasksButton.module.css';

interface Task {
  id: string;
  chatId: string;
  text: string;
  source: string;
  time: string;
  status: 'pending' | 'completed';
  extractedFrom: string;
}

interface CopyTasksButtonProps {
  tasks: Task[];
  selectedChatId: string | null;
}

const CopyTasksButton: React.FC<CopyTasksButtonProps> = ({ tasks, selectedChatId }) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const copyTasksToClipboard = useCallback(() => {
    let tasksToCopy: Task[] = [];
    
    if (selectedChatId) {
      // Copy tasks only from selected chat
      tasksToCopy = tasks.filter(task => task.chatId === selectedChatId);
    } else {
      // Copy all tasks
      tasksToCopy = tasks;
    }
    
    if (tasksToCopy.length === 0) {
      return;
    }
    
    // Format tasks as text
    const formattedTasks = tasksToCopy.map(task => {
      return `Task: ${task.text}\nPriority: ${task.source}\nTime: ${task.time}\nStatus: ${task.status}\nReasoning: ${task.extractedFrom}\n\n`;
    }).join('');
    
    // Copy to clipboard
    navigator.clipboard.writeText(formattedTasks)
      .then(() => {
        // Show success message
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy tasks: ', err);
      });
  }, [selectedChatId, tasks]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <button 
      className={styles.copyButton} 
      onClick={copyTasksToClipboard}
      title="Copy tasks to clipboard"
    >
      {copySuccess ? "✓ Copied!" : "Copy Tasks"}
    </button>
  );
};

export default CopyTasksButton; 