import * as Rx from 'rxjs';

import { AccountDTO, CategoryDTO, ContractorDTO, CreateEditTransferModelDTO, TransferDetailsDTO } from '@coinage-app/interfaces';
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

    public showPage = true;
    public totalPayment = 0;
    public categories: CategoryDTO[] = [];
    public contractors: ContractorDTO[] = [];
    public accounts: AccountDTO[] = [];
    public editMode = false;
    public transferDTO!: TransferDetailsDTO;
    public transferId!: number;

    @ViewChildren('categorySelect')
    private categorySelect?: QueryList<NgSelectComponent>;

    @ViewChildren('contractorSelect')
    private contractorSelect?: QueryList<NgSelectComponent>;

    @Input() public redirectAfterSave = true;
    @Input() public selectedTransferInputs!: NewTransferObject;

    @Output() public saveSuccess = new EventEmitter<void>();

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly navigator: NavigatorService,
        private readonly coinageData: CoinageDataService,
        private readonly notificationService: NotificationService,
        private readonly coinageLocalStorageService: CoinageLocalStorageService
    ) {}

    public ngOnInit(): void {
        this.showPage = false;
        this.clearInputData();
        this.route.params.subscribe((params) => {
            const id = parseInt(params.id);
            if (id) {
                this.transferId = id;
                this.coinageData.getTransferDetails(id).then((transfer) => {
                    this.transferDTO = transfer;
                    this.editMode = true;
                    console.log(transfer);
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

    public onClickSaveTransfer(): void {
        const newTransfer = new CreateEditTransferModelDTO(
            this.transferId,
            this.selectedTransferInputs.description,
            parseFloat(this.selectedTransferInputs.amount?.toString()) ?? null,
            this.selectedTransferInputs.categoryId ?? 0,
            this.selectedTransferInputs.contractorId ?? null,
            this.selectedTransferInputs.accountId ?? 0,
            new Date(this.selectedTransferInputs.date),
            null
        );
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
                    message: newTransfer.description ?? this.categories.find((c) => c.id === newTransfer.categoryId)?.name ?? 'Saved Transfer',
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

    public get todayInputFormat(): string {
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
