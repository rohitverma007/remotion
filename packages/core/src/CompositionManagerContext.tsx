import {createContext} from 'react';
import type {AnyZodObject} from 'zod';
import type {AnyComposition, TComposition} from './CompositionManager.js';
import type {TFolder} from './Folder.js';
import type {VideoConfig} from './video-config.js';

export type BaseMetadata = Pick<
	VideoConfig,
	'durationInFrames' | 'fps' | 'props' | 'height' | 'width'
>;

export type CanvasContent =
	| {
			type: 'composition';
			compositionId: string;
	  }
	| {
			type: 'asset';
			asset: string;
	  };

export type CompositionManagerContext = {
	compositions: AnyComposition[];
	registerComposition: <
		Schema extends AnyZodObject,
		Props extends Record<string, unknown>,
	>(
		comp: TComposition<Schema, Props>,
	) => void;
	unregisterComposition: (name: string) => void;
	registerFolder: (name: string, parent: string | null) => void;
	unregisterFolder: (name: string, parent: string | null) => void;
	setCurrentCompositionMetadata: (metadata: BaseMetadata) => void;
	currentCompositionMetadata: BaseMetadata | null;
	folders: TFolder[];
	canvasContent: CanvasContent | null;
	setCanvasContent: (canvasContent: CanvasContent | null) => void;
};

export const CompositionManager = createContext<CompositionManagerContext>({
	compositions: [],
	registerComposition: () => undefined,
	unregisterComposition: () => undefined,
	registerFolder: () => undefined,
	unregisterFolder: () => undefined,
	setCurrentCompositionMetadata: () => undefined,
	folders: [],
	currentCompositionMetadata: null,
	canvasContent: null,
	setCanvasContent: () => undefined,
});
