import { ChartDataset, ChartOptions, ChartType } from 'chart.js';
import { Component, Input, OnInit } from '@angular/core';

export const enum CoinageChartType {
    Bar = 'bar',
    Line = 'line',
    Pie = 'pie',
}

@Component({
    selector: 'coinage-app-chart[datasets][labels]',
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.scss'],
})
export class ChartComponent implements OnInit {
    @Input() showLegend: boolean = true;
    @Input() header?: string;
    @Input() datasets!: ChartDataset[];
    @Input() labels!: string[];
    @Input() type: CoinageChartType = CoinageChartType.Line;
    @Input() options: ChartOptions = {
        responsive: true,
        elements: {
            line: {
                tension: 0.3,
            },
        },
    };

    constructor() {}

    ngOnInit(): void {}

    public get chartType(): ChartType {
        return this.type;
    }
}
