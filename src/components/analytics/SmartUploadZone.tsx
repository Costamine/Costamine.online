import { useRef, useState, DragEvent } from 'react';
import { Upload, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  onFile: (file: File) => void;
  loading?: boolean;
}

export function SmartUploadZone({ onFile, loading }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <Card className="p-8 border-2 border-dashed bg-card/50 relative overflow-hidden">
      <div className="absolute -top-12 -end-12 w-44 h-44 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-10 blur-3xl" />
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center text-center py-10 rounded-lg transition-colors ${drag ? 'bg-accent/10' : ''}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-violet-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">
          {isAr ? 'التحليل الذكي — ارفع أي ملف Excel' : 'Smart Analytics — Upload Any Excel'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
          {isAr
            ? 'لا يوجد نموذج ثابت — النظام يكتشف الأعمدة تلقائياً (التاريخ، القيمة، الكمية، الفرع، الفئة) مع إمكانية تأكيد الربط يدوياً.'
            : 'No fixed template — the system auto-detects columns (Date, Value, Qty, Branch, Category) with manual mapping confirmation when needed.'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {isAr ? (loading ? 'جاري القراءة...' : 'اختر ملف') : (loading ? 'Reading...' : 'Choose File')}
        </Button>
        <p className="text-[10px] text-muted-foreground mt-4">
          {isAr ? 'الحد الأقصى: 10MB • xlsx, xls, csv' : 'Max: 10MB • xlsx, xls, csv'}
        </p>
      </div>
    </Card>
  );
}
