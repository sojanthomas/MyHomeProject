import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { CreateExpenseInput, UpdateExpenseInput } from '../types';
import styles from './ExpenseForm.module.css';

interface ExpenseFormProps {
  onSubmit: (data: CreateExpenseInput | UpdateExpenseInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: UpdateExpenseInput;
  onCancel?: () => void;
}

export const ExpenseForm: FC<ExpenseFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  onCancel,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(
    initialData?.amount ? initialData.amount.toString() : ''
  );
  const [scheduled, setScheduled] = useState(initialData?.scheduled || false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.amount ? initialData.amount.toString() : '');
      setScheduled(initialData.scheduled || false);
    } else {
      setTitle('');
      setAmount('');
      setScheduled(false);
    }
    setError(null);
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter the expense title');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await onSubmit({
        title,
        amount: parseFloat(amount),
        scheduled,
      });

      if (!initialData) {
        setTitle('');
        setAmount('');
        setScheduled(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.feedback}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h5 className={styles.title}>Please enter your expense</h5>
        
        <div className={styles.inputGroup}>
          <input
            type="text"
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Expense title"
            disabled={isLoading}
          />
        </div>

        <h5 className={styles.title}>Please enter expense amount</h5>
        <div className={styles.inputGroup}>
          <input
            type="number"
            className={styles.input}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="any"
            placeholder="0.00"
            disabled={isLoading}
          />
        </div>

        <h5 className={styles.title}>Scheduled</h5>
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={scheduled}
            onChange={(e) => setScheduled(e.target.checked)}
            disabled={isLoading}
            id="scheduled-checkbox"
          />
          <label htmlFor="scheduled-checkbox" className={styles.label}>
            Mark as scheduled
          </label>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}
          </button>
          {onCancel && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
