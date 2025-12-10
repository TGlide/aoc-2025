interface ProgressBarOptions {
  total: number;
  width?: number;
  complete?: string;
  incomplete?: string;
  showPercentage?: boolean;
  showValue?: boolean;
}

export class ProgressBar {
  private total: number;
  private current: number = 0;
  private width: number;
  private complete: string;
  private incomplete: string;
  private showPercentage: boolean;
  private showValue: boolean;

  constructor(options: ProgressBarOptions) {
    this.total = options.total;
    this.width = options.width || 40;
    this.complete = options.complete || "█";
    this.incomplete = options.incomplete || "░";
    this.showPercentage = options.showPercentage ?? true;
    this.showValue = options.showValue ?? true;
  }

  update(value: number): void {
    this.current = Math.min(value, this.total);
    this.render();
  }

  increment(): void {
    this.update(this.current + 1);
  }

  private render(): void {
    const percentage = (this.current / this.total) * 100;
    const completed = Math.round((this.current / this.total) * this.width);
    const remaining = this.width - completed;

    const bar =
      this.complete.repeat(completed) + this.incomplete.repeat(remaining);

    let output = `[${bar}]`;

    if (this.showPercentage) {
      output += ` ${percentage.toFixed(1)}%`;
    }

    if (this.showValue) {
      output += ` ${this.current}/${this.total}`;
    }

    process.stdout.write("\r" + output);

    if (this.current === this.total) {
      process.stdout.write("\n");
    }
  }
}
