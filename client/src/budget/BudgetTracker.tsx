import { useState } from 'react';
import { budgetService } from './services/budgetService';
import type { Expense, UpdateExpenseInput } from './types';
import { useBudget } from './hooks/useBudget';
import { MonthNavigator } from './components/MonthNavigator';
import { BudgetForm } from './components/BudgetForm';
import { ExpenseForm } from './components/ExpenseForm';
import { BudgetSummary } from './components/BudgetSummary';
import { ExpenseList } from './components/ExpenseList';
import './BudgetTracker.css';

export default function BudgetTracker() {
  const {
    currentMonth, budget, paidExpenses, scheduledExpenses, balance,
    expenses, loading, error,
    goToPreviousMonth, goToNextMonth,
    createBudget, createExpense, updateExpense, deleteExpense,
    carryOverExpenses, fetchSummary, summary,
  } = useBudget();

  const [closeLoading, setCloseLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allPaid = expenses.length > 0 && expenses.every((e: Expense) => e.paid);
  const isClosed = !!summary.closed;

  const handleCloseMonth = async () => {
    if (isClosed || !allPaid) return;
    if (!window.confirm('Close payments for this month? This will lock the month.')) return;
    setCloseLoading(true);
    try {
      await budgetService.closeMonth(currentMonth);
      await fetchSummary(currentMonth);
    } catch { alert('Failed to close payments for the month.'); }
    finally { setCloseLoading(false); }
  };

  const handleBudgetSubmit = async (amount: number) => {
    setSubmitting(true);
    try { await createBudget(amount); } finally { setSubmitting(false); }
  };

  const handleExpenseSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data as UpdateExpenseInput);
        setEditingExpense(null);
      } else {
        await createExpense(data);
      }
    } finally { setSubmitting(false); }
  };

  const handleTogglePaid = async (id: number, paid: boolean) => {
    try {
      await budgetService.updateExpensePaid(id, paid);
      await fetchSummary(currentMonth);
    } catch { alert('Failed to update paid status'); }
  };

  const handleCarryOver = async () => {
    if (!window.confirm('Carry over all expenses to next month?')) return;
    setSubmitting(true);
    try {
      const result = await carryOverExpenses();
      alert(`Carried over ${result.count} expenses to ${result.nextMonth}`);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bt-app">
      <div className="bt-layout">
        {/* LEFT SIDEBAR */}
        <div className="bt-sidebar">
          <div className="bt-form-section">
            <BudgetForm onSubmit={handleBudgetSubmit} isLoading={submitting} initialValue={budget} />
          </div>
          <div className="bt-form-section">
            <ExpenseForm
              onSubmit={handleExpenseSubmit}
              isLoading={submitting}
              initialData={editingExpense ? { title: editingExpense.title, amount: editingExpense.amount, scheduled: editingExpense.scheduled } : undefined}
              onCancel={editingExpense ? () => setEditingExpense(null) : undefined}
            />
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="bt-main">
          {error && <div className="bt-error">{error}</div>}

          <div className="bt-month-nav">
            <MonthNavigator
              currentMonth={currentMonth}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onCarryOver={handleCarryOver}
              onCloseMonth={handleCloseMonth}
              onDeleteMonthExpenses={async () => {
                if (!window.confirm(`Delete all expenses for ${currentMonth}? This cannot be undone.`)) return;
                try {
                  await budgetService.deleteExpensesByMonth(currentMonth);
                  await fetchSummary(currentMonth);
                } catch { alert('Failed to delete expenses.'); }
              }}
              allPaid={allPaid}
              closeLoading={closeLoading}
              closed={isClosed}
            />
          </div>

          {!loading && (
            <div className="bt-summary">
              <BudgetSummary
                budget={summary.budget}
                paidExpenses={summary.paidExpenses}
                scheduledExpenses={summary.scheduledExpenses}
                balance={summary.balance}
              />
            </div>
          )}

          <div className="bt-list">
            {loading ? (
              <div className="bt-spinner">Loading expenses…</div>
            ) : (
              <ExpenseList
                expenses={expenses}
                onEdit={setEditingExpense}
                onDelete={deleteExpense}
                onTogglePaid={handleTogglePaid}
                isLoading={submitting}
                closed={isClosed}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
