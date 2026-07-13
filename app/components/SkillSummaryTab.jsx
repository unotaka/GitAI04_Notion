'use client';

import { SKILL_LEVELS, MAX_ITEMS_PER_CATEGORY, createSkillCategory, createSkillItem } from '../lib/constants';

export default function SkillSummaryTab({ techSummary, setTechSummary, skillCategories, setSkillCategories }) {
  const handleTechSummaryChange = (key, value) => {
    setTechSummary((prev) => ({ ...prev, [key]: value }));
  };

  const addCategory = () => {
    setSkillCategories((prev) => [...prev, createSkillCategory()]);
  };

  const removeCategory = (categoryId) => {
    setSkillCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const updateCategoryName = (categoryId, name) => {
    setSkillCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name } : c)));
  };

  const addItem = (categoryId) => {
    setSkillCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        if (c.items.length >= MAX_ITEMS_PER_CATEGORY) return c;
        return { ...c, items: [...c.items, createSkillItem()] };
      })
    );
  };

  const removeItem = (categoryId, itemId) => {
    setSkillCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c))
    );
  };

  const updateItem = (categoryId, itemId, key, value) => {
    setSkillCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        return {
          ...c,
          items: c.items.map((i) => (i.id === itemId ? { ...i, [key]: value } : i)),
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">経験タイプ</span>
          <input
            type="text"
            value={techSummary.experienceType || ''}
            onChange={(e) => handleTechSummaryChange('experienceType', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700">実務年数</span>
          <input
            type="number"
            value={techSummary.experienceYears || ''}
            onChange={(e) => handleTechSummaryChange('experienceYears', e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={addCategory}
        className="px-4 py-2 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
      >
        ＋ 新しい分類（OS等）を追加
      </button>

      <div className="space-y-4">
        {skillCategories.map((category) => (
          <div key={category.id} className="border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                className="text-red-500 hover:text-red-700 font-bold px-2"
              >
                ✕
              </button>
              <input
                type="text"
                placeholder="分類名 (例: OS, DB, 言語)"
                value={category.name}
                onChange={(e) => updateCategoryName(category.id, e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2 mb-3">
              {category.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeItem(category.id, item.id)}
                    className="text-red-500 hover:text-red-700 font-bold px-2"
                  >
                    ✕
                  </button>
                  <input
                    type="text"
                    placeholder="経験・スキル要素"
                    value={item.name}
                    onChange={(e) => updateItem(category.id, item.id, 'name', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={item.level}
                    onChange={(e) => updateItem(category.id, item.id, 'level', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addItem(category.id)}
              disabled={category.items.length >= MAX_ITEMS_PER_CATEGORY}
              className="px-3 py-1.5 rounded bg-gray-200 text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ＋ 項目を追加 (最大{MAX_ITEMS_PER_CATEGORY})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
