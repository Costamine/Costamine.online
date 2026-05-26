import { useRef, useState, DragEvent } from 'react';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { downloadTemplate } from '@/lib/analytics/exportUtils';

interface Props {
  onFile: (file: File) => void;
  loading?: boolean;
}

export function UploadZone({ onFile, loading }: Props) {
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
    <Card className="p-8 border-2 border-dashed bg-card/50">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center text-center py-10 rounded-lg transition-colors ${drag ? 'bg-accent/10' : ''}`}
      >
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Upload className="h-8 w-8 text-accent" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {isAr ? 'ارفع ملف Excel للبدء' : 'Upload Excel file to start'}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {isAr
            ? 'اسحب الملف هنا أو اضغط على زر التحميل. الأعمدة المطلوبة: التاريخ، صافي_الفيمة، صافي_الكمية، اسم_الفرع، اسم_الفئة'
            : 'Drag the file here or click upload. Required columns: Date, Value, Qty, Branch, Category'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
        />
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {isAr ? (loading ? 'جاري التحليل...' : 'اختر ملف') : (loading ? 'Analyzing...' : 'Choose File')}
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            {isAr ? 'تنزيل النموذج' : 'Download Template'}
          </Button>
        </div>
      </div>
    </Card>
  );
}