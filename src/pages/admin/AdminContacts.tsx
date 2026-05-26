import { useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean | null;
  is_replied: boolean | null;
  created_at: string;
}

type SupabaseContact = Omit<Contact, 'is_replied'> & { is_replied?: boolean | null };

export default function AdminContacts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setContacts((data as SupabaseContact[]).map(c => ({ ...c, is_replied: c.is_replied ?? false })));
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (contact: Contact) => {
    if (contact.is_read) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_read: true })
        .eq('id', contact.id);

      if (error) throw error;

      setContacts(contacts.map(c =>
        c.id === contact.id ? { ...c, is_read: true } : c
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAsReplied = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_replied: true, is_read: true } as any)
        .eq('id', contact.id);

      if (error) throw error;

      setContacts(contacts.map(c =>
        c.id === contact.id ? { ...c, is_replied: true, is_read: true } : c
      ));

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تحديد الرسالة كـ "تم الرد"' : 'Message marked as replied',
      });
    } catch (error) {
      console.error('Error marking as replied:', error);
    }
  };

  const openContactDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
    markAsRead(contact);
  };

  const handleDelete = async () => {
    if (!contactToDelete) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactToDelete.id);

      if (error) throw error;

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف الرسالة بنجاح' : 'Message deleted successfully',
      });

      setDeleteDialogOpen(false);
      setContactToDelete(null);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ أثناء الحذف' : 'Error deleting message',
      });
    }
  };

  const unreadCount = contacts.filter(c => !c.is_read).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {language === 'ar' ? 'الرسائل الواردة' : 'Contact Messages'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar'
                ? `${unreadCount} رسالة غير مقروءة`
                : `${unreadCount} unread messages`}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'ar' ? 'لا توجد رسائل' : 'No messages'}
              </div>
            ) : (
              <div className="divide-y">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!contact.is_read ? 'bg-accent/5' : ''}`}
                    onClick={() => openContactDetails(contact)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full ${!contact.is_read ? 'bg-accent/20' : 'bg-muted'}`}>
                          {contact.is_read ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="h-4 w-4 text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${!contact.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {contact.name}
                            </span>
                            {!contact.is_read && (
                              <Badge variant="default" className="text-xs">
                                {language === 'ar' ? 'جديد' : 'New'}
                              </Badge>
                            )}
                            {contact.is_replied && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                {language === 'ar' ? 'تم الرد' : 'Replied'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{contact.email}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{contact.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(contact.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-600 hover:text-green-700"
                          title={language === 'ar' ? 'تم الرد' : 'Mark as replied'}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReplied(contact);
                          }}
                          disabled={contact.is_replied === true}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactToDelete(contact);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Message Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تفاصيل الرسالة' : 'Message Details'}</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الاسم' : 'Name'}</p>
                  <p className="font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                  <p className="font-medium">{selectedContact.email}</p>
                </div>
                {selectedContact.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'رقم الجوال' : 'Phone'}</p>
                    <p className="font-medium">{selectedContact.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                  <p className="font-medium">
                    {new Date(selectedContact.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">{language === 'ar' ? 'الرسالة' : 'Message'}</p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <a href={`mailto:${selectedContact.email}`}>
                  <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {language === 'ar' ? 'رد بالبريد' : 'Reply via Email'}
                  </Button>
                </a>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
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
                ? 'هل أنت متأكد من حذف هذه الرسالة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this message? This action cannot be undone.'}
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
