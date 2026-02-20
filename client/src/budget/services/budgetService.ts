import type { Budget, Expense, CreateExpenseInput, UpdateExpenseInput } from '../types';

const API = '/api';

export interface BudgetSummary {
  monthYear: string;
  budget: number;
  closed?: boolean;
  paidExpenses: number;
  scheduledExpenses: number;
  balance: number;
  expenses: Expense[];
}

export const budgetService = {
  getBudgetByMonth: async (monthYear: string): Promise<Budget | undefined> => {
    const res = await fetch(`${API}/budgets/${monthYear}`);
    if (!res.ok) { if (res.status === 404) return undefined; throw new Error('Failed to fetch budget'); }
    return res.json();
  },

  getAllMonths: async (): Promise<string[]> => {
    const res = await fetch(`${API}/months`);
    if (!res.ok) throw new Error('Failed to fetch months');
    return res.json();
  },

  saveBudget: async (amount: number, monthYear?: string): Promise<Budget> => {
    const res = await fetch(`${API}/budgets`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, monthYear }),
    });
    if (!res.ok) throw new Error('Failed to save budget');
    return res.json();
  },

  getSummary: async (monthYear: string): Promise<BudgetSummary> => {
    const res = await fetch(`${API}/summary/${monthYear}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  createExpense: async (input: CreateExpenseInput & { monthYear?: string }): Promise<Expense> => {
    const res = await fetch(`${API}/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
  },

  updateExpense: async (id: number, input: UpdateExpenseInput): Promise<Expense | null> => {
    const res = await fetch(`${API}/expenses/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },

  deleteExpense: async (id: number): Promise<boolean> => {
    const res = await fetch(`${API}/expenses/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  deleteExpensesByMonth: async (monthYear: string): Promise<void> => {
    const res = await fetch(`${API}/expenses/month/${monthYear}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expenses for month');
  },

  updateExpensePaid: async (id: number, paid: boolean): Promise<{ id: number; paid: boolean }> => {
    const res = await fetch(`${API}/expenses/${id}/paid`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid }),
    });
    if (!res.ok) throw new Error('Failed to update paid status');
    return res.json();
  },

  carryOverExpenses: async (monthYear: string): Promise<{ count: number; nextMonth: string }> => {
    const res = await fetch(`${API}/carryover/${monthYear}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error('Failed to carry over expenses');
    const data = await res.json();
    return { count: data.count, nextMonth: data.nextMonth };
  },

  closeMonth: async (monthYear: string): Promise<{ message: string; updated: number }> => {
    const res = await fetch(`${API}/close-month/${monthYear}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error('Failed to close month');
    return res.json();
  },
};
