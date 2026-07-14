import React, { useState } from "react";
import { Plus, Trash, BookOpen, AlertCircle, Info } from "lucide-react";
import { GlossaryTerm } from "../types";

interface GlossaryManagerProps {
  terms: GlossaryTerm[];
  onAddTerm: (source: string, target: string) => void;
  onDeleteTerm: (id: string) => void;
  isArabic: boolean;
}

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
  terms,
  onAddTerm,
  onDeleteTerm,
  isArabic,
}) => {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !target.trim()) {
      setError(
        isArabic
          ? "الرجاء إدخال الكلمة الأصلية وترجمتها المعتمدة"
          : "Please enter both source term and its approved translation."
      );
      return;
    }

    // Check if duplicate
    const exists = terms.some(
      (t) => t.source.toLowerCase() === source.trim().toLowerCase()
    );
    if (exists) {
      setError(
        isArabic
          ? "هذا المصطلح موجود بالفعل في القاموس"
          : "This term already exists in the glossary."
      );
      return;
    }

    onAddTerm(source.trim(), target.trim());
    setSource("");
    setTarget("");
    setError("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">
            {isArabic ? "قاموس المصطلحات المخصصة" : "Glossary / Custom Terms"}
          </h3>
          <p className="text-xs text-slate-500">
            {isArabic
              ? "اضبط ترجمات معينة لأسماء العلامات أو المصطلحات ليلتزم بها الذكاء الاصطناعي"
              : "Force Gemini to translate specific terms/brand names exactly as defined"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">
              {isArabic ? "الكلمة الأصلية" : "Source Term (e.g. AI Studio)"}
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={isArabic ? "المصطلح الأصلي" : "Original word"}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1 font-medium">
              {isArabic ? "الترجمة المعتمدة" : "Approved Translation"}
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={isArabic ? "الترجمة المطلوبة" : "Desired translation"}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50/50 p-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-2 px-3 rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{isArabic ? "إضافة المصطلح" : "Add Glossary Term"}</span>
        </button>
      </form>

      {terms.length === 0 ? (
        <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Info className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500">
            {isArabic
              ? "لا توجد مصطلحات حالياً. المصطلحات المضافة ستظهر هنا وسيتم تطبيقها على الترجمة."
              : "No terms added yet. Added terms will enforce translation mapping."}
          </p>
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
          {terms.map((term) => (
            <div
              key={term.id}
              className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg group hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden text-sm">
                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 py-0.5 px-1.5 rounded">
                  {term.source}
                </span>
                <span className="text-slate-400">→</span>
                <span className="font-medium text-slate-700 truncate">{term.target}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteTerm(term.id)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white active:bg-slate-100 transition-colors"
                title={isArabic ? "حذف" : "Delete"}
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
