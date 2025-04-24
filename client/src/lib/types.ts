export interface Transaction {
  'Transaction Date': string;
  Description: string;
  Amount: number;
  Category?: string;
  Type?: string;
  Memo?: string;
}

export interface CategoryTotal {
  [key: string]: number;
}
