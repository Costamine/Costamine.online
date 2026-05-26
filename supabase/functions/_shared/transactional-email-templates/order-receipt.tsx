import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Costamine Accounting"

interface OrderReceiptProps {
  customerName?: string
  orderNumber?: string
  totalSar?: number
  itemsCount?: number
}

const OrderReceiptEmail = ({ customerName, orderNumber, totalSar, itemsCount }: OrderReceiptProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تأكيد الطلب {orderNumber ? `#${orderNumber}` : ''} - {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </div>
        <div style={content}>
          <Heading style={h2}>
            {customerName ? `مرحباً ${customerName}،` : 'مرحباً،'}
          </Heading>
          <Text style={text}>
            تم استلام طلبك بنجاح! سنقوم بمراجعته والتواصل معك في أقرب وقت.
          </Text>

          <Section style={orderBox}>
            <Text style={orderLabel}>رقم الطلب</Text>
            <Text style={orderValue}>{orderNumber || '—'}</Text>
            <Hr style={hrLight} />
            <div style={row}>
              <Text style={detailLabel}>عدد العناصر</Text>
              <Text style={detailValue}>{itemsCount ?? '—'}</Text>
            </div>
            <div style={row}>
              <Text style={detailLabel}>المجموع</Text>
              <Text style={detailValue}>{totalSar != null ? `${totalSar} ر.س` : '—'}</Text>
            </div>
          </Section>

          <Text style={text}>
            سيتم التواصل معك خلال 24 ساعة لتسليم الملفات بعد تأكيد الدفع.
          </Text>
          <Hr style={hr} />
          <Text style={textEn}>
            Your order has been received. We will contact you within 24 hours for file delivery after payment confirmation.
          </Text>
        </div>
        <div style={footer}>
          <Text style={footerText}>مع أطيب التحيات، فريق {SITE_NAME}</Text>
        </div>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderReceiptEmail,
  subject: (data: Record<string, any>) =>
    `تأكيد الطلب ${data.orderNumber ? '#' + data.orderNumber : ''} - Costamine`,
  displayName: 'Order receipt',
  previewData: { customerName: 'أحمد', orderNumber: 'ORD-20260409-1234', totalSar: 150, itemsCount: 3 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: 'hsl(210, 50%, 25%)', padding: '24px', textAlign: 'center' as const, borderRadius: '10px 10px 0 0' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const content = { padding: '32px 24px' }
const h2 = { fontSize: '20px', fontWeight: 'bold', color: 'hsl(210, 50%, 25%)', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const textEn = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 16px', direction: 'ltr' as const, textAlign: 'left' as const }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const hrLight = { borderColor: '#f3f4f6', margin: '12px 0' }
const orderBox = { backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '8px', margin: '16px 0' }
const orderLabel = { fontSize: '13px', color: '#6b7280', margin: '0 0 4px', textAlign: 'center' as const }
const orderValue = { fontSize: '22px', fontWeight: 'bold', color: 'hsl(220, 60%, 35%)', margin: '0 0 12px', textAlign: 'center' as const }
const row = { display: 'flex', justifyContent: 'space-between', margin: '8px 0' }
const detailLabel = { fontSize: '14px', color: '#6b7280', margin: '0' }
const detailValue = { fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: '0' }
const footer = { backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '0 0 10px 10px' }
const footerText = { fontSize: '13px', color: '#9ca3af', margin: '0', textAlign: 'center' as const }
