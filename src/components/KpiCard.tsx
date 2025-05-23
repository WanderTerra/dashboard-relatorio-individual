import React from 'react';

interface Props {
  label: string;
  value: string | number | null;
  intent?: 'success' | 'warning' | 'danger';
}

const intentStyle: Record<NonNullable<Props['intent']>, string> = {
  success: 'bg-green-50 text-green-600 ring-green-300',
  warning: 'bg-yellow-50 text-yellow-700 ring-yellow-300',
  danger : 'bg-red-50 text-red-600 ring-red-300',
};

const KpiCard: React.FC<Props> = ({ label, value, intent = 'success' }) => (
  <div
    className={`flex flex-col gap-1 rounded-xl p-4 shadow-sm ring-1 ${
      intentStyle[intent]
    }`}
  >
    <span className="text-xs/relaxed font-medium uppercase tracking-wide">
      {label}
    </span>
    <span className="text-3xl font-extrabold leading-none">{value ?? '-'}</span>
  </div>
);

export default KpiCard;
