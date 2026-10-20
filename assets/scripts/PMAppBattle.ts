import { Color, Graphics, Layers, Node, sys, tween, Tween, UIOpacity, UITransform, Vec3 } from 'cc';

type Element = 'fire' | 'grass' | 'water' | 'other';

/** Cosmetic battle presentation. All coordinates use the existing stage/fx space. */
export class PMAppBattle {
  private readonly nodes = new Set<Node>();
  private readonly motions = new Set<Tween<any>>();
  private readonly nodeMotions = new Map<Node, Set<Tween<any>>>();
  private ambientStarted = false;
  private disposed = false;
  private shakeMotion: Tween<any> | null = null;
  private shakeHome: Vec3 | null = null;

  static enabled(): boolean {
    return sys.isNative || /(?:^|[?&])appbattle=1(?:&|$)/.test(
      (globalThis as { location?: { search?: string } }).location?.search || '',
    );
  }

  constructor(
    private readonly stage: Node,
    private readonly fx: Node,
    private readonly sceneHeight: number,
    private readonly screenHeight: number,
    private readonly reducedMotion = false,
  ) {}

  ambience(): void {
    if (this.disposed || this.ambientStarted || !this.stage.isValid) return;
    this.ambientStarted = true;
    const top = this.screenHeight / 2;
    const bottom = top - this.sceneHeight;
    const back = this.node(this.stage, 'app-coast-light', 0, 0);
    back.setSiblingIndex(0);
    const front = this.node(this.stage, 'app-coast-foreground', 0, 0);

    // Narrow, translucent edge shafts leave the pets and central arena clear.
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const beam = this.node(back, 'coast-sunbeam-' + i, side * 175, top - 72);
      const g = beam.addComponent(Graphics);
      const length = Math.min(175, this.sceneHeight * .43);
      for (let layer = 0; layer < 5; layer++) {
        const width = 3 + layer * 2.8;
        g.fillColor = this.color('#fff0bd', 5);
        g.moveTo(-width, 0);
        g.lineTo(width, 0);
        g.lineTo(side * -20 + width * 1.45, -length);
        g.lineTo(side * -20 - width * 1.45, -length);
        g.close();
        g.fill();
      }
      const opacity = beam.addComponent(UIOpacity);
      opacity.opacity = 160;
      if (!this.reducedMotion) this.run(beam, tween(opacity)
        .to(3.8 + i, { opacity: 225 }, { easing: 'sineInOut' })
        .to(4.2 + i, { opacity: 145 }, { easing: 'sineInOut' })
        .union().repeatForever(), true);
    }

    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const upper = i >= 2;
      const leaf = this.node(front, 'coast-edge-leaves-' + i, side * 192,
        bottom + (upper ? 57 : 16));
      const g = leaf.addComponent(Graphics);
      for (let j = 0; j < 3; j++) {
        const x = -side * (j * 9 + 2), y = j * 7;
        this.leaf(g, x, y, 15 + j * 2, 5 + j, upper ? '#528b66' : '#2f6a52', 190);
      }
      leaf.setRotationFromEuler(0, 0, side * (upper ? -34 : 21));
      if (!this.reducedMotion) {
        const angle = leaf.eulerAngles.z;
        this.run(leaf, tween(leaf)
          .to(2.8 + i * .23, { eulerAngles: new Vec3(0, 0, angle + side * 3) }, { easing: 'sineInOut' })
          .to(3.2 + i * .23, { eulerAngles: new Vec3(0, 0, angle) }, { easing: 'sineInOut' })
          .union().repeatForever(), true);
      }
    }

    // Twelve tiny moving accents; reduced motion keeps only the fixed framing.
    if (this.reducedMotion) return;
    const span = Math.max(30, this.sceneHeight - 160);
    for (let i = 0; i < 8; i++) {
      const mote = this.node(back, 'coast-mote-' + i,
        -167 + (i * 47 % 322), bottom + 44 + (i * 59 % span));
      const g = mote.addComponent(Graphics);
      if(i<4){
        mote.setPosition(-70+i*50,top-this.sceneHeight*(.235+i*.012),0);
        g.strokeColor=this.color('#e7fbff',175);g.lineWidth=1.1;
        g.moveTo(-6,0);g.lineTo(6,0);g.moveTo(-2,2);g.lineTo(3,2);g.stroke();
      }else this.glow(g, i % 3 === 0 ? '#f9ecb3' : '#efffd7', 2.4, 110);
      const opacity = mote.addComponent(UIOpacity);
      opacity.opacity = 65 + i % 3 * 24;
      this.run(mote, tween(opacity)
        .to(1.6 + i * .19, { opacity: 175 }, { easing: 'sineInOut' })
        .to(2.1 + i * .11, { opacity: 35 }, { easing: 'sineInOut' })
        .union().repeatForever(), true);
      this.run(mote, tween(mote)
        .by(3.3 + i * .17, { position: new Vec3(7, 10, 0) }, { easing: 'sineInOut' })
        .by(3.3 + i * .17, { position: new Vec3(-7, -10, 0) }, { easing: 'sineInOut' })
        .union().repeatForever(), true);
    }
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const start = new Vec3(side * (158 + i * 3), bottom + 80 + i * span * .2, 0);
      const leaf = this.node(front, 'coast-drifting-leaf-' + i, start.x, start.y);
      this.leaf(leaf.addComponent(Graphics), 0, 0, 5.5, 2.3, '#a6c479', 185);
      leaf.setRotationFromEuler(0, 0, i * 47);
      const opacity = leaf.addComponent(UIOpacity);
      opacity.opacity = 0;
      this.run(leaf, tween(opacity).delay(i * .6)
        .to(1, { opacity: 160 }).delay(3.3).to(1.2, { opacity: 0 })
        .delay(.8).union().repeatForever(), true);
      this.run(leaf, tween(leaf).delay(i * .6)
        .by(5.5, { position: new Vec3(-side * 19, -28, 0), eulerAngles: new Vec3(0, 0, side * 80) },
          { easing: 'sineInOut' })
        .call(() => { leaf.setPosition(start); leaf.setRotationFromEuler(0, 0, i * 47); })
        .delay(.8).union().repeatForever(), true);
    }
  }

  impact(pos: Vec3, type: string, strong: boolean): void {
    if (this.disposed || !this.fx.isValid) return;
    const element = this.element(type), tint = this.tint(element);
    const root = this.node(this.fx, 'app-impact-' + element, pos.x, pos.y);
    const opacity = root.addComponent(UIOpacity);
    const core = this.node(root, 'impact-light', 0, 0);
    const g = core.addComponent(Graphics);
    this.glow(g, tint, strong ? 18 : 14, 88);
    if (element === 'water') {
      g.strokeColor = this.color('#ccf9ff', 220);
      g.lineWidth = 2.5;
      g.ellipse(0, 0, 21, 13);
      g.stroke();
      g.strokeColor = this.color('#5ac9ec', 150);
      g.ellipse(0, -2, 30, 18);
      g.stroke();
    } else {
      g.strokeColor = this.color(tint, 150);
      g.lineWidth = element === 'grass' ? 2 : 3;
      g.arc(0, 0, strong ? 24 : 19, .2, Math.PI * 1.7, false);
      g.stroke();
    }
    core.setScale(.45, .45, 1);
    this.run(core, tween(core).to(.28, {
      scale: new Vec3(strong ? 1.45 : 1.1, strong ? 1.45 : 1.1, 1),
    }, { easing: 'quadOut' }));

    const count = this.reducedMotion ? 3 : strong ? 9 : 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + .22;
      const particle = this.node(root, 'impact-particle-' + i, 0, 0);
      const ink = particle.addComponent(Graphics);
      if (element === 'grass') this.leaf(ink, 0, 0, 7, 3.2, i % 2 ? '#f0e996' : '#8bd96b', 235);
      else if (element === 'water') this.drop(ink, '#a8f0ff', 4, 205);
      else if (element === 'fire') this.flame(ink, i % 2 ? '#ffb64d' : '#ff7754', 5);
      else {
        ink.fillColor = this.color(tint, 220);
        ink.ellipse(0, 0, 2, 5);
        ink.fill();
      }
      particle.setRotationFromEuler(0, 0, angle * 180 / Math.PI - 90);
      const radius = (strong ? 47 : 34) * (this.reducedMotion ? .55 : 1) + i % 3 * 5;
      this.run(particle, tween(particle).to(.3 + i % 3 * .035, {
        position: new Vec3(Math.cos(angle) * radius,
          Math.sin(angle) * radius + (element === 'fire' ? 14 : element === 'water' ? -9 : 3), 0),
        scale: new Vec3(.35, .35, 1),
        eulerAngles: new Vec3(0, 0, angle * 180 / Math.PI + (element === 'grass' ? 70 : -90)),
      }, { easing: 'quadOut' }));
    }
    this.run(root, tween(opacity).delay(.09).to(.29, { opacity: 0 }).call(() => this.remove(root)));
  }

  projectile(from: Vec3, to: Vec3, type: string, onHit: () => void): void {
    if (this.disposed || !this.fx.isValid) return;
    const element = this.element(type), tint = this.tint(element);
    const root = this.node(this.fx, 'app-projectile-' + element, from.x, from.y);
    const opacity = root.addComponent(UIOpacity);
    const orb = this.node(root, 'projectile-head', 0, 0);
    const g = orb.addComponent(Graphics);
    this.glow(g, tint, element === 'fire' ? 11 : 9, 95);
    if (element === 'fire') this.flame(g, '#ffad49', 9);
    else if (element === 'grass') {
      this.leaf(g, -3, 0, 12, 5.5, '#91d66a', 255);
      this.leaf(g, 4, 2, 8, 3, '#eff2af', 230);
    } else if (element === 'water') this.drop(g, '#7cdef5', 8, 250);
    else {
      g.fillColor = this.color('#fff6d7', 240);
      g.circle(0, 0, 5);
      g.fill();
    }
    const tail: Node[] = [];
    for (let i = 0; i < 3; i++) {
      const spark = this.node(this.fx, 'projectile-trail-' + i, from.x, from.y);
      this.glow(spark.addComponent(Graphics), tint, 4 - i * .7, 90 - i * 20);
      tail.push(spark);
    }
    const start = from.clone(), end = to.clone(), state = { progress: 0 };
    const arcHeight = this.reducedMotion ? 8 : Math.min(45, Math.abs(end.x - start.x) * .17 + 14);
    const at = (progress: number): Vec3 => new Vec3(
      start.x + (end.x - start.x) * progress,
      start.y + (end.y - start.y) * progress + Math.sin(progress * Math.PI) * arcHeight,
      start.z + (end.z - start.z) * progress,
    );
    let hit = false;
    this.run(root, tween(state).to(.32, { progress: 1 }, {
      easing: 'sineIn',
      onUpdate: () => {
        root.setPosition(at(state.progress));
        const tangentY = end.y - start.y + Math.cos(state.progress * Math.PI) * arcHeight * Math.PI;
        orb.setRotationFromEuler(0, 0, Math.atan2(tangentY, end.x - start.x) * 180 / Math.PI - 90);
        opacity.opacity = Math.min(255, 110 + state.progress * 550);
        for (let i = 0; i < tail.length; i++) tail[i].setPosition(at(Math.max(0, state.progress - .045 * (i + 1))));
      },
    }).call(() => {
      for (const spark of tail) this.remove(spark);
      this.remove(root);
      if (!hit && !this.disposed) { hit = true; onHit(); }
    }));
  }

  shake(strong = false): void {
    if (this.disposed || this.reducedMotion || !this.stage.isValid) return;
    if (this.shakeMotion) {
      this.shakeMotion.stop();
      this.motions.delete(this.shakeMotion);
      this.nodeMotions.get(this.stage)?.delete(this.shakeMotion);
    }
    if (this.shakeHome) this.stage.setPosition(this.shakeHome);
    const home = this.stage.position.clone();
    this.shakeHome = home;
    const state = { x: 0, y: 0 }, amount = strong ? 3.2 : 1.8;
    const update = () => {
      if (this.stage.isValid) this.stage.setPosition(home.x + state.x, home.y + state.y, home.z);
    };
    const motion = tween(state)
      .to(.035, { x: -amount, y: amount * .3 }, { onUpdate: update })
      .to(.045, { x: amount * .65, y: -amount * .24 }, { onUpdate: update })
      .to(.05, { x: -amount * .3, y: 0 }, { onUpdate: update })
      .to(.07, { x: 0, y: 0 }, { onUpdate: update })
      .call(() => {
        if (this.stage.isValid) this.stage.setPosition(home);
        this.shakeHome = null;
        this.shakeMotion = null;
      });
    this.shakeMotion = motion;
    this.run(this.stage, motion);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const motion of this.motions) motion.stop();
    this.motions.clear();
    this.nodeMotions.clear();
    if (this.shakeHome && this.stage.isValid) this.stage.setPosition(this.shakeHome);
    this.shakeHome = null;
    this.shakeMotion = null;
    for (const node of this.nodes) if (node.isValid) node.destroy();
    this.nodes.clear();
  }

  private node(parent: Node, name: string, x: number, y: number): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.setPosition(x, y, 0);
    node.addComponent(UITransform).setContentSize(64, 64);
    this.nodes.add(node);
    return node;
  }

  private run<T extends object>(owner: Node, motion: Tween<T>, looping = false): void {
    this.motions.add(motion);
    let owned = this.nodeMotions.get(owner);
    if (!owned) { owned = new Set(); this.nodeMotions.set(owner, owned); }
    owned.add(motion);
    if (!looping) motion.call(() => {
      this.motions.delete(motion);
      owned!.delete(motion);
      if (!owned!.size) this.nodeMotions.delete(owner);
    });
    motion.start();
  }

  private remove(root: Node): void {
    for (const child of [...root.children]) if (this.nodes.has(child)) this.remove(child);
    for (const motion of this.nodeMotions.get(root) || []) {
      motion.stop();
      this.motions.delete(motion);
    }
    this.nodeMotions.delete(root);
    this.nodes.delete(root);
    if (root.isValid) root.destroy();
  }

  private element(type: string): Element {
    if (type === '火' || type === 'fire') return 'fire';
    if (type === '草' || type === 'grass') return 'grass';
    if (type === '水' || type === 'water') return 'water';
    return 'other';
  }

  private tint(element: Element): string {
    return element === 'fire' ? '#ffc16b' : element === 'grass' ? '#b6e881'
      : element === 'water' ? '#8fe7ff' : '#f5db98';
  }

  private color(hex: string, alpha = 255): Color {
    const color = new Color();
    Color.fromHEX(color, hex);
    color.a = alpha;
    return color;
  }

  private glow(g: Graphics, tint: string, radius: number, alpha: number): void {
    for (let layer = 3; layer > 0; layer--) {
      g.fillColor = this.color(tint, alpha / (layer * layer));
      g.circle(0, 0, radius * (1 + (layer - 1) * .45));
      g.fill();
    }
  }

  private leaf(g: Graphics, x: number, y: number, length: number, width: number, tint: string, alpha: number): void {
    g.fillColor = this.color(tint, alpha);
    g.moveTo(x - length, y);
    g.quadraticCurveTo(x, y + width * 2, x + length, y);
    g.quadraticCurveTo(x, y - width * 1.4, x - length, y);
    g.close();
    g.fill();
    g.strokeColor = this.color('#d9edac', alpha * .55);
    g.lineWidth = .8;
    g.moveTo(x - length * .7, y);
    g.quadraticCurveTo(x, y + width * .2, x + length * .75, y);
    g.stroke();
  }

  private drop(g: Graphics, tint: string, size: number, alpha: number): void {
    g.fillColor = this.color(tint, alpha);
    g.moveTo(0, size * 1.7);
    g.bezierCurveTo(size * 1.7, 0, size * .85, -size, 0, -size);
    g.bezierCurveTo(-size * .85, -size, -size * 1.7, 0, 0, size * 1.7);
    g.close();
    g.fill();
    g.fillColor = this.color('#efffff', alpha * .8);
    g.ellipse(-size * .25, size * .15, size * .16, size * .4);
    g.fill();
  }

  private flame(g: Graphics, tint: string, size: number): void {
    g.fillColor = this.color(tint, 235);
    g.moveTo(0, size * 1.8);
    g.bezierCurveTo(size * .3, size * .3, size * 1.2, size * .45, size * .7, -size * .4);
    g.bezierCurveTo(size * .1, -size * 1.2, -size, -size * .7, -size * .65, size * .5);
    g.quadraticCurveTo(-size * .2, size * .1, 0, size * 1.8);
    g.close();
    g.fill();
    g.fillColor = this.color('#fff1b7', 245);
    g.ellipse(0, -size * .05, size * .3, size * .5);
    g.fill();
  }
}
