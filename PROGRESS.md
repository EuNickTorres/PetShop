# Dayana Peluquería — Progresso do projeto

Site institucional para a peluquería canina/felina da tia (Espanha). Documento de continuidade — atualizar conforme o projeto avança.

## Stack escolhida

- **Next.js** (App Router, TypeScript) + **Tailwind CSS v4**
- Hospedagem planejada: **Vercel** (ainda não configurado)
- CMS planejado para a Dayana editar sozinha: **Sanity** (ainda não integrado — próximo passo grande)
- Fase futura: loja online (carrinho/pagamento) — arquitetura escolhida pensando em crescer para isso

## Como rodar localmente

```
npm run dev
```
Abre em http://localhost:3000. O script `dev` usa `next dev --webpack` (não Turbopack) porque a versão atual do Next (16.2.12) tem um bug intermitente com Turbopack no Windows (erro "Could not find the module global-error.js..."). Não trocar de volta pro Turbopack sem testar bem.

## Estrutura atual

```
src/
  app/
    layout.tsx      → fonte (Quicksand), <html lang="es">, metadata
    page.tsx        → monta a Home: Header, Hero, Services, About, Gallery, Contact, Footer
    globals.css     → paleta de cores (CSS vars) + animação "float"
  components/
    Header.tsx      → logo, nav, botão "Reservar cita"
    Hero.tsx        → seção principal (ver detalhes abaixo)
    Services.tsx    → grid de serviços (vem de site-config.ts)
    About.tsx       → texto placeholder + espaço de foto (SEM foto real ainda, ver pendências)
    Gallery.tsx      → grid de emojis placeholder (SEM fotos reais ainda)
    Contact.tsx     → horários, endereço, WhatsApp, e-mail
    Footer.tsx      → redes sociais
    WhatsAppButton.tsx → botão reutilizável (link wa.me com mensagem pré-pronta)
  lib/
    site-config.ts  → ÚNICO arquivo com os dados do negócio (nome, telefone, horários,
                       endereço, textos do hero, serviços). Editar aqui reflete em todo o site.
public/images/
  fachada.jpg        → foto real da fachada da loja (enviada, AINDA NÃO usada no site)
  pets-collage.jpg   → foto/colagem de pets (enviada, USADA no círculo do Hero)
```

Também na raiz do projeto (fora do site, só arquivos de referência que o usuário mandou):
`home page.jpeg` (referência de design "PetVida" usada de inspiração pro Hero),
`imagem petshop1.jpeg` / `imagempetshop2.jpeg` (mesmas fotos copiadas pra public/images),
`imagem petshop3.mp4` (vídeo do estabelecimento, ainda não usado em lugar nenhum).

## Paleta de cores (extraída das fotos reais da loja)

Definida em `src/app/globals.css`:
- `--brand: #34b7a0` (verde-água, cor da fachada/letreiro)
- `--brand-dark: #1f8f7c` (verde-água escuro, hover/texto forte)
- `--brand-light: #d7f3ea` (verde-menta bem clarinho — usado no fundo do Hero e na borda do círculo)
- `--accent: #7cc142` / `--accent-dark: #5f9c2f` (verde-limão, cor da parede interna da loja)
- `--background: #f4fbf9`, `--foreground: #1f2d28`

Cores extraídas via script Node usando `sharp` (amostragem de pixels das fotos da fachada).

## Hero — decisões de design

Redesenhado no estilo da landing de referência que o usuário mandou (`home page.jpeg`, projeto "PetVida" feito no Lovable), adaptado para "Dayana Peluquería":
- Badge "🐾 Peluquería canina y felina"
- Título com trecho destacado em verde ("Tu mascota siempre **guapa y feliz**")
- Botão sólido "Reservar cita" + botão contorno "Hablar por WhatsApp"
- Círculo com foto (`pets-collage.jpg`) com **animação de balanço** (sobe e desce suavemente, contínua) — classe `.animate-float` em `globals.css`, borda do círculo em verde-menta clarinho (`ring-brand-light`)
- Dois cartõezinhos flutuantes: "⭐ 4.9/5 Valoración" e "🐾 +500 Mascotas atendidas" — **números de exemplo, trocar pelos reais quando a Dayana informar**

## Melhorias aplicadas (2026-09-01)

- **SEO**: `layout.tsx` agora tem metadata completo (Open Graph, Twitter Card, robots, canonical, keywords) + JSON-LD `LocalBusiness` (nome, endereço, telefone, horários). Adicionados `src/app/robots.ts` e `src/app/sitemap.ts` (convenções de arquivo do Next). Tudo usa o novo campo `siteConfig.siteUrl` — **hoje é um domínio placeholder (`https://www.dayanapeluqueria.es`), trocar quando o domínio real for escolhido** (pendência 7 abaixo).
- **DRY**: lógica do botão de WhatsApp (ícone SVG + montagem da mensagem/link `wa.me`) estava duplicada em `WhatsAppButton.tsx` e `FloatingWhatsApp.tsx`. Extraído para `src/lib/whatsapp.ts` (função `getWhatsAppUrl`) e `src/components/icons/WhatsAppIcon.tsx`.
- **Limpeza**: removidos os SVGs padrão do `create-next-app` em `public/` (não usados) e arquivos soltos na raiz que não eram do projeto (`devserver.log`, screenshots de outra tarefa). `*.log` adicionado ao `.gitignore`.
- Build (`npm run build`) e lint (`npm run lint`) rodados sem erros após as mudanças.

## Pendências / próximos passos

1. **Fotos melhores** — a Dayana vai tirar fotos novas da loja; as atuais (`fachada.jpg`, o vídeo) foram consideradas fracas demais pra usar agora. Não usar ainda em "Sobre nosotros" nem na Galeria — aguardar fotos novas.
2. **Números reais** do Hero (avaliação, quantidade de mascotas atendidas) — hoje são placeholder.
3. **Dados reais do negócio** em `src/lib/site-config.ts`: telefone/WhatsApp, e-mail, endereço, horários e redes sociais ainda são placeholder — falta a Dayana confirmar.
4. **Seção "Sobre nosotros"** — texto ainda é genérico, falta história real da Dayana.
5. **Galeria** — hoje são só emojis, esperando fotos boas.
6. **Integrar Sanity CMS** para a Dayana editar conteúdo sozinha sem mexer em código (decisão já tomada, ainda não implementada).
7. **Domínio + deploy no Vercel** (hospedagem ainda não escolhida/configurada). Ao decidir o domínio, atualizar `siteConfig.siteUrl` em `src/lib/site-config.ts` (usado no SEO/Open Graph/sitemap).
8. Decidir se/quando usar o vídeo `imagem petshop3.mp4` (ex: na Galeria ou no Hero).

## Coisas para lembrar

- Não sobrescrever a paleta de cores sem confirmar com o usuário — foi extraída das fotos reais da loja de propósito.
- O usuário disse explicitamente para **não** colocar as fotos atuais no site — esperar fotos melhores.
