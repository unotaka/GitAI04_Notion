'use client';

import { useRef, useState } from 'react';
import BasicInfoTab from './BasicInfoTab';
import SkillSummaryTab from './SkillSummaryTab';
import CareerHistoryTab from './CareerHistoryTab';
import { createInitialBasicInfo, createInitialTechSummary } from '../lib/constants';
import { importExcelFile } from '../lib/excelImport';
import { downloadMarkdown, parseMarkdown } from '../lib/markdown';
import { openPrintPreview } from '../lib/printPreview';

const TABS = [
  { key: 'basic', label: '基本情報' },
  { key: 'summary', label: 'サマリー' },
  { key: 'career', label: '経歴' },
];

const TAB_COLORS = {
  basic: 'bg-blue-600',
  summary: 'bg-emerald-600',
  career: 'bg-purple-600',
};

export default function ResumeApp() {
  const [activeTab, setActiveTab] = useState('basic');
  const [basicInfo, setBasicInfo] = useState(createInitialBasicInfo());
  const [techSummary, setTechSummary] = useState(createInitialTechSummary());
  const [skillCategories, setSkillCategories] = useState([]);
  const [careerList, setCareerList] = useState([]);

  const excelInputRef = useRef(null);
  const markdownInputRef = useRef(null);

  const handleExcelImportClick = () => excelInputRef.current?.click();
  const handleMarkdownImportClick = () => markdownInputRef.current?.click();

  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const {
        basicInfo: importedBasicInfo,
        techSummary: importedTechSummary,
        skillCategories: importedSkillCategories,
        careerList: importedCareerList,
      } = await importExcelFile(file);
      setBasicInfo((prev) => ({ ...prev, ...importedBasicInfo }));
      setTechSummary((prev) => ({ ...prev, ...importedTechSummary }));
      if (importedSkillCategories && importedSkillCategories.length > 0) setSkillCategories(importedSkillCategories);
      if (importedCareerList && importedCareerList.length > 0) setCareerList(importedCareerList);
    } catch (err) {
      alert(`Excelファイルの読み込みに失敗しました: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleMarkdownFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseMarkdown(text);
        setBasicInfo(parsed.basicInfo);
        setTechSummary(parsed.techSummary);
        setSkillCategories(parsed.skillCategories);
        setCareerList(parsed.careerList);
      } catch (err) {
        alert(`Markdownファイルの読み込みに失敗しました: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveMarkdown = () => {
    downloadMarkdown(basicInfo, techSummary, skillCategories, careerList);
  };

  const handlePrintPreview = () => {
    openPrintPreview({ basicInfo, techSummary, skillCategories, careerList });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">経歴書管理システム</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrintPreview}
            className="px-4 py-2 rounded bg-gray-700 text-white text-sm hover:bg-gray-800"
          >
            PDF印刷プレビュー
          </button>
          <button
            type="button"
            onClick={handleExcelImportClick}
            className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
          >
            Excelインポート
          </button>
          <button
            type="button"
            onClick={handleMarkdownImportClick}
            className="px-4 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Markdownインポート
          </button>
          <button
            type="button"
            onClick={handleSaveMarkdown}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            保存 (.md)
          </button>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleExcelFileChange}
          />
          <input
            ref={markdownInputRef}
            type="file"
            accept=".md"
            className="hidden"
            onChange={handleMarkdownFileChange}
          />
        </div>
      </header>

      <nav className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              activeTab === tab.key ? `${TAB_COLORS[tab.key]} text-white` : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="bg-white rounded-lg shadow p-6">
        {activeTab === 'basic' && <BasicInfoTab basicInfo={basicInfo} setBasicInfo={setBasicInfo} />}
        {activeTab === 'summary' && (
          <SkillSummaryTab
            techSummary={techSummary}
            setTechSummary={setTechSummary}
            skillCategories={skillCategories}
            setSkillCategories={setSkillCategories}
          />
        )}
        {activeTab === 'career' && <CareerHistoryTab careerList={careerList} setCareerList={setCareerList} />}
      </main>
    </div>
  );
}
