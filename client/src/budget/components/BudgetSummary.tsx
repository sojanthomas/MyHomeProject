import type { FC } from 'react';
import styles from './BudgetSummary.module.css';

interface BudgetSummaryProps {
  budget: number;
  paidExpenses: number;
  scheduledExpenses: number;
  balance: number;
}

export const BudgetSummary: FC<BudgetSummaryProps> = ({
  budget,
  paidExpenses,
  scheduledExpenses,
  balance,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>💰</div>
        <h6 className={styles.label}>Budget</h6>
        <h4 className={styles.value}>
          $ <span>{budget.toFixed(2)}</span>
        </h4>
      </div>

      <div className={styles.card}>
        <div className={styles.icon}>💳</div>
        <h6 className={styles.label}>Paid Expenses</h6>
        <h4 className={styles.value}>
          $ <span>{paidExpenses.toFixed(2)}</span>
        </h4>
      </div>

      <div className={styles.card}>
        <div className={styles.icon}>📅</div>
        <h6 className={styles.label}>Scheduled Expenses</h6>
        <h4 className={styles.value}>
          $ <span>{scheduledExpenses.toFixed(2)}</span>
        </h4>
      </div>

      <div className={`${styles.card} ${balance >= 0 ? styles.positive : styles.negative}`}>
        <div className={styles.icon}>💵</div>
        <h6 className={styles.label}>Balance</h6>
        <h4 className={styles.value}>
          $ <span>{balance.toFixed(2)}</span>
        </h4>
      </div>
    </div>
  );
};
