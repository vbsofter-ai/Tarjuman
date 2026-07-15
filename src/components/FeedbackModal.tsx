import React, { useState } from "react";
import { X, Sparkles, Check, Star } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic: boolean;
  userEmail?: string | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  isArabic,
  userEmail
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError(isArabic ? "يرجى تحديد التقييم بالنجوم" : "Please select a star rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail || "anonymous",
          rating,
          comment: comment.trim(),
          details: "Overall Application Review"
        })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (err: any) {
      setError(err.message || "Feedback submission error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="relative pt-8 px-6 pb-2 text-center">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto shadow-md mb-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="font-black text-base tracking-tight text-white">
            {isArabic ? "تقييم المنصة وإرسال الملاحظات" : "Rate Platform & Share Feedback"}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto leading-normal">
            {isArabic
              ? "ملاحظاتك تساعدنا في تطوير وتحديث خدمات ترجمان بشكل مستمر"
              : "Your suggestions help us continuously improve the translation platform"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto pr-6 pl-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-2xl">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="text-center py-6 space-y-3 animate-in fade-in duration-300" dir={isArabic ? "rtl" : "ltr"}>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-white">
                {isArabic ? "شكراً جزيلاً لمشاركتنا رأيك!" : "Thank you for your feedback!"}
              </h5>
              <p className="text-[11px] text-slate-400 leading-normal">
                {isArabic
                  ? "تم حفظ تقييمك وملاحظاتك بنجاح في قاعدة البيانات وسيقوم فريق التطوير بمراجعتها."
                  : "Your review has been successfully stored. Our development team will review it."}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {isArabic ? "إغلاق النافذة" : "Close Window"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" dir={isArabic ? "rtl" : "ltr"}>
              {/* Stars Selection */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {isArabic ? "تقييمك الإجمالي للموقع" : "Your overall rating"}
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isStarred = hoveredRating ? star <= hoveredRating : (rating ? star <= rating : false);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="text-3xl transition-all duration-150 transform hover:scale-125 cursor-pointer focus:outline-none bg-transparent border-0"
                      >
                        <span className={isStarred ? "text-amber-400" : "text-slate-700"}>★</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suggestions Comment */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 mb-1.5 uppercase tracking-wider">
                  {isArabic ? "اكتب ملاحظاتك ومقترحاتك" : "Write your feedback & comments"}
                </label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isArabic ? "يرجى كتابة ملاحظاتك هنا لمساعدتنا على التحسين..." : "Write any suggestions or remarks to help us improve..."}
                  className="w-full min-h-[100px] p-3 text-base md:text-xs bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-white placeholder-slate-600 focus:outline-none transition-all duration-300"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !rating}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>{isArabic ? "إرسال الملاحظات" : "Submit Feedback"}</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
