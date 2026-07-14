import React, { useRef, useState } from "react";
import { Upload, X, FileText, Image as ImageIcon, AlertCircle } from "lucide-react";
import { FileData } from "../types";

interface FileTranslatorProps {
  onFileLoaded: (file: FileData | null) => void;
  selectedFile: FileData | null;
  isArabic: boolean;
}

export const FileTranslator: React.FC<FileTranslatorProps> = ({
  onFileLoaded,
  selectedFile,
  isArabic,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setError("");

    // Validate size (limit to 10MB to be safe with base64 transmission and Gemini limits)
    if (file.size > 10 * 1024 * 1024) {
      setError(
        isArabic
          ? "حجم الملف كبير جداً. الحد الأقصى المسموح به هو 10 ميجابايت."
          : "File is too large. Maximum size allowed is 10MB."
      );
      return;
    }

    const reader = new FileReader();

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setIsExtracting(true);
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error(isArabic ? "فشل قراءة ملف PDF" : "Failed to read PDF file.");
          }

          // Dynamic import of pdfjs-dist
          const pdfjsLib = await import("pdfjs-dist");
          // Configure worker URL using exact version to ensure matching compatibility
          // @ts-ignore
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "6.1.200"}/build/pdf.worker.min.mjs`;

          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ");
            fullText += pageText + "\n\n";
          }

          const extracted = fullText.trim();
          const finalExtracted = extracted || "Scanned Document (AI Vision/OCR Translation Mode)";

          // Also get base64 for download / metadata representation
          const base64Reader = new FileReader();
          base64Reader.onload = (bEvent) => {
            const bResult = bEvent.target?.result as string;
            const base64Data = bResult.split(",")[1];
            
            onFileLoaded({
              name: file.name,
              size: file.size,
              mimeType: "application/pdf",
              data: base64Data,
              extractedText: finalExtracted,
            });
            setIsExtracting(false);
          };
          base64Reader.readAsDataURL(file);

        } catch (err: any) {
          console.error("PDF extraction error", err);
          setError(err.message || (isArabic ? "فشل استخراج النص من ملف PDF" : "Failed to extract text from PDF."));
          setIsExtracting(false);
        }
      };
      
      reader.onerror = () => {
        setError(isArabic ? "فشل قراءة الملف" : "Failed to read file.");
        setIsExtracting(false);
      };

      reader.readAsArrayBuffer(file);
    } else {
      // Standard file readers (TXT, PNG, JPG)
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) {
          setError(isArabic ? "فشل قراءة الملف" : "Failed to read file.");
          return;
        }

        // Extract base64 data
        const base64Data = result.split(",")[1];

        onFileLoaded({
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          data: base64Data,
        });
      };

      reader.onerror = () => {
        setError(isArabic ? "فشل قراءة الملف" : "Failed to read file.");
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    onFileLoaded(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImageFile = selectedFile && selectedFile.mimeType.startsWith("image/");

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.pdf,.png,.jpg,.jpeg"
        className="hidden"
      />

      {isExtracting ? (
        <div className="border-2 border-dashed rounded-2xl p-8 text-center border-indigo-500 bg-indigo-50/30 animate-pulse">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-slate-700">
            {isArabic ? "جاري قراءة واستخراج النصوص من ملف PDF..." : "Extracting text content from PDF..."}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isArabic ? "يرجى الانتظار، قد يستغرق هذا بضع ثوانٍ..." : "Please wait, this might take a few seconds..."}
          </p>
        </div>
      ) : !selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/30 ring-4 ring-indigo-500/10"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm w-fit mx-auto mb-3 text-slate-500 transition-transform group-hover:scale-105">
            <Upload className="w-6 h-6 text-indigo-600" />
          </div>

          <h4 className="text-sm font-semibold text-slate-700 mb-1">
            {isArabic ? "ترجمة ملف أو صورة" : "Translate File or Image"}
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mb-2">
            {isArabic
              ? "اسحب وأفلت الملف هنا أو انقر للتصفح. ندعم المستندات والصور (PDF, TXT, PNG, JPG)"
              : "Drag and drop your file here, or click to browse. Supports PDF, TXT, PNG, JPG"}
          </p>
          <span className="inline-block text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
            {isArabic ? "الحد الأقصى: 10 ميجابايت" : "Max size: 10MB"}
          </span>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-500 mt-3 bg-rose-50/50 p-2 rounded-lg max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-3.5 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 p-2 bg-indigo-600/10 text-indigo-600 rounded-xl">
              {isImageFile ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>

            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-[300px]">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <p className="text-[10px] text-indigo-600/80 font-medium">
                  {formatFileSize(selectedFile.size)} •{" "}
                  {selectedFile.mimeType.split("/")[1]?.toUpperCase() || "DOC"}
                </p>
                {selectedFile.extractedText === "Scanned Document (AI Vision/OCR Translation Mode)" && (
                  <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded">
                    {isArabic ? "ممسوح ضوئياً (ترجمة بصرية)" : "Scanned PDF (AI Vision Mode)"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isImageFile && (
              <img
                src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`}
                alt="File Preview"
                className="w-10 h-10 object-cover rounded-lg border border-indigo-100 bg-white"
              />
            )}
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title={isArabic ? "إزالة الملف" : "Remove File"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
