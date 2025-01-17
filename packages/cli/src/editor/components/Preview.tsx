import type {Size} from '@remotion/player';
import {PlayerInternals} from '@remotion/player';
import React, {useContext, useEffect, useMemo, useRef} from 'react';
import type {CanvasContent} from 'remotion';
import {getStaticFiles, Internals, staticFile} from 'remotion';
import {formatBytes} from '../../format-bytes';
import {
	checkerboardBackgroundColor,
	checkerboardBackgroundImage,
	getCheckerboardBackgroundPos,
	getCheckerboardBackgroundSize,
} from '../helpers/checkerboard-background';
import {StudioServerConnectionCtx} from '../helpers/client-id';
import {LIGHT_TEXT} from '../helpers/colors';
import type {Dimensions} from '../helpers/is-current-selected-still';
import {CheckerboardContext} from '../state/checkerboard';
import {PreviewSizeContext} from '../state/preview-size';
import {JSONViewer} from './JSONViewer';
import {Spacing} from './layout';
import {Spinner} from './Spinner';
import {TextViewer} from './TextViewer';

const spinnerContainer: React.CSSProperties = {
	display: 'flex',
	flex: 1,
	justifyContent: 'center',
	alignItems: 'center',
};

const msgStyle: React.CSSProperties = {
	fontSize: 13,
	color: 'white',
	fontFamily: 'sans-serif',
	display: 'flex',
	justifyContent: 'center',
};

const errMsgStyle: React.CSSProperties = {
	...msgStyle,
	color: LIGHT_TEXT,
};

type AssetFileType = 'audio' | 'video' | 'image' | 'json' | 'txt' | 'other';
export const getPreviewFileType = (fileName: string | null): AssetFileType => {
	if (!fileName) {
		return 'other';
	}

	const audioExtensions = ['mp3', 'wav', 'ogg', 'aac'];
	const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'webm'];
	const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

	const fileExtension = fileName.split('.').pop()?.toLowerCase();
	if (fileExtension === undefined) {
		throw new Error('File extension is undefined');
	}

	if (audioExtensions.includes(fileExtension)) {
		return 'audio';
	}

	if (videoExtensions.includes(fileExtension)) {
		return 'video';
	}

	if (imageExtensions.includes(fileExtension)) {
		return 'image';
	}

	if (fileExtension === 'json') {
		return 'json';
	}

	if (fileExtension === 'txt') {
		return 'txt';
	}

	return 'other';
};

const checkerboardSize = 49;

const containerStyle = (options: {
	scale: number;
	xCorrection: number;
	yCorrection: number;
	width: number;
	height: number;
	checkerboard: boolean;
}): React.CSSProperties => {
	return {
		transform: `scale(${options.scale})`,
		marginLeft: options.xCorrection,
		marginTop: options.yCorrection,
		width: options.width,
		height: options.height,
		display: 'flex',
		position: 'absolute',
		backgroundColor: checkerboardBackgroundColor(options.checkerboard),
		backgroundImage: checkerboardBackgroundImage(options.checkerboard),
		backgroundSize:
			getCheckerboardBackgroundSize(checkerboardSize) /* Must be a square */,
		backgroundPosition:
			getCheckerboardBackgroundPos(
				checkerboardSize,
			) /* Must be half of one side of the square */,
	};
};

const AssetComponent: React.FC<{currentAsset: string}> = ({currentAsset}) => {
	const fileType = getPreviewFileType(currentAsset);
	const staticFileSrc = staticFile(currentAsset);
	const staticFiles = getStaticFiles();
	const connectionStatus = useContext(StudioServerConnectionCtx).type;

	const exists = staticFiles.find((file) => file.name === currentAsset);

	if (connectionStatus === 'disconnected') {
		return <div style={errMsgStyle}>Studio server disconnected</div>;
	}

	if (!exists) {
		return (
			<div style={errMsgStyle}>
				{currentAsset} does not exist in your public folder.
			</div>
		);
	}

	const fileSize = () => {
		const fileFromStaticFiles = staticFiles.find(
			(file) => file.name === currentAsset,
		);
		if (fileFromStaticFiles) {
			return formatBytes(fileFromStaticFiles?.sizeInBytes);
		}
	};

	if (!currentAsset) {
		return null;
	}

	if (fileType === 'audio') {
		try {
			return (
				<div>
					<audio src={staticFileSrc} controls />
				</div>
			);
		} catch (err) {
			return <div style={errMsgStyle}>The audio could not be loaded</div>;
		}
	}

	if (fileType === 'video') {
		try {
			return <video src={staticFileSrc} controls />;
		} catch (err) {
			return <div style={errMsgStyle}>The video could not be loaded</div>;
		}
	}

	if (fileType === 'image') {
		try {
			return <img src={staticFileSrc} />;
		} catch (err) {
			return <div style={errMsgStyle}>The image could not be loaded</div>;
		}
	}

	if (fileType === 'json') {
		return <JSONViewer src={staticFileSrc} />;
	}

	if (fileType === 'txt') {
		return <TextViewer src={staticFileSrc} />;
	}

	return (
		<>
			<div style={msgStyle}>{currentAsset}</div>
			<Spacing y={1} />
			<div style={msgStyle}>Size: {fileSize()} </div>
		</>
	);
};

