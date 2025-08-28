import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AccountDTO, BulkEditTransferDTO, CategoryDTO, ContractorDTO, ReceiptDTO, ScheduleDTO } from '@app/interfaces';
import * as Rx from 'rxjs';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-bulk-edit-transfers-modal',
    templateUrl: './bulk-edit-transfers-modal.component.html',
    styleUrls: ['./bulk-edit-transfers-modal.component.scss'],
    standalone: false,
})
export class BulkEditTransfersModalComponent implements OnInit {
    @Input() public isDisplayed = false;
    @Input() public selectedTransferIds: number[] = [];
    @Input() public isInsideModal = false;

    @Output() public closeModal = new EventEmitter<void>();
    @Output() public bulkEditComplete = new EventEmitter<void>();

    public categories: CategoryDTO[] = [];
    public contractors: ContractorDTO[] = [];
    public accounts: AccountDTO[] = [];
    public schedules: ScheduleDTO[] = [];
    public receipts: ReceiptDTO[] = [];

    public bulkEditData: Partial<BulkEditTransferDTO> = {};
    public isLoading = false;

    public constructor(
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService,
    ) {}

    public ngOnInit(): void {
        this.loadDropdownData();
    }

    private loadDropdownData(): void {
        Rx.zip(
            this.coinageData.getCategoryList(),
            this.coinageData.getContractorList(),
            this.coinageData.getAllAvailableAccounts(),
            this.coinageData.getAllSchedules(),
            this.coinageData.getAllReceipts(),
        ).subscribe(([categories, contractors, accounts, schedules, receipts]) => {
            this.categories = categories;
            this.contractors = contractors;
            this.accounts = accounts;
            this.schedules = schedules;
            this.receipts = receipts;
        });
    }

    public get todayInputFormat(): string {
        const today = new Date().toLocaleDateString().split('.');
        return [today[2], today[1], today[0].padStart(2, '0')].join('-');
    }

    public onClose(): void {
        this.resetForm();
        this.closeModal.emit();
    }

    public async onSave(): Promise<void> {
        if (this.selectedTransferIds.length === 0) return;

        this.isLoading = true;

        try {
            const bulkEditRequest: BulkEditTransferDTO = {
                transferIds: this.selectedTransferIds,
                ...this.bulkEditData,
                date: this.bulkEditData.date ? new Date(this.bulkEditData.date) : undefined,
            };

            // Remove undefined values
            Object.keys(bulkEditRequest).forEach((key) => {
                if (bulkEditRequest[key as keyof BulkEditTransferDTO] === undefined) {
                    delete bulkEditRequest[key as keyof BulkEditTransferDTO];
                }
            });

            const result = await this.coinageData.postBulkEditTransfers(bulkEditRequest);

            if (result.error) {
                this.notificationService.error(`Error updating transfers: ${result.error}`);
            } else {
                this.notificationService.push({
                    title: 'Bulk Edit Complete',
                    message: `Successfully updated ${this.selectedTransferIds.length} transfers`,
                });
                this.bulkEditComplete.emit();
                this.onClose();
            }
        } catch (error) {
            this.notificationService.error('Failed to update transfers');
            console.error('Bulk edit error:', error);
        } finally {
            this.isLoading = false;
        }
    }

    public async onAddNewCategory(name: string): Promise<CategoryDTO> {
        const response = await Rx.lastValueFrom(this.coinageData.postCreateCategory({ name }));
        if (response.insertedId) {
            this.notificationService.push({ title: `Category Created`, message: name });
        }
        const newCategory = { id: response.insertedId ?? 0, name };
        this.categories.push(newCategory);
        return newCategory;
    }

    public async onAddNewContractor(name: string): Promise<ContractorDTO> {
        const response = await this.coinageData.postCreateContractor({ name });
        if (response?.insertedId) {
            this.notificationService.push({ title: `Contractor Created`, message: name });
            const newContractor = { id: response.insertedId, name };
            this.contractors.push(newContractor);
            return newContractor;
        }
        return { id: 0, name: '' };
    }

    private resetForm(): void {
        this.bulkEditData = {};
    }

    public hasChanges(): boolean {
        return Object.values(this.bulkEditData).some((value) => value !== undefined && value !== null && value !== '');
    }
}
