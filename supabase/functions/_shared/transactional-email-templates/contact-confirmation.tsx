import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Costamine Accounting"

interface ContactConfirmationProps {
  name?: string
}

const ContactConfirmationEmail = ({ name }: ContactConfirmationProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>شكراً لتواصلك مع {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={header}>
          <Heading style={h1}>{SITE_NAME}</Heading>
        </div>
        <div style={content}>
          <Heading style={h2}>
            {name ? `شكراً لك، ${name}!` : 'شكراً لتواصلك معنا!'}
          </Heading>
          <Text style={text}>
            لقد استلمنا رسالتك بنجاح وسنتواصل معك في أقرب وقت ممكن.
          </Text>
          <Text style={text}>
            فريقنا يعمل على مراجعة رسالتك وسيرد عليك خلال 24 ساعة عمل.
          </Text>
          <Hr style={hr} />
          <Text style={textEn}>
            Thank you for reaching out. We have received your message and will get back to you as soon as possible.
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
  component: ContactConfirmationEmail,
  subject: 'شكراً لتواصلك معنا - Costamine Accounting',
  displayName: 'Contact form confirmation',
  previewData: { name: 'أحمد' },
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
const footer = { backgroundColor: '#f9fafb', padding: '16px 24px', borderRadius: '0 0 10px 10px' }
const footerText = { fontSize: '13px', color: '#9ca3af', margin: '0', textAlign: 'center' as const }
