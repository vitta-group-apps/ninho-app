/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
}

export const SignupEmail = ({
  siteName = 'Ninho',
  siteUrl = 'https://ninho-app.online',
  recipient,
  token = '123456',
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de confirmação é {token} — Ninho 🐣</Preview>
    <Body style={main}>

      <Container style={wrapper}>

        {/* Header roxo */}
        <Section style={header}>
          <div style={logoCircle}>
            <Text style={logoText}>n</Text>
          </div>
          <Text style={brandName}>ninho</Text>
          <Text style={tagline}>Cuide com mais leveza.</Text>
        </Section>

        {/* Card branco */}
        <Section style={card}>

          <Section style={iconWrapper}>
            <Text style={iconEmoji}>📬</Text>
          </Section>

          <Heading style={h1}>Confirme seu e-mail</Heading>

          <Text style={greeting}>
            Oi! Você está quase lá.
          </Text>

          <Text style={text}>
            Use o código abaixo para confirmar seu e-mail e começar
            a organizar o cuidado da sua criança com mais leveza:
          </Text>

          {/* Bloco do código OTP */}
          <Section style={otpWrapper}>
            <Text style={otpLabel}>Seu código de confirmação</Text>
            <Text style={otpCode}>{token}</Text>
            <Text style={otpExpiry}>Válido por 1 hora</Text>
          </Section>

          <Text style={text}>
            Digite esse código na tela do Ninho para confirmar
            seu cadastro e começar.
          </Text>

          <Hr style={divider} />

          {/* O que vem por aí */}
          <Text style={sectionTitle}>O que te espera no Ninho</Text>

          <Section style={featureRow}>
            <Text style={featureEmoji}>💉</Text>
            <Text style={featureText}>
              <strong>Carteira de vacinação</strong> com calendário SUS atualizado
            </Text>
          </Section>

          <Section style={featureRow}>
            <Text style={featureEmoji}>😴</Text>
            <Text style={featureText}>
              <strong>Registro de rotina</strong> — sono, mamadas e fraldas em segundos
            </Text>
          </Section>

          <Section style={featureRow}>
            <Text style={featureEmoji}>🩺</Text>
            <Text style={featureText}>
              <strong>Histórico médico</strong> sempre pronto para a consulta
            </Text>
          </Section>

          <Section style={featureRow}>
            <Text style={featureEmoji}>👨‍👩‍👧</Text>
            <Text style={featureText}>
              <strong>Cuidado compartilhado</strong> com toda a família conectada
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Se você não criou uma conta no Ninho, pode ignorar
            este e-mail com segurança — nada será alterado.
          </Text>

        </Section>

        {/* Rodapé */}
        <Section style={footerSection}>
          <Text style={footerText}>Com carinho,</Text>
          <Text style={footerBrand}>Time Ninho 🐣</Text>
          <Text style={footerLinks}>
            <Link href={`${siteUrl}/privacidade`} style={footerLink}>
              Política de Privacidade
            </Link>
            {' · '}
            <Link href={`${siteUrl}/termos`} style={footerLink}>
              Termos de Uso
            </Link>
            {' · '}
            <Link href={siteUrl} style={footerLink}>
              ninho-app.online
            </Link>
          </Text>
          <Text style={footerAddress}>
            © 2026 Ninho. Feito com 💜 para cuidadores.
          </Text>
        </Section>

      </Container>
    </Body>
  </Html>
)

export default SignupEmail

// ── Estilos ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#F8F5F0',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  padding: '32px 0',
}

const wrapper = {
  maxWidth: '520px',
  margin: '0 auto',
}

const header = {
  backgroundColor: '#806e84',
  borderRadius: '20px 20px 0 0',
  padding: '32px 40px 28px',
  textAlign: 'center' as const,
}

const logoCircle = {
  width: '52px',
  height: '52px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.15)',
  border: '1.5px solid rgba(255,255,255,0.25)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 8px',
}

const logoText = {
  fontFamily: "'Georgia', serif",
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0',
  lineHeight: '52px',
}

const brandName = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '4px 0 0',
  letterSpacing: '-0.5px',
}

const tagline = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
  margin: '4px 0 0',
}

const card = {
  backgroundColor: '#ffffff',
  padding: '36px 40px',
  borderLeft: '1px solid #E5E0D8',
  borderRight: '1px solid #E5E0D8',
}

const iconWrapper = {
  textAlign: 'center' as const,
}

const iconEmoji = {
  fontSize: '48px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#2C2C2C',
  margin: '0 0 12px',
  textAlign: 'center' as const,
  letterSpacing: '-0.3px',
}

const greeting = {
  fontSize: '16px',
  color: '#806e84',
  fontWeight: 'bold' as const,
  margin: '0 0 12px',
  textAlign: 'center' as const,
}

const text = {
  fontSize: '15px',
  color: '#4b4b47',
  lineHeight: '1.65',
  margin: '0 0 16px',
}

// Bloco OTP — elemento principal do email
const otpWrapper = {
  backgroundColor: '#F4F0F3',
  border: '1.5px solid #e3d9e2',
  borderRadius: '16px',
  padding: '24px 32px',
  textAlign: 'center' as const,
  margin: '24px 0',
}

const otpLabel = {
  fontSize: '11px',
  fontWeight: 'bold' as const,
  color: '#7A7A7A',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 12px',
}

const otpCode = {
  fontSize: '42px',
  fontWeight: 'bold' as const,
  color: '#806e84',
  letterSpacing: '10px',
  margin: '0 0 8px',
  fontFamily: "'Courier New', Courier, monospace",
}

const otpExpiry = {
  fontSize: '12px',
  color: '#7A7A7A',
  margin: '0',
}

const divider = {
  borderColor: '#E5E0D8',
  margin: '24px 0',
}

const sectionTitle = {
  fontSize: '13px',
  fontWeight: 'bold' as const,
  color: '#7A7A7A',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.8px',
  margin: '0 0 16px',
}

const featureRow = {
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: '12px',
}

const featureEmoji = {
  fontSize: '18px',
  margin: '0 12px 0 0',
  lineHeight: '1.4',
  minWidth: '24px',
}

const featureText = {
  fontSize: '14px',
  color: '#4b4b47',
  lineHeight: '1.5',
  margin: '0',
}

const footer = {
  fontSize: '12px',
  color: '#7A7A7A',
  lineHeight: '1.6',
  margin: '0',
}

const footerSection = {
  backgroundColor: '#F4F0F3',
  borderRadius: '0 0 20px 20px',
  border: '1px solid #E5E0D8',
  borderTop: 'none',
  padding: '24px 40px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '13px',
  color: '#7A7A7A',
  margin: '0 0 2px',
}

const footerBrand = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#806e84',
  margin: '0 0 16px',
}

const footerLinks = {
  fontSize: '12px',
  color: '#7A7A7A',
  margin: '0 0 8px',
}

const footerLink = {
  color: '#806e84',
  textDecoration: 'none',
}

const footerAddress = {
  fontSize: '11px',
  color: '#CBCBC8',
  margin: '0',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
