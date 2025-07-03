'use client';

import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ConfettiCelebrationProps {
	show: boolean;
}

export default function ConfettiCelebration({
	show,
}: ConfettiCelebrationProps) {
	const { height, width } = useWindowSize();

	if (!show) {
		return null;
	}

	return <ReactConfetti height={height} width={width} />;
}
