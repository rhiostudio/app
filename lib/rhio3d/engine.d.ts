/* Types for the generated RHIO modules. engine.js = 3D engine (lazy); data.js = presets etc.; content.js = docs text. */
export type Look = {
  kind: 'human' | 'companion'; model?: 'scout' | 'maker' | 'guardian' | null; build: string; headStyle?: 'human' | 'screen';
  skin: string; eyes: string; facial: string;
  hair: { style: string; color: string };
  top: { type: string; color: string; accent: string };
  bottom: { type: string; color: string }; legwear: string;
  shoes: { type: string; color: string };
  head: string; face: string; back: string; accColor: string; glow: string; finish: 'matte' | 'gloss';
};
export type Preset = { id: string; name: string; role: string; desc: string; sig: string; cat: 'Humanoid' | 'Companion'; look: Partial<Look> & { kind: Look['kind'] } };
export type Power = { id: string; name: string; key: string; cd: number; desc: string };
export type Wardrobe = Record<'build' | 'hair' | 'facial' | 'top' | 'bottom' | 'legwear' | 'shoes' | 'head' | 'face' | 'back' | 'finish', [string, string][]> & { swatches: string[]; skin: string[]; hairColors: string[]; eyes: string[]; glow: string[] };
export type DocSection = { id: string; title: string; body: string };
export type RoadmapPhase = { phase: string; title: string; when: string; status: 'done' | 'now' | 'planned' | 'idea'; items: [string, string][] };
export type Content = { version: string; docs: DocSection[]; paper: { title: string; subtitle: string; status: string; sections: DocSection[] }; roadmap: RoadmapPhase[] };
export type Stage = {
  setLook(look: Partial<Look>): void; start(): void; stop(): void; dispose(): void; cast(id: string): number;
  anim: { play(name: string, o?: { temp?: boolean; dur?: number; blend?: number }): void; stance: string; cur: string; paused: boolean; speed: number };
  yaw: number; yawVel: number; zoom: number;
};
export type Engine = {
  Stage: new (canvas: HTMLCanvasElement, o?: { onEvent?: (e: string) => void }) => Stage;
  renderThumb(look: Partial<Look>, w?: number, h?: number): string;
  normalizeLook(look?: Partial<Look>): Look;
};
export function createEngine(THREE: unknown): Engine;