export const VideoPreview: React.FC<{
	canvasSize: Size;
	contentDimensions: Dimensions | 'none' | null;
	canvasContent: CanvasContent;
}> = ({canvasSize, contentDimensions, canvasContent}) => {
	if (!contentDimensions) {
		return (
			<div style={spinnerContainer}>
				<Spinner duration={0.5} size={24} />
			</div>
		);
	}

	return (
		<CompWhenItHasDimensions
			contentDimensions={contentDimensions}
			canvasSize={canvasSize}
			canvasContent={canvasContent}
		/>
	);
};

const CompWhenItHasDimensions: React.FC<{
	contentDimensions: Dimensions | 'none';
	canvasSize: Size;
	canvasContent: CanvasContent;
}> = ({contentDimensions, canvasSize, canvasContent}) => {
	const {size: previewSize} = useContext(PreviewSizeContext);

	const {centerX, centerY, yCorrection, xCorrection, scale} = useMemo(() => {
		if (contentDimensions === 'none') {
			return {
				centerX: 0,
				centerY: 0,
				yCorrection: 0,
				xCorrection: 0,
				scale: 1,
			};
		}

		return PlayerInternals.calculateCanvasTransformation({
			canvasSize,
			compositionHeight: contentDimensions.height,
			compositionWidth: contentDimensions.width,
			previewSize: previewSize.size,
		});
	}, [canvasSize, contentDimensions, previewSize.size]);

	const outer: React.CSSProperties = useMemo(() => {
		return {
			width:
				contentDimensions === 'none' ? '100%' : contentDimensions.width * scale,
			height:
				contentDimensions === 'none'
					? '100%'
					: contentDimensions.height * scale,
			display: 'flex',
			flexDirection: 'column',
			position: 'absolute',
			left: centerX - previewSize.translation.x,
			top: centerY - previewSize.translation.y,
			overflow: 'hidden',
			justifyContent: canvasContent.type === 'asset' ? 'center' : 'flex-start',
			alignItems:
				canvasContent.type === 'asset' &&
				getPreviewFileType(canvasContent.asset) === 'audio'
					? 'center'
					: 'normal',
		};
	}, [
		contentDimensions,
		scale,
		centerX,
		previewSize.translation.x,
		previewSize.translation.y,
		centerY,
		canvasContent,
	]);

	return (
		<div style={outer}>
			{canvasContent.type === 'asset' ? (
				<AssetComponent currentAsset={canvasContent.asset} />
			) : (
				<PortalContainer
					contentDimensions={contentDimensions as Dimensions}
					scale={scale}
					xCorrection={xCorrection}
					yCorrection={yCorrection}
				/>
			)}
		</div>
	);
};

const PortalContainer: React.FC<{
	scale: number;
	xCorrection: number;
	yCorrection: number;
	contentDimensions: Dimensions;
}> = ({scale, xCorrection, yCorrection, contentDimensions}) => {
	const {checkerboard} = useContext(CheckerboardContext);

	const style = useMemo((): React.CSSProperties => {
		return containerStyle({
			checkerboard,
			scale,
			xCorrection,
			yCorrection,
			width: contentDimensions.width,
			height: contentDimensions.height,
		});
	}, [
		checkerboard,
		contentDimensions.height,
		contentDimensions.width,
		scale,
		xCorrection,
		yCorrection,
	]);

	useEffect(() => {
		const {current} = portalContainer;
		current?.appendChild(Internals.portalNode());
		return () => {
			current?.removeChild(Internals.portalNode());
		};
	}, []);

	const portalContainer = useRef<HTMLDivElement>(null);

	return <div ref={portalContainer} style={style} />;
};
