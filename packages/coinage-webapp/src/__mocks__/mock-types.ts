export interface MockTransferDetailsDTO {
    id: number;
    amount: number;
    type: number;
    date: Date;
    accountingDate: Date;
    categoryPath: string[];
    contractor: string;
    otherTransfers: unknown[];
    description: string;
    categoryId: number;
    contractorId: number;
    account: MockAccountDTO;
    targetAccount: MockAccountDTO;
    createdDate: Date;
    editedDate: Date;
    items: unknown[];
    receipt: null;
    isPlanned: boolean;
    isRefundable: boolean;
    parentId: number | null;
}

export interface MockAccountDTO {
    id: number;
    name: string;
    balance: number;
    currency: string;
    icon: string | null;
    isBudget: boolean;
}

export interface MockCategoryDTO {
    id: number;
    name: string;
    parentId?: number | null;
    icon?: string | null;
    color?: string | null;
}

export interface MockCoinageNotification {
    id: number;
    title: string;
    message: string;
    autoCloseDelay?: number;
    linkTo?: string;
    level?: number;
    timestamp?: string;
    isRead?: boolean;
}

export function createMockTransferDetails(overrides: Partial<MockTransferDetailsDTO> = {}): MockTransferDetailsDTO {
    return {
        id: 1,
        amount: 123.1,
        type: 0,
        date: new Date('2021-05-16'),
        accountingDate: new Date('2021-05-16'),
        categoryPath: [],
        contractor: 'Test Contractor',
        otherTransfers: [],
        description: 'Test description',
        categoryId: 1,
        contractorId: 1,
        account: createMockAccount(),
        targetAccount: createMockAccount(),
        createdDate: new Date('2021-05-16'),
        editedDate: new Date('2021-05-16'),
        items: [],
        receipt: null,
        isPlanned: false,
        isRefundable: false,
        parentId: null,
        ...overrides,
    };
}

export function createMockAccount(overrides: Partial<MockAccountDTO> = {}): MockAccountDTO {
    return {
        id: 1,
        name: 'Test Account',
        balance: 1000,
        currency: 'PLN',
        icon: null,
        isBudget: false,
        ...overrides,
    };
}

export function createMockCategory(overrides: Partial<MockCategoryDTO> = {}): MockCategoryDTO {
    return {
        id: 1,
        name: 'Test Category',
        parentId: null,
        icon: null,
        color: null,
        ...overrides,
    };
}

export function createMockNotification(overrides: Partial<MockCoinageNotification> = {}): MockCoinageNotification {
    return {
        id: 1,
        title: 'Test',
        message: 'Test message',
        autoCloseDelay: 5000,
        ...overrides,
    };
}
