export type SimpleCallback = () => void;
export type SimpleGCallback<T> = (args?: T) => void;

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

export interface GEEIPlaybackObject {
  hasExternalTimeSource: boolean;
  onAnimationEnd: SimpleGCallback<GEEIPlaybackObject>;
  extraParams;

  // getters
  currentTime: number;
  animationSeconds: number;
  playingSpeed: number;
  name: string;

  initialize(data): void;
  invalidateAnimations(): void;
  play(): void;
  stop(): void;
  pause(inTime: number): void;
  update(dt: number): void;
}
