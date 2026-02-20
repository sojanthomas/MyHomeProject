import { useState, useEffect } from 'react';
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '../types';
import { budgetService, type BudgetSummary } from '../services/budgetService';

const getCurrentMonthYear = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getNextMonthYear = (my: string): string => {
  const [y, m] = my.split('-');
  let nm = parseInt(m) + 1, ny = parseInt(y);
  if (nm > 12) { nm = 1; ny++; }
  return `${ny}-${String(nm).padStart(2, '0')}`;
};

export const useBudget = () => {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthYear());
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({
    monthYear: getCurrentMonthYear(), budget: 0, closed: false,
    paidExpenses: 0, scheduledExpenses: 0, balance: 0, expenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchAllMonths = async () => {
    try { const months = await budgetService.getAllMonths(); setAllMonths(months); return months; }
    catch { return []; }
  };

  const fetchSummary = async (monthYear: string) => {
    try {
      setLoading(true);
      const data = await budgetService.getSummary(monthYear);
      setSummary({ ...data, closed: !!data.closed });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch summary');
    } finally { setLoading(false); }
  };

  const navigateToMonth = (monthYear: string) => { setCurrentMonth(monthYear); fetchSummary(monthYear); };
  const goToPreviousMonth = () => {
    const [y, m] = currentMonth.split('-');
    let pm = parseInt(m) - 1, py = parseInt(y);
    if (pm < 1) { pm = 12; py--; }
    navigateToMonth(`${py}-${String(pm).padStart(2, '0')}`);
  };
  const goToNextMonth = () => navigateToMonth(getNextMonthYear(currentMonth));

  const createBudget = async (amount: number) => {
    await budgetService.saveBudget(amount, currentMonth);
    await fetchSummary(currentMonth);
  };

  const createExpense = async (input: CreateExpenseInput) => {
    await budgetService.createExpense({ ...input, monthYear: currentMonth });
    await fetchSummary(currentMonth);
  };

  const updateExpense = async (id: number, input: UpdateExpenseInput) => {
    await budgetService.updateExpense(id, input);
    await fetchSummary(currentMonth);
  };

  const deleteExpense = async (id: number) => {
    const ok = await budgetService.deleteExpense(id);
    if (ok) await fetchSummary(currentMonth);
    return ok;
  };

  const carryOverExpenses = async () => {
    const result = await budgetService.carryOverExpenses(currentMonth);
    if (!allMonths.includes(result.nextMonth)) setAllMonths([result.nextMonth, ...allMonths]);
    navigateToMonth(result.nextMonth);
    return result;
  };

  useEffect(() => {
    if (isInitialized) return;
    (async () => {
      const months = await fetchAllMonths();
      let monthToLoad = getCurrentMonthYear();
      if (months.length) monthToLoad = [...months].sort((a, b) => b.localeCompare(a))[0];
      setCurrentMonth(monthToLoad);
      await fetchSummary(monthToLoad);
      setIsInitialized(true);
    })();
  }, [isInitialized]);

  return {
    currentMonth, allMonths, summary,
    expenses: summary.expenses,
    budget: summary.budget,
    paidExpenses: summary.paidExpenses,
    scheduledExpenses: summary.scheduledExpenses,
    balance: summary.balance,
    loading, error,
    navigateToMonth, goToPreviousMonth, goToNextMonth,
    createBudget, createExpense, updateExpense, deleteExpense,
    carryOverExpenses, fetchSummary,
  };
};
