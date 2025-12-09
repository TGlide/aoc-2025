export class Queue {
  value: string[] = [];
  visited: Set<string> = new Set();

  constructor(value: string | string[] = []) {
    this.value = Array.isArray(value) ? value : [value];
  }

  private findInsertionIndex(score: number): number {
    let left = 0;
    let right = this.value.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (scoreMap[this.value[mid]] > score) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return left;
  }

  get next() {
    const next = this.value.shift();
    if (!next) return null;
    this.visited.add(next);
    return next;
  }

  push() {
    const pk = getPosKey(pos);
    if (this.visited.has(pk)) return;

    if (this.value.includes(pk)) {
      // delete from list
      const index = this.value.indexOf(pk);
      this.value.splice(index, 1);
    }

    const index = this.findInsertionIndex(scoreMap[pk]);
    this.value.splice(index, 0, pk);
  }

  get size() {
    return this.value.length;
  }
}

const dijkstra = new Dijkstra({
  matrix,
  start,
  end,
});

dijkstra.findShortest();
