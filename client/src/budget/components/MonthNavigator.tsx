import type { FC } from 'react';
import styles from './MonthNavigator.module.css';

interface MonthNavigatorProps {
  currentMonth: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onCarryOver: () => void;
  onCloseMonth: () => void;
  onDeleteMonthExpenses: () => void;
  allPaid: boolean;
  closeLoading?: boolean;
  closed?: boolean;
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthNavigator: FC<MonthNavigatorProps> = ({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
  onCarryOver,
  onCloseMonth,
  onDeleteMonthExpenses,
  allPaid,
  closeLoading = false,
  closed = false,
}) => {
  const [year, month] = currentMonth.split('-');
  const monthName = monthNames[parseInt(month) - 1];
  const displayText = `${monthName} ${year}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.navButton}
          onClick={onPreviousMonth}
          title="Previous Month"
        >
          ←
        </button>

        <button
          className={styles.carryOverButton}
          onClick={onCarryOver}
          title="Carry expenses to next month"
        >
          📦 Carry Over to Next Month
        </button>

        <button
          className={styles.closeMonthButton}
          onClick={onCloseMonth}
          disabled={!allPaid || closeLoading || closed}
          title={closed ? 'Month is closed' : (allPaid ? 'Close payment for the month' : 'Mark all as paid to close')}
        >
          {closed ? 'PAYMENT CLOSED' : (closeLoading ? 'CLOSING...' : '✅ CLOSE PAYMENT FOR THE MONTH')}
        </button>

        <button
          className={styles.deleteMonthButton}
          onClick={onDeleteMonthExpenses}
          title="Delete all expenses for this month"
        >
          🗑️ Delete All Expenses
        </button>

        <button
          className={styles.navButton}
          onClick={onNextMonth}
          title="Next Month"
        >
          →
        </button>
      </div>

      <div className={styles.monthSection}>
        <h3 className={styles.monthDisplay}>{displayText}</h3>
      </div>
    </div>
  );
};
