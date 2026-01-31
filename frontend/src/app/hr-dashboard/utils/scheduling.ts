// src/app/hr-dashboard/utils/scheduling.ts
import { Job, Interview } from './types';

export const findNextAvailableSlot = (job: Job, existingInterviews: Interview[]): string | null => {
    let date = new Date();
    date.setDate(date.getDate() + 1);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const [startH, startM] = (job.daily_start_time || "09:00").split(":").map(Number);
    const [endH, endM] = (job.daily_end_time || "17:00").split(":").map(Number);
    const duration = parseInt(job.interview_duration?.toString() || "60");

    for (let i = 0; i < 30; i++) {
        if (date.getDay() === 0) {
            date.setDate(date.getDate() + 1);
            continue;
        }
        if (date.getDay() === 6) {
            date.setDate(date.getDate() + 2);
            continue;
        }

        let currentSlot = new Date(date);
        currentSlot.setHours(startH, startM, 0, 0);

        let dayEnd = new Date(date);
        dayEnd.setHours(endH, endM, 0, 0);

        while (currentSlot.getTime() + duration * 60000 <= dayEnd.getTime()) {
            const isTaken = existingInterviews.some((int) => {
                const intTime = new Date(int.scheduled_time).getTime();
                return Math.abs(intTime - currentSlot.getTime()) < 60000;
            });

            if (!isTaken) {
                return currentSlot.toISOString();
            }

            currentSlot = new Date(currentSlot.getTime() + duration * 60000);
        }

        date.setDate(date.getDate() + 1);
    }
    return null;
};