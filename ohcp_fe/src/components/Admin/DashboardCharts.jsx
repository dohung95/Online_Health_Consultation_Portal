import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../../services/adminAnalyticsApi';
import './DashboardCharts.css';

const DashboardCharts = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState([]);
    const [weeklyAppointments, setWeeklyAppointments] = useState([]);
    const [monthlyAppointments, setMonthlyAppointments] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    // Generate year options from current year to 2030
    const yearOptions = [];
    for (let year = currentYear; year <= 2030; year++) {
        yearOptions.push(year);
    }

    useEffect(() => {
        fetchAllData(selectedYear);
    }, [selectedYear]);

    const fetchAllData = async (year) => {
        try {
            setLoading(true);
            const [patients, weekly, monthly, revenue] = await Promise.all([
                analyticsApi.getPatientRegistrations(year),
                analyticsApi.getAppointmentsByWeek(year, 0), // 0 = current month
                analyticsApi.getAppointmentsByMonth(year),
                analyticsApi.getRevenueByMonth(year)
            ]);

            setPatientData(patients.data || []);
            setWeeklyAppointments(weekly.data || []);
            setMonthlyAppointments(monthly.data || []);
            setRevenueData(revenue.data || []);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value));
    };

    const handleCurrentYear = () => {
        setSelectedYear(currentYear);
    };

    if (loading) {
        return (
            <div className="dashboard-charts-loading">
                <div className="spinner-border" style={{ color: 'var(--admin-primary)' }} role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-charts">
            {/* Year Selector */}
            <div className="year-selector-container">
                <div className="year-selector-header">
                    <h4 className="year-selector-title">
                        <i className="bi bi-calendar-range me-2"></i>
                        Analytics Year Filter
                    </h4>
                    <div className="year-selector-controls">
                        <div className="year-select-wrapper">
                            <i className="bi bi-calendar3 select-icon"></i>
                            <select
                                className="year-select"
                                value={selectedYear}
                                onChange={handleYearChange}
                            >
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedYear !== currentYear && (
                            <button
                                className="btn-current-year"
                                onClick={handleCurrentYear}
                                title="Return to current year"
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                Current Year
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Patient Registrations Chart */}
                <div className="col-lg-6">
                    <div className="admin-card chart-card">
                        <div className="chart-header">
                            <h5 className="chart-title">
                                <i className="bi bi-person-plus me-2"></i>
                                Patient Registrations by Month
                            </h5>
                            <span className="chart-subtitle">Year {selectedYear}</span>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={patientData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Appointments by Week Chart */}
                <div className="col-lg-6">
                    <div className="admin-card chart-card">
                        <div className="chart-header">
                            <h5 className="chart-title">
                                <i className="bi bi-calendar-week me-2"></i>
                                Appointments by Week
                            </h5>
                            <span className="chart-subtitle">Month {currentMonth}/{selectedYear}</span>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={weeklyAppointments}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="week" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 5 }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Appointments by Month Chart */}
                <div className="col-lg-6">
                    <div className="admin-card chart-card">
                        <div className="chart-header">
                            <h5 className="chart-title">
                                <i className="bi bi-calendar-check me-2"></i>
                                Appointments by Month
                            </h5>
                            <span className="chart-subtitle">Year {selectedYear}</span>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyAppointments}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Revenue by Month Chart */}
                <div className="col-lg-6">
                    <div className="admin-card chart-card">
                        <div className="chart-header">
                            <h5 className="chart-title">
                                <i className="bi bi-currency-dollar me-2"></i>
                                Revenue by Month
                            </h5>
                            <span className="chart-subtitle">Year {selectedYear}</span>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                        }}
                                        formatter={(value) => `$${value.toFixed(2)}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Cancelled" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
