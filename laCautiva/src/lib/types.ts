export type Transaction = {
  id: string;
  type: 'deposit' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
};
