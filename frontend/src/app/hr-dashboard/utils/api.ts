// src/app/hr-dashboard/utils/api.ts
import { Job, Candidate, Interview } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://hr-ai-agent-backend-1lrx.onrender.com';

export const api = {
    async get<T>(endpoint: string): Promise<T> {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return await res.json();
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to post to ${endpoint}`);
        return await res.json();
    },

    async patch<T>(endpoint: string, data: any): Promise<T> {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to patch ${endpoint}`);
        return await res.json();
    },
};

// Helper functions for specific endpoints
export const fetchJobs = () => api.get<Job[]>("/jobs");
export const fetchCandidates = () => api.get<Candidate[]>("/candidates");
export const fetchInterviews = () => api.get<Interview[]>("/interviews");
export const createJob = (data: any) => api.post<Job>("/jobs", data);
export const updateCandidate = (id: string, data: any) => api.patch(`/candidates/${id}`, data);
export const createInterview = (data: Interview) => api.post<Interview>("/interviews", data);
export const updateJob = (id: string, data: any) => api.patch(`/jobs/${id}`, data);