// src/app/hr-dashboard/components/CreateJobForm.tsx
import React, { useState, ChangeEvent } from 'react';
import { CreateJobData } from '../utils/types';

interface CreateJobFormProps {
    onBack: () => void;
    onSuccess: (data: CreateJobData) => void;
}

const CreateJobForm: React.FC<CreateJobFormProps> = ({ onBack, onSuccess }) => {
    const [formData, setFormData] = useState<CreateJobData>({
        title: "",
        department: "",
        location: "",
        target_shortlist: 5,
        closing_date: "",
        daily_start_time: "09:00",
        daily_end_time: "17:00",
        interview_duration: 60,
        requirements: "",
        description: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'interview_duration' || name === 'target_shortlist'
                ? parseInt(value)
                : value
        }));
    };

    return (
        <div className="action-container">
            <h2 style={{ marginBottom: "1.5rem" }}>Create New Position</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                    <label className="form-label">Job Title*</label>
                    <input 
                        className="form-input" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        placeholder="e.g. Senior Engineer" 
                        required
                    />
                </div>
                <div>
                    <label className="form-label">Department*</label>
                    <input 
                        className="form-input" 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        placeholder="e.g. Engineering, Marketing, HR" 
                        required
                    />
                </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Job Description*</label>
                <textarea 
                    className="form-input" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Enter detailed job description..."
                    rows={3}
                    style={{ resize: "vertical" }}
                    required
                />
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Requirements*</label>
                <textarea 
                    className="form-input" 
                    name="requirements" 
                    value={formData.requirements} 
                    onChange={handleChange} 
                    placeholder="List key requirements and qualifications..."
                    rows={3}
                    style={{ resize: "vertical" }}
                    required
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                    <label className="form-label">Location*</label>
                    <input 
                        className="form-input" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleChange} 
                        placeholder="e.g. Remote, Abu Dhabi, UAE" 
                        required
                    />
                </div>
                <div>
                    <label className="form-label">Target Shortlist</label>
                    <input 
                        className="form-input" 
                        type="number" 
                        name="target_shortlist" 
                        value={formData.target_shortlist} 
                        onChange={handleChange} 
                        min="1"
                    />
                </div>
                <div>
                    <label className="form-label">Closing Date*</label>
                    <input 
                        className="form-input" 
                        type="date" 
                        name="closing_date" 
                        value={formData.closing_date} 
                        onChange={handleChange} 
                        required
                    />
                </div>
            </div>

            {/* <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "var(--accent-primary)" }}>Auto-Scheduling Configuration</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div>
                        <label className="form-label">Daily Start Time</label>
                        <input 
                            className="form-input" 
                            type="time" 
                            name="daily_start_time" 
                            value={formData.daily_start_time} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div>
                        <label className="form-label">Daily End Time</label>
                        <input 
                            className="form-input" 
                            type="time" 
                            name="daily_end_time" 
                            value={formData.daily_end_time} 
                            onChange={handleChange} 
                        />
                    </div>
                    <div>
                        <label className="form-label">Interview Duration (Mins)</label>
                        <input 
                            className="form-input" 
                            type="number" 
                            name="interview_duration" 
                            value={formData.interview_duration} 
                            onChange={handleChange} 
                            min="15"
                            step="15"
                        />
                    </div>
                </div>
            </div> */}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                <button className="btn btn-secondary cursor-pointer" onClick={onBack}>Cancel</button>
                <button 
                    className="btn btn-primary cursor-pointer" 
                    onClick={() => onSuccess(formData)}
                    disabled={!formData.title || !formData.department || !formData.description || !formData.requirements || !formData.location || !formData.closing_date}
                >
                    Create Job
                </button>
            </div>
        </div>
    );
};

export default CreateJobForm;