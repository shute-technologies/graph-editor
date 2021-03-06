export type SimpleCallback = () => void;
export type SimpleGCallback<T> = (args?: T) => void;
export interface GEEDictionary<T> { [Key: string]: T; }

export interface GEEIAnimatorData {
  startGraph: string;
  graphs: Array<GEEIGraphData>;
}

export interface GEEIConnectionData {
  graphToName: string;
  extraParams;
}

export interface GEEIGraphData {
  x: number;
  y: number;
  name: string;
  speed: number;
  isLoop: boolean;
  isStart: boolean;
  connections: Array<GEEIConnectionData>;
  extraParams;
  playbackObject: GEEIPlaybackObject;
}

export interface GEEIAnimationResult {
  value;
  extraParams;
}

export interface GEEIPlaybackObject {
  hasExternalTimeSource: boolean;
  onAnimationEnd: SimpleGCallback<GEEIPlaybackObject>;
  extraParams;

  // getters
  isPlaying: boolean;
  currentTime: number;
  animationSeconds: number;
  playingSpeed: number;
  animations: GEEDictionary<GEEIAnimationResult>;

  initialize(data): void;
  invalidateAnimations(): void;
  play(): void;
  stop(): void;
  pause(inTime: number): void;
  update(dt: number): void;
  destroy();
}
