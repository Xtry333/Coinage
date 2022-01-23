export interface AccountDetailsDTOResponse {
    id: number;
    ownerId: number;
    name: string;
    currentBalance: number;
    freeBalanceUntilNextMonth: number;
    plannedSpendingsUntilNextMonth: number;
    freeBalanceInNext30Days: number;
    currency: string;
    isOpen: boolean;
    openDate: string;
    statistics: AccountStatisticsDTO;
}

export interface AccountStatisticsDTO {
    allTime: Statistics;
    lastMonth: Statistics;
    lastYear: Statistics;
    plannedTransfers: Statistics;
    firstTransferDate: string;
    lastTransferDate: string;
}

export interface Statistics {
    incomes: number;
    expenses: number;
    balance?: number;
    transferCount: number;
}
