import * as Rx from 'rxjs';

import { AccountDTO, CategoryDTO, ContractorDTO, CreateEditTransferModelDTO, SaveTransferDTO, TransferDetailsDTO } from '@coinage-app/interfaces';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { NavigatorPages, NavigatorService } from '../services/navigator.service';

import { CoinageDataService } from '../services/coinage.data-service';
import { CoinageLocalStorageService } from '../services/coinage-local-storage.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { NotificationService } from '../services/notification.service';
import { finalize } from 'rxjs/operators';

export interface NewTransferObject {
    description: string;
    amount: number;
    date: string;
    categoryId?: number;
    contractorId?: number | null;
    accountId?: number;
}

@Component({
    selector: 'coinage-app-create-transfer',
    templateUrl: './create-edit-transfer.component.html',
    styleUrls: ['./create-edit-transfer.component.scss'],
})
export class CreateEditTransferComponent implements OnInit {
    public static FUEL_TEMPLATE = 'Paliwo x,xx PLN/L Miejsce';

    showPage = true;
    totalPayment = 0;
    categories: CategoryDTO[] = [];
    contractors: ContractorDTO[] = [];
    accounts: AccountDTO[] = [];
    editMode = false;
    transferDTO!: TransferDetailsDTO;
    transferId!: number;

    @ViewChildren('categorySelect')
    private categorySelect?: QueryList<NgSelectComponent>;

    @ViewChildren('contractorSelect')
    private contractorSelect?: QueryList<NgSelectComponent>;

    @Input() redirectAfterSave = true;
    @Input() selectedTransferInputs!: NewTransferObject;

    @Output() saveSuccess = new EventEmitter<void>();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService,
        private readonly coinageLocalStorageService: CoinageLocalStorageService
    ) {}

    ngOnInit(): void {
        this.showPage = false;
        this.clearInputData();
        this.route.params.subscribe((params) => {
            const id = parseInt(params.id);
            if (id) {
                this.transferId = id;
                this.coinageData.getTransferDetails(id).subscribe((transfer) => {
                    this.transferDTO = transfer;
                    this.editMode = true;
                    this.selectedTransferInputs = {
                        amount: transfer.amount,
                        categoryId: transfer.categoryId,
                        date: transfer.date.toISOString().slice(0, 10),
                        description: transfer.description,
                        contractorId: transfer.contractorId ?? undefined,
                        accountId: transfer.account.id,
                    };
                });
            }
        });
        Rx.zip(this.coinageData.getCategoryList(), this.coinageData.getContractorList(), this.coinageData.getAllAvailableAccounts())
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe(([categories, contractors, accounts]) => {
                this.categories = categories;
                this.contractors = contractors;
                this.accounts = accounts;
            });
    }

    onClickSaveTransfer(): void {
        const newTransfer: CreateEditTransferModelDTO = {
            id: this.transferId,
            description: this.selectedTransferInputs.description,
            amount: parseFloat(this.selectedTransferInputs.amount?.toString()) ?? null,
            categoryId: this.selectedTransferInputs.categoryId ?? 0,
            contractorId: this.selectedTransferInputs.contractorId ?? null,
            accountId: this.selectedTransferInputs.accountId ?? 0,
            date: new Date(this.selectedTransferInputs.date) as any,
        };
        console.log(newTransfer);
        this.coinageData.postCreateSaveTransaction(newTransfer).subscribe((result) => {
            console.log(result);
            const cat = this.categories.find((c) => c.id === newTransfer.categoryId);
            if (result.error) {
                this.notificationService.error(`Error saving transfer:\n${result.error}`);
            }
            if (result.insertedId && cat) {
                this.saveSuccess.emit();
                //     {
                //     ...newTransfer,
                //     id: result.insertedId,
                //     categoryName: cat.name,
                //     type: TransferTypeEnum.OUTCOME,
                //     accountName: this.accounts.find((a) => a.id === newTransfer.accountId)?.name ?? '',
                // }
                this.notificationService.push({
                    title: `Transfer ${this.editMode ? 'Saved' : 'Added'}`,
                    message: newTransfer.description ?? this.categories.find((c) => c.id === newTransfer.categoryId)!.name,
                    linkTo: NavigatorPages.TransferDetails(result.insertedId),
                });
                this.clearInputData();
            }
            if (this.redirectAfterSave && result.insertedId) {
                this.navigator.goTo(NavigatorPages.TransferDetails(result.insertedId));
            }
        });
        this.coinageLocalStorageService.setNumber('lastUsedAccountId', this.selectedTransferInputs.accountId);
    }

    public onClickDeleteTransfer(): void {
        if (confirm('Are you sure you want to delete this transfer?')) {
            this.coinageData.deleteTransfer(this.transferId).subscribe((result) => {
                if (result) {
                    this.notificationService.push({
                        title: `Transfer Removed`,
                        message: `Transfer with ${this.selectedTransferInputs.description} has been deleted.`,
                    });
                    this.navigator.goTo(NavigatorPages.Dashboard());
                }
            });
        }
    }

    public onAddNewCategory = async (name: string): Promise<CategoryDTO> => {
        const response = await Rx.lastValueFrom(this.coinageData.postCreateCategory({ name }));
        if (response.insertedId) {
            this.notificationService.push({ title: `Category Created`, message: name, linkTo: NavigatorPages.CategoryDetails(response.insertedId) });
        }
        return { id: response.insertedId ?? 0, name };
    };

    public onAddNewContractor = async (name: string): Promise<ContractorDTO> => {
        const response = await Rx.lastValueFrom(this.coinageData.postCreateContractor({ name }));
        if (response === undefined) {
            return { id: 0, name: '' };
        }
        if (response.insertedId) {
            this.notificationService.push({ title: `Contractor Created`, message: name, linkTo: NavigatorPages.ContractorDetails(response.insertedId) });
        }
        return { id: response.insertedId ?? 0, name };
    };

    public onChangeCategory(): void {
        if (this.selectedTransferInputs.categoryId === 1 && this.selectedTransferInputs.description === '') {
            this.selectedTransferInputs.description = CreateEditTransferComponent.FUEL_TEMPLATE;
        }
    }

    get todayInputFormat(): string {
        const today = new Date().toLocaleDateString().split('.');
        return [today[2], today[1], today[0].padStart(2, '0')].join('-');
    }

    public clearInputData(): void {
        // this.selectedTransferInputs.description = '';
        // this.selectedTransferInputs.amount = 0;
        // this.selectedTransferInputs.date = this.todayInputFormat;
        this.selectedTransferInputs = {
            description: '',
            amount: 0,
            date: this.todayInputFormat,
            categoryId: this.selectedTransferInputs?.categoryId,
            contractorId: this.selectedTransferInputs?.contractorId,
            accountId: this.selectedTransferInputs?.accountId ?? this.coinageLocalStorageService.getNumber('lastUsedAccountId'),
        };
        this.categorySelect?.first.handleClearClick();
        this.contractorSelect?.first.handleClearClick();
    }
}
