/** One acceptance barrier shared by pointer and keyboard; never queue invisible actions. */
export class PCInputGate {
  private serial = 0;
  private active: number | null = null;
  private held = new Set<number>();
  get locked() { return this.active !== null; }
  begin(): number | null { if (this.locked) return null; return this.active = ++this.serial; }
  finish(token: number) { if (token !== this.active) return false; this.active = null; return true; }
  keyDown(code: number) { if (this.held.has(code)) return false; this.held.add(code); return true; }
  keyUp(code: number) { this.held.delete(code); }
  clearKeys() { this.held.clear(); }
}
