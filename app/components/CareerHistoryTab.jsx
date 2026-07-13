'use client';

import { PROCESS_ROLE_MASTER, createCareerEntry } from '../lib/constants';
import { calculateMonths } from '../lib/helpers';

export default function CareerHistoryTab({ careerList, setCareerList }) {
  const addCareer = () => {
    setCareerList((prev) => [...prev, createCareerEntry()]);
  };

  const removeCareer = (id) => {
    setCareerList((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCareer = (id, key, value) => {
    setCareerList((prev) => prev.map((c) => (c.id === id ? { ...c, [key]: value } : c)));
  };

  const updateEnvironment = (id, key, value) => {
    setCareerList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, environment: { ...c.environment, [key]: value } } : c))
    );
  };

  const toggleRole = (id, roleKey) => {
    setCareerList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, processRoles: { ...c.processRoles, [roleKey]: !c.processRoles[roleKey] } } : c))
    );
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={addCareer}
        className="px-4 py-2 rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
      >
        ＋ 新しい経歴を追加
      </button>

      <div className="space-y-6">
        {careerList.map((career) => (
          <div key={career.id} className="border border-gray-200 rounded p-4 space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => removeCareer(career.id)}
                className="text-red-500 hover:text-red-700 font-bold px-2"
              >
                ✕ この経歴を削除
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">開始年月</span>
                <input
                  type="text"
                  placeholder="YYYY/MM"
                  value={career.periodStart}
                  onChange={(e) => updateCareer(career.id, 'periodStart', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">終了年月</span>
                <input
                  type="text"
                  placeholder="YYYY/MM または 現在"
                  value={career.periodEnd}
                  onChange={(e) => updateCareer(career.id, 'periodEnd', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">業種</span>
                <input
                  type="text"
                  value={career.industry}
                  onChange={(e) => updateCareer(career.id, 'industry', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">システム名</span>
                <input
                  type="text"
                  value={career.systemName}
                  onChange={(e) => updateCareer(career.id, 'systemName', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="text-xs text-gray-500">期間: {calculateMonths(career.periodStart, career.periodEnd) || '-'}</div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">概要</span>
              <textarea
                rows={3}
                value={career.overview}
                onChange={(e) => updateCareer(career.id, 'overview', e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">OS</span>
                <input
                  type="text"
                  value={career.environment.os}
                  onChange={(e) => updateEnvironment(career.id, 'os', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">DB</span>
                <input
                  type="text"
                  value={career.environment.db}
                  onChange={(e) => updateEnvironment(career.id, 'db', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">言語</span>
                <input
                  type="text"
                  value={career.environment.language}
                  onChange={(e) => updateEnvironment(career.id, 'language', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">その他</span>
                <input
                  type="text"
                  value={career.environment.other}
                  onChange={(e) => updateEnvironment(career.id, 'other', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div>
              <span className="font-medium text-gray-700 text-sm">担当工程</span>
              <div className="flex flex-wrap gap-3 mt-2">
                {PROCESS_ROLE_MASTER.map((role) => (
                  <label key={role.key} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={!!career.processRoles[role.key]}
                      onChange={() => toggleRole(career.id, role.key)}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
