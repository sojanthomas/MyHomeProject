import { useState } from 'react';
import type { FC } from 'react';
import styles from './BudgetForm.module.css';

interface BudgetFormProps {
  onSubmit: (amount: number) => Promise<void>;
  isLoading?: boolean;
  initialValue?: number;
}

export const BudgetForm: FC<BudgetFormProps> = ({
  onSubmit,
  isLoading = false,
  initialValue = 0,
}) => {
  const [amount, setAmount] = useState(initialValue.toString());
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      setError('Please enter a valid budget amount');
      return;
    }

    try {
      await onSubmit(parseFloat(amount));
      if (initialValue === 0) {
        setAmount('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
    }
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.feedback}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h5 className={styles.title}>Please enter your budget</h5>
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
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </button>
      </form>
    </div>
  );
};
