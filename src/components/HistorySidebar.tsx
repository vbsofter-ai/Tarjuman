import React, { useState } from "react";
import { History, Star, Trash, Search, ExternalLink, Bookmark, Clock } from "lucide-react";
import { HistoryItem, LanguageCode } from "../types";
import { LANGUAGES } from "../constants";

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  isArabic: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onClearAll,
  isArabic,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getLanguageFlag = (code: LanguageCode) => {
    return LANGUAGES.find((l) => l.code === code)?.flag || "🌐";
  };

  const getLanguageName = (code: LanguageCode) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return isArabic ? lang?.nativeName || code : lang?.name || code;
  };

  const filteredHistory = history.filter((item) => {
    const matchesTab = activeTab === "all" || item.isFavorite;
    const matchesSearch =
      item.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-base text-slate-100">
            {isArabic ? "تاريخ العمليات" : "Translation History"}
          </h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors hover:underline"
          >
            {isArabic ? "مسح الكل" : "Clear All"}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? "ابحث في سجل الترجمة..." : "Search translation history..."}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-800 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 m-3 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "all"
              ? "bg-slate-800 text-slate-100 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isArabic ? "الكل" : "Recent"}</span>
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === "favorites"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>{isArabic ? "المفضلة" : "Starred"}</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              {isArabic
                ? "لا توجد سجلات مطابقة لخياراتك حالياً"
                : "No matching records found."}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="group relative p-3 bg-slate-800/50 border border-slate-800 hover:border-slate-700/80 rounded-2xl transition-all hover:bg-slate-800"
            >
              {/* Top Meta info */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>{getLanguageFlag(item.sourceLang)} {getLanguageName(item.sourceLang)}</span>
                  <span>→</span>
                  <span>{getLanguageFlag(item.targetLang)} {getLanguageName(item.targetLang)}</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">
                  {formatDate(item.timestamp)}
                </span>
              </div>

              {/* Source Text Preview */}
              <p className="text-xs font-medium text-slate-200 line-clamp-2 mb-1.5 leading-relaxed">
                {item.sourceText || (isArabic ? "[ملف مرفق]" : "[Attached File]")}
              </p>

              {/* Translated Text Preview */}
              <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed italic border-l-2 border-slate-700 pl-2">
                {item.translatedText}
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 items-center justify-between mt-1">
                <div className="flex gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-900 text-indigo-400 rounded-full border border-slate-800 font-semibold uppercase">
                    {item.domain}
                  </span>
                  {item.fileAttached && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                      📎 DOC
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onSelectItem(item)}
                    className="p-1 text-slate-400 hover:text-indigo-400 rounded bg-slate-950/40 border border-slate-700 hover:border-indigo-500/50 transition-all"
                    title={isArabic ? "فتح الترجمة" : "Load Translation"}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    className={`p-1 rounded bg-slate-950/40 border transition-all ${
                      item.isFavorite
                        ? "text-amber-400 border-amber-500/30"
                        : "text-slate-400 border-slate-700 hover:text-amber-400"
                    }`}
                    title={isArabic ? "تفضيل" : "Toggle Favorite"}
                  >
                    <Star className={`w-3 h-3 ${item.isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded bg-slate-950/40 border border-slate-700 hover:border-rose-500/30 transition-all"
                    title={isArabic ? "حذف" : "Delete"}
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
