import { Injectable } from '@nestjs/common';
import { Transfer } from '../entities/Transfer.entity';

@Injectable()
export class TemplateNameMapperService {
    public static ACCOUNT_ORIGIN_NAME = '%account-origin%';
    public static ACCOUNT_TARGET_NAME = '%account-target%';

    public mapTransfersTemplateNames(transfers: Transfer[]): Transfer[] {
        transfers.forEach((t) => {
            if (t.contractor) {
                t.contractor.name = t.contractor.name.replace(TemplateNameMapperService.ACCOUNT_ORIGIN_NAME, `${t.originAccount.name}`);
                t.contractor.name = t.contractor.name.replace(TemplateNameMapperService.ACCOUNT_TARGET_NAME, `${t.targetAccount?.name}`);
            }
        });

        return transfers;
    }
}
