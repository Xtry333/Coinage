import { Injectable } from '@nestjs/common';
import { Transfer } from '../entities/Transfer.entity';

@Injectable()
export class TemplateNameMapperService {
    public static ACCOUNT_NAME = '%account%';

    public mapTransfersTemplateNames(transfers: Transfer[]): Transfer[] {
        transfers.forEach((t) => {
            if (t.contractor) {
                t.contractor.name = t.contractor.name.replace(TemplateNameMapperService.ACCOUNT_NAME, t.account.name);
            }
        });

        return transfers;
    }
}
