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

          // Inject pdfjs-dist script dynamically if it doesn't exist
          if (!(window as any).pdfjsLib) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
              script.onload = () => resolve();
              script.onerror = () => reject(new Error("Failed to load PDF parsing library."));
              document.head.appendChild(script);
            });
          }

          const pdfjsLib = (window as any).pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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
    } else if (file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setIsExtracting(true);
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error(isArabic ? "فشل قراءة ملف Word" : "Failed to read Word file.");
          }

          // Inject mammoth from CDNJS dynamically if it doesn't exist
          if (!(window as any).mammoth) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js";
              script.onload = () => resolve();
              script.onerror = () => reject(new Error("Failed to load Word docx library."));
              document.head.appendChild(script);
            });
          }

          const mammoth = (window as any).mammoth;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const extractedText = result.value.trim();
          
          if (!extractedText) {
            throw new Error(isArabic ? "ملف الـ Word فارغ أو لم يتم استخراج نصوص مقروءة منه." : "Word document is empty or no readable text was extracted.");
          }

          // Also get base64 for download / metadata representation
          const base64Reader = new FileReader();
          base64Reader.onload = (bEvent) => {
            const bResult = bEvent.target?.result as string;
            const base64Data = bResult.split(",")[1];
            
            onFileLoaded({
              name: file.name,
              size: file.size,
              mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              data: base64Data,
              extractedText: extractedText,
            });
            setIsExtracting(false);
          };
          base64Reader.readAsDataURL(file);

        } catch (err: any) {
          console.error("DOCX extraction error", err);
          setError(err.message || (isArabic ? "فشل استخراج النص من ملف Word" : "Failed to extract text from Word file."));
          setIsExtracting(false);
        }
      };

      reader.onerror = () => {
        setError(isArabic ? "فشل قراءة ملف Word" : "Failed to read Word file.");
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
        accept=".txt,.pdf,.docx,.png,.jpg,.jpeg"
        className="hidden"
      />

      {isExtracting ? (
        <div className="border border-dashed rounded-xl p-3 text-center border-indigo-500 bg-indigo-50/20 animate-pulse flex items-center justify-center gap-3">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-700">
              {isArabic ? "جاري قراءة واستخراج نصوص الملف..." : "Extracting file text..."}
            </p>
          </div>
        </div>
      ) : !selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border border-dashed rounded-xl p-3 cursor-pointer transition-all flex items-center gap-3 justify-center ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/10"
              : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-xs text-slate-500 flex-shrink-0">
            <Upload className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="text-right sm:text-right" dir={isArabic ? "rtl" : "ltr"}>
            <h4 className="text-xs font-bold text-slate-700 leading-tight">
              {isArabic ? "ترجمة ملف أو صورة" : "Translate File or Image"}
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isArabic
                ? "اسحب أو انقر هنا لرفع الملف (PDF, DOCX, TXT, PNG, JPG) - الحد الأقصى 10 ميجابايت"
                : "Click or drag your file here (PDF, DOCX, TXT, PNG, JPG) - Max 10MB"}
            </p>
          </div>

          {error && (
            <div className="absolute inset-x-0 -bottom-10 flex items-center justify-center gap-1.5 text-[10px] text-rose-500 bg-rose-50/50 p-1.5 rounded-lg max-w-md mx-auto border border-rose-100/50">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 p-2 bg-indigo-50/20 border border-indigo-100 rounded-xl">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 bg-indigo-600/10 text-indigo-600 rounded-lg flex-shrink-0">
              {isImageFile ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>

            <div className="overflow-hidden text-right sm:text-right" dir={isArabic ? "rtl" : "ltr"}>
              <p className="text-[11px] font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[250px]">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <p className="text-[9px] text-indigo-600/80 font-medium">
                  {formatFileSize(selectedFile.size)} •{" "}
                  {selectedFile.mimeType.split("/")[1]?.toUpperCase() || "DOC"}
                </p>
                {selectedFile.extractedText === "Scanned Document (AI Vision/OCR Translation Mode)" && (
                  <span className="inline-block text-[8px] font-bold px-1 py-0.2 bg-amber-50 text-amber-700 border border-amber-100 rounded">
                    {isArabic ? "ترجمة بصرية" : "AI Vision Mode"}
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
                className="w-7 h-7 object-cover rounded-md border border-indigo-100 bg-white"
              />
            )}
            <button
              type="button"
              onClick={clearFile}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
              title={isArabic ? "إزالة الملف" : "Remove File"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
