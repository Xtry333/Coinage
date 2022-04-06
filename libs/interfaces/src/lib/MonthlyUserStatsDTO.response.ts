export interface MonthlyUserStatsDTO {
    year: number;
    month: number;
    incomes: number;
    outcomes: number;
    balance: number;
    selectedAccounts: {
        id: number;
        name: string;
    }[];
    transactionsCount: number;
}
