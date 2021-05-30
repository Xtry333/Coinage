import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryDTO } from '@coinage-app/interfaces';
import { finalize } from 'rxjs/operators';
import { CoinageDataService } from '../services/coinageData.service';

@Component({
    selector: 'coinage-app-create-transfer',
    templateUrl: './create-transfer.component.html',
    styleUrls: ['./create-transfer.component.less'],
})
export class CreateTransferComponent implements OnInit {
    showPage = true;
    totalPayment: number;
    categories: CategoryDTO[];
    contractors: any[] = [];

    @Input('transfer')
    transfer = { description: '', amount: 0, date: '', category: 0, contractor: 0 };

    constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly coinageData: CoinageDataService) {}

    ngOnInit(): void {
        this.showPage = false;
        this.coinageData
            .getCategoryList()
            .pipe(
                finalize(() => {
                    this.showPage = true;
                })
            )
            .subscribe((cats) => (this.categories = cats));
    }

    onClickCreateTransfer(): void {
        console.log(this.transfer);
        this.coinageData
            .postCreateTransaction({
                description: this.transfer.description,
                amount: parseFloat(this.transfer.amount?.toString()) ?? null,
                category: this.transfer.category,
                contractor: this.transfer.category,
                date: this.transfer.date,
            })
            .subscribe((result) => {
                console.log(result);
                this.router.navigateByUrl(`/details/${(result as any).insertedId}`);
            });
    }
}
