import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  name_ar: string;
  name_en: string;
  activity_ar: string | null;
  activity_en: string | null;
  comment_ar: string;
  comment_en: string;
  avatar_url: string | null;
  rating: number;
  is_active: boolean | null;
  sort_order: number | null;
}

const emptyTestimonial: Partial<Testimonial> = {
  name_ar: '',
  name_en: '',
  activity_ar: '',
  activity_en: '',
  comment_ar: '',
  comment_en: '',
  avatar_url: '',
  rating: 5,
  is_active: true,
  sort_order: 0,
};

export default function AdminTestimonials() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      if (data) setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setSelectedTestimonial(emptyTestimonial);
    setDialogOpen(true);
  };

  const openEditDialog = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTestimonial?.name_ar || !selectedTestimonial?.name_en || 
        !selectedTestimonial?.comment_ar || !selectedTestimonial?.comment_en) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال جميع الحقول المطلوبة' : 'Please fill all required fields',
      });
      return;
    }

    setIsSaving(true);

    try {
      const testimonialData = {
        name_ar: selectedTestimonial.name_ar,
        name_en: selectedTestimonial.name_en,
        activity_ar: selectedTestimonial.activity_ar || null,
        activity_en: selectedTestimonial.activity_en || null,
        comment_ar: selectedTestimonial.comment_ar,
        comment_en: selectedTestimonial.comment_en,
        avatar_url: selectedTestimonial.avatar_url || null,
        rating: selectedTestimonial.rating || 5,
        is_active: selectedTestimonial.is_active ?? true,
        sort_order: selectedTestimonial.sort_order || 0,
      };

      if (selectedTestimonial.id) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', selectedTestimonial.id);

        if (error) throw error;

        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' ? 'تم تحديث التقييم بنجاح' : 'Testimonial updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData]);

        if (error) throw error;

        toast({
          title: language === 'ar' ? 'تم الإضافة' : 'Added',
          description: language === 'ar' ? 'تم إضافة التقييم بنجاح' : 'Testimonial added successfully',
        });
      }

      setDialogOpen(false);
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving testimonial',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!testimonialToDelete) return;

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonialToDelete.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف التقييم بنجاح' : 'Testimonial deleted successfully',
      });

      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting testimonial',
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
      />
    ));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'ar' ? 'إدارة التقييمات' : 'Manage Testimonials'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'إضافة وتعديل آراء العملاء' : 'Add and edit customer testimonials'}
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {language === 'ar' ? 'إضافة تقييم' : 'Add Testimonial'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {language === 'ar' ? 'لا توجد تقييمات' : 'No testimonials'}
            </div>
          ) : (
            testimonials.map((testimonial) => (
              <Card key={testimonial.id} className={`${!testimonial.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-accent font-bold">
                          {testimonial.name_ar.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{language === 'ar' ? testimonial.name_ar : testimonial.name_en}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? testimonial.activity_ar : testimonial.activity_en}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(testimonial)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setTestimonialToDelete(testimonial);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex mb-2">{renderStars(testimonial.rating)}</div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    "{language === 'ar' ? testimonial.comment_ar : testimonial.comment_en}"
                  </p>

                  {!testimonial.is_active && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'ar' ? '(مخفي)' : '(Hidden)'}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTestimonial?.id
                ? (language === 'ar' ? 'تعديل التقييم' : 'Edit Testimonial')
                : (language === 'ar' ? 'إضافة تقييم جديد' : 'Add New Testimonial')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'} *</Label>
                <Input
                  value={selectedTestimonial?.name_ar || ''}
                  onChange={(e) => setSelectedTestimonial({ ...selectedTestimonial, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'} *</Label>
                <Input
                  value={selectedTestimonial?.name_en || ''}
                  onChange={(e) => setSelectedTestimonial({ ...selectedTestimonial, name_en: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'النشاط بالعربية' : 'Arabic Activity'}</Label>
                <Input
                  value={selectedTestimonial?.activity_ar || ''}
                  onChange={(e) => setSelectedTestimonial({ ...selectedTestimonial, activity_ar: e.target.value })}
                  dir="rtl"
                  placeholder={language === 'ar' ? 'مثال: محاسب' : 'e.g. Accountant'}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'النشاط بالإنجليزية' : 'English Activity'}</Label>
                <Input
                  value={selectedTestimonial?.activity_en || ''}
                  onChange={(e) => setSelectedTestimonial({ ...selectedTestimonial, activity_en: e.target.value })}
                  dir="ltr"
                  placeholder="e.g. Accountant"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التعليق بالعربية' : 'Arabic Comment'} *</Label>
              <Textarea
                value={selectedTestimonial?.comment_ar || ''}
                onChange={(e) => setSelectedTestimonial({ ...selectedTestimonial, comment_ar: e.target.value })}
                dir="rtl"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التعليق بالإنجليزية' : 'English Comment'} *</Label>
              <Textarea
                value={selectedTestimonial?.comment_en || ''}
                onChange={(e) => setSelectedTestimonial({ ...selectedTestimonial, comment_en: e.target.value })}
                dir="ltr"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'التقييم' : 'Rating'}</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedTestimonial({ ...selectedTestimonial, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (selectedTestimonial?.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={selectedTestimonial?.is_active ?? true}
                onCheckedChange={(checked) => setSelectedTestimonial({ ...selectedTestimonial, is_active: checked })}
              />
              <Label>{language === 'ar' ? 'مفعل (ظاهر في الموقع)' : 'Active (visible on site)'}</Label>
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
                ? `هل أنت متأكد من حذف تقييم "${testimonialToDelete?.name_ar}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${testimonialToDelete?.name_en}"'s testimonial? This action cannot be undone.`}
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
