import type { Timestamp } from "firebase/firestore";


export function formatDate(date: Date): string {
    const dateObj = date;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / 1000 / 60 / 60 / 24);
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return `${dateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }
}

export function formatTimestampDifference(start: Timestamp, current: Timestamp) {
    const difference = current.toDate().getTime() - start.toDate().getTime();
    const minutes = Math.floor(difference / 60000);
    const seconds = Math.floor((difference % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};