import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Pencil, Trash2, Upload, Video, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Template {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price_sar: number;
  price_usd: number;
  price_egp: number;
  is_free: boolean;
  is_active: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
  preview_image_url: string | null;
  file_url: string | null;
  demo_file_url?: string | null;
  video_url: string | null;
  discount_percentage: number | null;
  discount_type: string;
  discount_value: number | null;
  discount_active: boolean | null;
  discount_expires_at: string | null;
  downloads_count: number | null;
  show_new_badge: boolean | null;
  created_at: string;
  display_location?: string | null;
  show_download_button?: boolean | null;
  show_try_now_button?: boolean | null;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

const emptyTemplate: Partial<Template> = {
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  price_sar: 0,
  price_usd: 0,
  price_egp: 0,
  is_free: false,
  is_active: true,
  is_featured: false,
  category_id: null,
  preview_image_url: '',
  file_url: '',
  demo_file_url: '',
  video_url: '',
  discount_percentage: 0,
  discount_type: 'percentage',
  discount_value: 0,
  discount_active: false,
  discount_expires_at: null,
  downloads_count: 0,
  show_new_badge: true,
  display_location: 'templates',
  show_download_button: true,
  show_try_now_button: false,
};

export default function AdminTemplates() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Template> | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [demoFile, setDemoFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        supabase.from('templates').select('*').order('created_at', { ascending: false }),
        supabase.from('template_categories').select('*').order('sort_order'),
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data as any);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedTemplate(emptyTemplate);
    setTemplateFile(null);
    setDemoFile(null);
    setPreviewImage(null);
    setDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateFile(null);
    setDemoFile(null);
    setPreviewImage(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate?.name_ar || !selectedTemplate?.name_en) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال اسم النموذج' : 'Please enter template name',
      });
      return;
    }

    setIsSaving(true);

    try {
      let file_url = selectedTemplate.file_url;
      let demo_file_url = selectedTemplate.demo_file_url;
      let preview_image_url = selectedTemplate.preview_image_url;

      // Upload template file if selected
      if (templateFile) {
        const fileExt = templateFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, templateFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName);
        file_url = publicUrl;
      }
      // Upload demo file if selected
      if (demoFile) {
        const fileExt = demoFile.name.split('.').pop();
        const fileName = `demos/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, demoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName);
        demo_file_url = publicUrl;
      }


      if (previewImage) {
        const fileExt = previewImage.name.split('.').pop();
        const fileName = `previews/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, previewImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('templates')
          .getPublicUrl(fileName);
        preview_image_url = publicUrl;
      }

      const templateData = {
        name_ar: selectedTemplate.name_ar,
        name_en: selectedTemplate.name_en,
        description_ar: selectedTemplate.description_ar || null,
        description_en: selectedTemplate.description_en || null,
        price_sar: selectedTemplate.price_sar || 0,
        price_usd: selectedTemplate.price_usd || 0,
        price_egp: selectedTemplate.price_egp || 0,
        is_free: selectedTemplate.is_free || false,
        is_active: selectedTemplate.is_active ?? true,
        is_featured: selectedTemplate.is_featured || false,
        category_id: selectedTemplate.category_id || null,
        file_url,
        demo_file_url: demo_file_url || null,
        preview_image_url,
        video_url: selectedTemplate.video_url || null,
        discount_percentage: selectedTemplate.discount_percentage || 0,
        discount_type: selectedTemplate.discount_type || 'percentage',
        discount_value: selectedTemplate.discount_value || 0,
        discount_active: selectedTemplate.discount_active || false,
        discount_expires_at: selectedTemplate.discount_expires_at || null,
        downloads_count: selectedTemplate.downloads_count || 0,
        show_new_badge: selectedTemplate.show_new_badge ?? true,
        display_location: selectedTemplate.display_location || 'templates',
        show_download_button: selectedTemplate.show_download_button ?? true,
        show_try_now_button: selectedTemplate.show_try_now_button ?? false,
      };

      if (selectedTemplate.id) {
        // Update existing
        const { error } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', selectedTemplate.id);

        if (error) throw error;

        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' ? 'تم تحديث النموذج بنجاح' : 'Template updated successfully',
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('templates')
          .insert([templateData]);

        if (error) throw error;

        toast({
          title: language === 'ar' ? 'تم الإضافة' : 'Added',
          description: language === 'ar' ? 'تم إضافة النموذج بنجاح' : 'Template added successfully',
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving template',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateToDelete.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف النموذج بنجاح' : 'Template deleted successfully',
      });

      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting template',
      });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const cat = categories.find(c => c.id === categoryId);
    return cat ? (language === 'ar' ? cat.name_ar : cat.name_en) : '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'ar' ? 'إدارة النماذج' : 'Manage Templates'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'إضافة وتعديل وحذف النماذج المحاسبية' : 'Add, edit and delete accounting templates'}
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === 'ar' ? 'إضافة نموذج' : 'Add Template'}
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'لا توجد نماذج بعد' : 'No templates yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'الاسم' : 'Name'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'التصنيف' : 'Category'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'السعر (ر.س)' : 'Price (SAR)'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'التحميلات' : 'Downloads'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'الخصم' : 'Discount'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'مجاني' : 'Free'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'الحالة' : 'Status'}
                      </th>
                      <th className="text-start py-3 px-4 font-medium">
                        {language === 'ar' ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{language === 'ar' ? template.name_ar : template.name_en}</div>
                        </td>
                        <td className="py-3 px-4">{getCategoryName(template.category_id)}</td>
                        <td className="py-3 px-4">{template.price_sar}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-primary">{template.downloads_count || 0}</span>
                        </td>
                        <td className="py-3 px-4">
                          {template.discount_active ? (
                            template.discount_type === 'fixed' ? (
                              <span className="text-green-600 font-medium">{template.discount_value} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                            ) : template.discount_percentage ? (
                              <span className="text-green-600 font-medium">{template.discount_percentage}%</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {template.is_free ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {template.is_active ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Eye className="h-4 w-4" />
                              {language === 'ar' ? 'مفعل' : 'Active'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="h-4 w-4" />
                              {language === 'ar' ? 'مخفي' : 'Hidden'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setTemplateToDelete(template);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate?.id
                ? (language === 'ar' ? 'تعديل النموذج' : 'Edit Template')
                : (language === 'ar' ? 'إضافة نموذج جديد' : 'Add New Template')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'}</Label>
                <Input
                  value={selectedTemplate?.name_ar || ''}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'}</Label>
                <Input
                  value={selectedTemplate?.name_en || ''}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name_en: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوصف بالعربية' : 'Arabic Description'}</Label>
                <Textarea
                  value={selectedTemplate?.description_ar || ''}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description_ar: e.target.value })}
                  dir="rtl"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوصف بالإنجليزية' : 'English Description'}</Label>
                <Textarea
                  value={selectedTemplate?.description_en || ''}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description_en: e.target.value })}
                  dir="ltr"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التصنيف' : 'Category'}</Label>
              <Select
                value={selectedTemplate?.category_id || ''}
                onValueChange={(value) => setSelectedTemplate({ ...selectedTemplate, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'اختر التصنيف' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {language === 'ar' ? cat.name_ar : cat.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'السعر (ر.س)' : 'Price (SAR)'}</Label>
                <Input
                  type="number"
                  value={selectedTemplate?.price_sar || 0}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, price_sar: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'السعر ($)' : 'Price (USD)'}</Label>
                <Input
                  type="number"
                  value={selectedTemplate?.price_usd || 0}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, price_usd: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'}</Label>
                <Input
                  type="number"
                  value={selectedTemplate?.price_egp || 0}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, price_egp: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'رابط الفيديو (YouTube)' : 'Video URL (YouTube)'}</Label>
              <Input
                value={selectedTemplate?.video_url || ''}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'ملف النموذج' : 'Template File'}</Label>
                <Input
                  type="file"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  accept=".xlsx,.xls,.xlsm,.pdf,.doc,.docx,.html,.htm,.zip"
                />
                {selectedTemplate?.file_url && (
                  <p className="text-xs text-muted-foreground truncate">
                    {language === 'ar' ? 'الملف الحالي: ' : 'Current: '}{selectedTemplate.file_url}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'ملف النسخة التجريبية' : 'Demo/Trial File'}</Label>
                <Input
                  type="file"
                  onChange={(e) => setDemoFile(e.target.files?.[0] || null)}
                  accept=".xlsx,.xls,.xlsm,.pdf,.doc,.docx,.html,.htm,.zip"
                />
                {selectedTemplate?.demo_file_url && (
                  <p className="text-xs text-muted-foreground truncate">
                    {language === 'ar' ? 'الملف الحالي: ' : 'Current: '}{selectedTemplate.demo_file_url}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'صورة المعاينة' : 'Preview Image'}</Label>
                <Input
                  type="file"
                  onChange={(e) => setPreviewImage(e.target.files?.[0] || null)}
                  accept="image/*"
                />
                {selectedTemplate?.preview_image_url && (
                  <p className="text-xs text-muted-foreground truncate">
                    {language === 'ar' ? 'الصورة الحالية: ' : 'Current: '}{selectedTemplate.preview_image_url}
                  </p>
                )}
              </div>
            </div>

            {/* Discount Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate?.discount_active || false}
                  onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, discount_active: checked })}
                />
                <Label className="font-medium">{language === 'ar' ? 'تفعيل الخصم' : 'Enable Discount'}</Label>
              </div>
              {selectedTemplate?.discount_active && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'نوع الخصم' : 'Discount Type'}</Label>
                      <Select
                        value={selectedTemplate?.discount_type || 'percentage'}
                        onValueChange={(value) => setSelectedTemplate({ ...selectedTemplate, discount_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">{language === 'ar' ? 'نسبة مئوية (%)' : 'Percentage (%)'}</SelectItem>
                          <SelectItem value="fixed">{language === 'ar' ? 'قيمة ثابتة (ر.س)' : 'Fixed Amount (SAR)'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedTemplate?.discount_type === 'fixed' ? (
                      <div className="space-y-2">
                        <Label>{language === 'ar' ? 'قيمة الخصم (ر.س)' : 'Discount Value (SAR)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={selectedTemplate?.discount_value || 0}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, discount_value: Number(e.target.value) })}
                          className="max-w-32"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>{language === 'ar' ? 'نسبة الخصم (%)' : 'Discount Percentage (%)'}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={selectedTemplate?.discount_percentage || 0}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, discount_percentage: Number(e.target.value) })}
                          className="max-w-32"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'تاريخ انتهاء الخصم' : 'Discount Expiry Date'}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedTemplate?.discount_expires_at && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedTemplate?.discount_expires_at ? (
                            format(new Date(selectedTemplate.discount_expires_at), "PPP")
                          ) : (
                            <span>{language === 'ar' ? 'اختر تاريخ' : 'Pick a date'}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedTemplate?.discount_expires_at ? new Date(selectedTemplate.discount_expires_at) : undefined}
                          onSelect={(date) => setSelectedTemplate({ 
                            ...selectedTemplate, 
                            discount_expires_at: date ? date.toISOString() : null 
                          })}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {selectedTemplate?.discount_expires_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => setSelectedTemplate({ ...selectedTemplate, discount_expires_at: null })}
                      >
                        {language === 'ar' ? 'إزالة تاريخ الانتهاء' : 'Remove expiry date'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Downloads Count Section */}
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'عدد التحميلات' : 'Downloads Count'}</Label>
              <Input
                type="number"
                min="0"
                value={selectedTemplate?.downloads_count || 0}
                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, downloads_count: Number(e.target.value) })}
                className="max-w-32"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate?.is_free || false}
                  onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, is_free: checked })}
                />
                <Label>{language === 'ar' ? 'مجاني' : 'Free'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate?.is_active ?? true}
                  onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, is_active: checked })}
                />
                <Label>{language === 'ar' ? 'مفعل' : 'Active'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate?.is_featured || false}
                  onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, is_featured: checked })}
                />
                <Label>{language === 'ar' ? 'مميز' : 'Featured'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedTemplate?.show_new_badge ?? true}
                  onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, show_new_badge: checked })}
                />
                <Label>{language === 'ar' ? 'شارة NEW' : 'NEW Badge'}</Label>
              </div>
            </div>

            {/* Display location & action buttons */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="space-y-2">
                <Label className="font-medium">
                  {language === 'ar' ? 'مكان عرض النموذج' : 'Display Location'}
                </Label>
                <Select
                  value={selectedTemplate?.display_location || 'templates'}
                  onValueChange={(value) => setSelectedTemplate({ ...selectedTemplate, display_location: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="templates">
                      {language === 'ar' ? 'صفحة النماذج' : 'Templates Page'}
                    </SelectItem>
                    <SelectItem value="analytics">
                      {language === 'ar' ? 'صفحة التحليلات' : 'Analytics Page'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar'
                    ? 'اختر أين يظهر هذا النموذج للمستخدمين.'
                    : 'Choose where this template appears to users.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedTemplate?.show_download_button ?? true}
                    onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, show_download_button: checked })}
                  />
                  <Label>{language === 'ar' ? 'إظهار زر التحميل' : 'Show Download Button'}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedTemplate?.show_try_now_button ?? false}
                    onCheckedChange={(checked) => setSelectedTemplate({ ...selectedTemplate, show_try_now_button: checked })}
                  />
                  <Label>{language === 'ar' ? 'إظهار زر "جرب الآن"' : 'Show "Try Now" Button'}</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar'
                  ? 'زر "جرب الآن" يفتح الملف مباشرة في تبويب جديد (يعمل أفضل مع ملفات HTML).'
                  : 'The "Try Now" button opens the file directly in a new tab (works best with HTML files).'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `هل أنت متأكد من حذف "${templateToDelete?.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${templateToDelete?.name_en}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {language === 'ar' ? 'حذف' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
