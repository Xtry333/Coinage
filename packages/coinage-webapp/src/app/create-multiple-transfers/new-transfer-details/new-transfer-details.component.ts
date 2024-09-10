import { Component, EventEmitter, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { NgSelectComponent } from '@ng-select/ng-select';
import { finalize, zip } from 'rxjs';

import { AccountDTO, ContractorDTO } from '@coinage-app/interfaces';

import { CoinageStorageService } from '../../core/services/storage-service/coinage-storage.service';
import { StorageScope } from '../../core/services/storage-service/storage-scope.enum';
import { CoinageDataService } from '../../services/coinage.data-service';
import { NavigatorPages } from '../../services/navigator.service';
import { NotificationService } from '../../services/notification.service';

export interface SelectedDetails {
    accountId: number | undefined;
    contractorId: number | undefined;
    transferDate: string;
}

@Component({
    selector: 'app-new-transfer-details',
    templateUrl: './new-transfer-details.component.html',
    styleUrls: ['./new-transfer-details.component.scss'],
})
export class NewTransferDetailsComponent implements OnInit {
    public static LAST_USED_CONTRACTOR = 'createTransfers.lastUsedContractorId';
    public static LAST_USED_ACCOUNT = 'createTransfers.lastUsedAccountId';

    public dataReady = false;

    public accounts: AccountDTO[] = [];
    public contractors: ContractorDTO[] = [];

    @ViewChildren('accountSelect')
    private accountSelect?: QueryList<NgSelectComponent>;

    public selected: SelectedDetails;

    @Output()
    public detailsChanged = new EventEmitter<SelectedDetails>();

    public constructor(
        private readonly dataService: CoinageDataService,
        private readonly storage: CoinageStorageService,
        private readonly notificationService: NotificationService,
    ) {
        this.selected = {
            accountId: 0,
            contractorId: 0,
            transferDate: '',
        };
    }

    public ngOnInit(): void {
        zip([this.dataService.getContractorList(), this.dataService.getAllAvailableAccounts()])
            .pipe(
                finalize(() => {
                    this.dataReady = true;
                }),
            )
            .subscribe(([contractors, accounts]) => {
                this.contractors = contractors;
                this.accounts = accounts;

                this.selected.accountId = this.storage.getNumber(NewTransferDetailsComponent.LAST_USED_ACCOUNT, StorageScope.Persistent);
                this.selected.contractorId = this.storage.getNumber(NewTransferDetailsComponent.LAST_USED_CONTRACTOR, StorageScope.Persistent);
                this.selected.transferDate = this.todayInputFormat;
                this.detailsChanged.emit(this.selected);
            });
    }

    public onAccountChanged(changed?: AccountDTO): void {
        this.storage.setNumber(NewTransferDetailsComponent.LAST_USED_ACCOUNT, changed?.id, StorageScope.Persistent);
        this.detailsChanged.emit(this.selected);
    }

    public onContractorChanged(changed?: ContractorDTO): void {
        this.storage.setNumber(NewTransferDetailsComponent.LAST_USED_CONTRACTOR, changed?.id, StorageScope.Persistent);
        this.detailsChanged.emit(this.selected);
    }

    public async onAddNewContractor(name: string): Promise<ContractorDTO> {
        const response = await this.dataService.postCreateContractor({ name });
        if (response === undefined) {
            return { id: 0, name: '' };
        }
        if (response.insertedId) {
            this.notificationService.push({ title: `Contractor Created`, message: name, linkTo: NavigatorPages.ContractorDetails(response.insertedId) });
        }
        return { id: response.insertedId ?? 0, name };
    }

    public onDateChanged(): void {
        this.detailsChanged.emit(this.selected);
    }

    public highlightAccountSelect(): void {
        this.accountSelect?.first.focus();
    }

    private get todayInputFormat(): string {
        const today = new Date().toLocaleDateString().split('.');
        return [today[2], today[1], today[0].padStart(2, '0')].join('-');
    }
}
