import {useCallback, useContext} from 'react';
import {Internals} from 'remotion';
import {useIsStill} from '../helpers/is-current-selected-still';
import {VolumeOffIcon, VolumeOnIcon} from '../icons/media-volume';
import {persistMuteOption} from '../state/mute';
import {ControlButton} from './ControlButton';

export const MuteToggle: React.FC<{
	muted: boolean;
	setMuted: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({muted, setMuted}) => {
	const {canvasContent} = useContext(Internals.CompositionManager);
	const onClick = useCallback(() => {
		setMuted((m) => {
			persistMuteOption(!m);
			return !m;
		});
	}, [setMuted]);
	const accessibilityLabel = muted ? 'Unmute video' : 'Mute video';

	const isStill = useIsStill();

	if (isStill || canvasContent === null || canvasContent.type === 'asset') {
		return null;
	}

	return (
		<ControlButton
			title={accessibilityLabel}
			aria-label={accessibilityLabel}
			onClick={onClick}
		>
			{muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
		</ControlButton>
	);
};
