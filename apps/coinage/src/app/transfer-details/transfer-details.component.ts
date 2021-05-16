import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TransferDetailsDTO } from '@coinage-app/interfaces';
import { AppRoutingModule } from '../app-routing/app-routing.module';
import { CoinageDataService } from '../coinageData.service';

@Component({
    selector: 'coinage-app-transfer-details',
    templateUrl: './transfer-details.component.html',
    styleUrls: ['./transfer-details.component.less'],
})
export class TransferDetailsComponent implements OnInit {
    showPage = false;
    transfer: TransferDetailsDTO;
    totalPayment: number;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly coinageData: CoinageDataService
    ) {}

    ngOnInit(): void {
        this.showPage = false;
        this.route.paramMap.subscribe((params) => {
            const id = parseInt(params.get('id'));
            if (id) {
                this.coinageData.getTransferDetails(id).then((transfer) => {
                    this.transfer = transfer;
                    this.showPage = true;
                    this.totalPayment =
                        transfer.amount +
                        transfer.otherTransfers.reduce(
                            (a, t) => a + t.amount,
                            0
                        );
                });
            } else {
                this.router.navigateByUrl('notFound');
            }
        });
    }
}
