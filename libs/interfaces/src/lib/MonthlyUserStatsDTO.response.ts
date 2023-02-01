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

export interface NewMonthlyAccountStatsDTO {
    accountId: number;
    balance: number;
    totalIncoming: number;
    totalOutgoing: number;
    externalIncoming: number;
    externalOutgoing: number;
}

export interface NewMonthlyUserStatsDTO {
    year: number;
    month: number;
    totalIncoming: number;
    totalOutgoing: number;
    totalChange: number;
    externalIncoming: number;
    externalOutgoing: number;
    externalChange: number;
    balance: number;
    accountStats: NewMonthlyAccountStatsDTO[];
}
