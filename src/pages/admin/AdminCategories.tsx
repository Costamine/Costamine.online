import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string | null;
  sort_order: number | null;
}

const emptyCategory: Partial<Category> = {
  name_ar: '',
  name_en: '',
  slug: '',
  icon: '',
  sort_order: 0,
};

export default function AdminCategories() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Partial<Category> | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [linkedTemplatesCount, setLinkedTemplatesCount] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في جلب التصنيفات', variant: 'destructive' });
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  const handleOpenDialog = (category?: Category) => {
    setSelectedCategory(category ? { ...category } : { ...emptyCategory });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleOpenDeleteDialog = async (category: Category) => {
    // Check for linked templates
    const { count } = await supabase
      .from('templates')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id);

    setLinkedTemplatesCount(count || 0);
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
    setLinkedTemplatesCount(0);
  };

  const handleSave = async () => {
    if (!selectedCategory) return;

    const categoryData = {
      name_ar: selectedCategory.name_ar || '',
      name_en: selectedCategory.name_en || '',
      slug: selectedCategory.slug || '',
      icon: selectedCategory.icon || null,
      sort_order: selectedCategory.sort_order || 0,
    };

    if (selectedCategory.id) {
      // Update
      const { error } = await supabase
        .from('template_categories')
        .update(categoryData)
        .eq('id', selectedCategory.id);

      if (error) {
        toast({ title: 'خطأ', description: 'فشل في تحديث التصنيف', variant: 'destructive' });
      } else {
        toast({ title: 'تم', description: 'تم تحديث التصنيف بنجاح' });
        handleCloseDialog();
        fetchCategories();
      }
    } else {
      // Create
      const { error } = await supabase
        .from('template_categories')
        .insert([categoryData]);

      if (error) {
        toast({ title: 'خطأ', description: 'فشل في إضافة التصنيف', variant: 'destructive' });
      } else {
        toast({ title: 'تم', description: 'تم إضافة التصنيف بنجاح' });
        handleCloseDialog();
        fetchCategories();
      }
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    const { error } = await supabase
      .from('template_categories')
      .delete()
      .eq('id', categoryToDelete.id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف التصنيف', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تم حذف التصنيف بنجاح' });
      handleCloseDeleteDialog();
      fetchCategories();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('admin.categories')}</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            إضافة تصنيف
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم (عربي)</TableHead>
                  <TableHead>الاسم (إنجليزي)</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>الأيقونة</TableHead>
                  <TableHead>الترتيب</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      لا توجد تصنيفات
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name_ar}</TableCell>
                      <TableCell>{category.name_en}</TableCell>
                      <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                      <TableCell>{category.icon || '-'}</TableCell>
                      <TableCell>{category.sort_order}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleOpenDialog(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleOpenDeleteDialog(category)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedCategory?.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={selectedCategory?.name_ar || ''}
                  onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, name_ar: e.target.value } : null)}
                  placeholder="المحاسبة المالية"
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={selectedCategory?.name_en || ''}
                  onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, name_en: e.target.value } : null)}
                  placeholder="Financial Accounting"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (معرف الرابط)</Label>
                <Input
                  value={selectedCategory?.slug || ''}
                  onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, slug: e.target.value } : null)}
                  placeholder="financial-accounting"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الأيقونة (اختياري)</Label>
                <Input
                  value={selectedCategory?.icon || ''}
                  onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, icon: e.target.value } : null)}
                  placeholder="calculator"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={selectedCategory?.sort_order || 0}
                  onChange={(e) => setSelectedCategory(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
              <Button onClick={handleSave}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف التصنيف "{categoryToDelete?.name_ar}"؟
                {linkedTemplatesCount > 0 && (
                  <span className="block mt-2 text-destructive font-medium">
                    ⚠️ يوجد {linkedTemplatesCount} نموذج مرتبط بهذا التصنيف
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCloseDeleteDialog}>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
