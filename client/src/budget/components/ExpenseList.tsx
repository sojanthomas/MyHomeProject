
import type { Expense } from '../types';
import React from 'react';
import styles from './ExpenseList.module.css';

type ExpenseListProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => Promise<boolean>;
  onTogglePaid: (id: number, paid: boolean) => Promise<void>;
  isLoading?: boolean;
  closed?: boolean;
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete,
  onTogglePaid,
  isLoading = false,
}) => {
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  if (expenses.length === 0) {
    return (
      <div className={styles.container}>
        <h4 className={styles.sectionTitle}>Expense Details</h4>
        <div className={styles.header}>
          <h5 className={styles.headerTitle}>Expense Title</h5>
          <h5 className={styles.headerValue}>Expense Value</h5>
          <h5 className={styles.headerScheduled}>Scheduled</h5>
          <h5 className={styles.headerActions}></h5>
        </div>
        <div className={styles.emptyState}>
          <p>No expenses yet. Add one to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.sectionTitle}>Expense Details</h4>
      <div className={styles.header}>
        <h5 className={styles.headerTitle}>Expense Title</h5>
        <h5 className={styles.headerValue}>Expense Value</h5>
        <h5 className={styles.headerScheduled}>Scheduled</h5>
        <h5 className={styles.headerPaid}>Paid</h5>
        <h5 className={styles.headerActions}></h5>
      </div>

      <div className={styles.list}>
        {expenses.map((expense) => (
          <div key={expense.id} className={styles.item}>
            <div className={styles.title}>{expense.title}</div>
            <div className={styles.amount}>$ {expense.amount.toFixed(2)}</div>
            <div className={styles.scheduled}>
              {expense.scheduled ? (
                <span className={styles.badge}>Yes</span>
              ) : (
                <span className={styles.badgeNo}>No</span>
              )}
            </div>
            <div className={styles.paid}>
              <input
                type="checkbox"
                checked={expense.paid}
                disabled={isLoading || closed}
                onChange={() => onTogglePaid(expense.id, !expense.paid)}
                title={expense.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
              />
            </div>
            <div className={styles.actions}>
              <button
                className={styles.editBtn}
                onClick={() => onEdit(expense)}
                disabled={isLoading}
                title="Edit"
              >
                ✎
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(expense.id)}
                disabled={isLoading}
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
