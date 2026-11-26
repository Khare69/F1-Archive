import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import type { LineSeriesOption, BarSeriesOption } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  AxisPointerComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LegendComponent,
} from 'echarts/components';
import type {
  GridComponentOption,
  TooltipComponentOption,
  AxisPointerComponentOption,
  DataZoomComponentOption,
  MarkLineComponentOption,
  MarkAreaComponentOption,
  LegendComponentOption,
} from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  AxisPointerComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LegendComponent,
  CanvasRenderer,
  SVGRenderer,
]);

export type ECOption = echarts.ComposeOption<
  | LineSeriesOption
  | BarSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | AxisPointerComponentOption
  | DataZoomComponentOption
  | MarkLineComponentOption
  | MarkAreaComponentOption
  | LegendComponentOption
>;

export { echarts };
export type EChartsType = echarts.ECharts;
