export const STREAK_COUNT_KEY = 'streakCount';
export const LAST_STREAK_UPDATE_KEY = 'lastStreakUpdateDate';
export const LAST_CHECKIN_KEY = 'lastCheckIn';

const isDateWeekend = (date: Date): boolean => {
	const day = date.getDay();
	return day === 0 || day === 6; // Sunday or Saturday
};

const isDateWeekday = (date: Date): boolean => {
	return !isDateWeekend(date);
};

export const initializeCheckinState = (): { streakCount: number; hasCheckedInToday: boolean } => {
	let currentStreakCount = 0;
	let todayCheckedIn = false;
	const today = new Date();
	const todayNormalized = new Date(today.toDateString()); // For date comparisons, ignoring time

	// Check if already checked in today
	const lastCheckIn = localStorage.getItem(LAST_CHECKIN_KEY);
	if (lastCheckIn) {
		const lastCheckInDate = new Date(lastCheckIn);
		todayCheckedIn = lastCheckInDate.toDateString() === today.toDateString();
	}

	// Initialize and validate streak
	currentStreakCount = parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '0');
	const strLastStreakUpdate = localStorage.getItem(LAST_STREAK_UPDATE_KEY);

	if (strLastStreakUpdate) {
		const lastStreakUpdateDate = new Date(new Date(strLastStreakUpdate).toDateString());

		// If the last streak update was before today, check for missed weekdays
		if (lastStreakUpdateDate.getTime() < todayNormalized.getTime()) {
			let dateToCheck = new Date(lastStreakUpdateDate);
			dateToCheck.setDate(dateToCheck.getDate() + 1); // Start checking from the day after the last update

			let missedWeekday = false;
			while (dateToCheck.getTime() < todayNormalized.getTime()) {
				if (isDateWeekday(dateToCheck)) {
					missedWeekday = true;
					break;
				}
				dateToCheck.setDate(dateToCheck.getDate() + 1);
			}

			if (missedWeekday) {
				currentStreakCount = 0;
				localStorage.setItem(STREAK_COUNT_KEY, '0');
				// localStorage.removeItem(LAST_STREAK_UPDATE_KEY); // Optional: remove if streak is broken
			}
		}
	} else {
		// No streak history, ensure it's 0
		currentStreakCount = 0;
		localStorage.setItem(STREAK_COUNT_KEY, '0');
	}

	return { streakCount: currentStreakCount, hasCheckedInToday: todayCheckedIn };
};

export const handleCheckIn = (): { newStreakCount: number; newHasCheckedInToday: boolean } => {
	// 1. Mark as checked in for today
	localStorage.setItem(LAST_CHECKIN_KEY, new Date().toISOString());

	// 2. Update streak logic
	let updatedStreak = parseInt(localStorage.getItem(STREAK_COUNT_KEY) || '0');
	const strLastUpdate = localStorage.getItem(LAST_STREAK_UPDATE_KEY);
	const today = new Date(new Date().toDateString()); // Normalized to the start of today

	let lastUpdateDate: Date | null = null;
	if (strLastUpdate) {
		lastUpdateDate = new Date(new Date(strLastUpdate).toDateString());
	}

	// Only update streak if it wasn't already updated for today's check-in or if it's the first check-in
	// This also ensures if a user somehow bypasses the disabled button, streak isn't incremented multiple times a day
	if (!lastUpdateDate || lastUpdateDate.getTime() < today.getTime()) {
		if (!lastUpdateDate) {
			// First check-in ever or after a full reset with no LAST_STREAK_UPDATE_KEY
			updatedStreak = 1;
		} else {
			const daysDiff = (today.getTime() - lastUpdateDate.getTime()) / (1000 * 3600 * 24);

			if (daysDiff === 1) {
				updatedStreak++; // Checked in on consecutive day
			} else if (daysDiff > 1) {
				// Gap since last check-in that updated the streak
				let missedWeekdayInGap = false;
				let tempDate = new Date(lastUpdateDate);
				// Check days *between* lastUpdateDate and today
				for (let i = 0; i < daysDiff - 1; i++) {
					tempDate.setDate(tempDate.getDate() + 1);
					if (isDateWeekday(tempDate)) {
						missedWeekdayInGap = true;
						break;
					}
				}
				if (missedWeekdayInGap) {
					updatedStreak = 1; // Reset streak to 1 for today's check-in
				} else {
					updatedStreak++; // No weekdays missed in the gap (e.g., Fri to Mon)
				}
			} else if (daysDiff === 0) {
				// This case (daysDiff === 0) means lastUpdateDate is today.
				// If streak was already 0 and this is the first check-in today, it should become 1.
				if (updatedStreak === 0) updatedStreak = 1;
				// Otherwise, streak has already been updated today, no change needed here.
				// The outer if `(!lastUpdateDate || lastUpdateDate.getTime() < today.getTime())` should ideally prevent this often,
				// but good to be safe.
			}
		}
		localStorage.setItem(STREAK_COUNT_KEY, updatedStreak.toString());
		localStorage.setItem(LAST_STREAK_UPDATE_KEY, today.toISOString());
	}

	return { newStreakCount: updatedStreak, newHasCheckedInToday: true };
};
