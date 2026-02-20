export interface Budget {
  id: number;
  amount: number;
  monthYear: string;
  closed?: boolean;
  createdAt: string;
}

export interface BudgetSummary {
  monthYear: string;
  budget: number;
  closed?: boolean;
  paidExpenses: number;
  scheduledExpenses: number;
  balance: number;
  expenses: Expense[];
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  scheduled: boolean;
  paid: boolean;
  monthYear: string;
  createdAt: string;
}

export interface CreateBudgetInput { amount: number; }
export interface CreateExpenseInput { title: string; amount: number; scheduled: boolean; paid?: boolean; }
export interface UpdateExpenseInput { title?: string; amount?: number; scheduled?: boolean; paid?: boolean; }
