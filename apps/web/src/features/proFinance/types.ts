export interface Expense {
  id: string;
  professionalId: string;
  desc: string;
  val: number;
  cat: string;
  date: string;
}

export interface CreateExpenseInput {
  desc: string;
  val: number;
  cat: string;
  date: string;
}

export const EXPENSE_CATEGORIES = ['Material', 'Transporte', 'Aluguel', 'Marketing', 'Outros'] as const;
