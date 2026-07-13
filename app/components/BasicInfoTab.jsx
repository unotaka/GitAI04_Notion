'use client';

import { BASIC_INFO_FIELDS } from '../lib/constants';

export default function BasicInfoTab({ basicInfo, setBasicInfo }) {
  const handleChange = (key, value) => {
    setBasicInfo((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BASIC_INFO_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{field.label}</span>
            <input
              type="text"
              value={basicInfo[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">業務経歴（全体要約）</span>
        <textarea
          rows={5}
          value={basicInfo.careerSummary || ''}
          onChange={(e) => handleChange('careerSummary', e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">自己啓発</span>
        <textarea
          rows={4}
          value={basicInfo.selfDevelopment || ''}
          onChange={(e) => handleChange('selfDevelopment', e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>
    </div>
  );
}
