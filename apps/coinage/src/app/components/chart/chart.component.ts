import { ChartDataset, ChartOptions, ChartType } from 'chart.js';
import { Component, Input } from '@angular/core';

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
export class ChartComponent {
    @Input() public showLegend = true;
    @Input() public header?: string;
    @Input() public datasets!: ChartDataset[];
    @Input() public labels!: string[];
    @Input() public type: CoinageChartType = CoinageChartType.Line;
    @Input() public options: ChartOptions = {
        responsive: true,
        elements: {
            line: {
                tension: 0.3,
            },
        },
    };

    public get chartType(): ChartType {
        return this.type;
    }
}
