import {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {GifLoopBehavior} from './props';

export function useCurrentGifIndex(
\tdelays: number[],
\tloopBehavior: GifLoopBehavior,
\tplayBackRate: number,
): number {
\tconst currentFrame = useCurrentFrame();
\tconst videoConfig = useVideoConfig();

\tconst duration = useMemo(() => {
\t\tif (delays.length !== 0) {
\t\t\treturn delays.reduce(
\t\t\t\t(sum: number, delay: number) => sum + (delay ?? 0),
\t\t\t\t0,
\t\t\t);
\t\t}

\t\treturn 1;
\t}, [delays]);

\tif (delays.length === 0) {
\t\treturn 0;
\t}

\tconst time = ((currentFrame / videoConfig.fps) * 1000) / playBackRate;

\tif (loopBehavior === 'pause-after-finish' && time >= duration) {
\t\treturn delays.length - 1;
\t}

\tif (loopBehavior === 'unmount-after-finish' && time >= duration) {
\t\treturn -1;
\t}

\tlet currentTime = time % duration;

\tfor (let i = 0; i < delays.length; i++) {
\t\tconst delay = delays[i];
\t\tif (currentTime < delay) {
\t\t\treturn i;
\t\t}

\t\tcurrentTime -= delay;
\t}

\treturn 0;
}