'use client';

import ReactConfetti from 'react-confetti';

interface ConfettiCelebrationProps {
	show: boolean;
}

export default function ConfettiCelebration({
	show,
}: ConfettiCelebrationProps) {
	if (!show) {
		return null;
	}

	return <ReactConfetti />;
}
