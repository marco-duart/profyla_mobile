# Profyla Mobile

App do **candidato** do Profyla (React Native + Expo SDK 58, TypeScript, Expo Router). Cobre cadastro, onboarding por micro-passos, importação do currículo em PDF, vagas com gestos, candidaturas, testes DISC e Eneagrama, notificações e perfil. O recrutador continua só na web (`profyla_front`).

O plano completo está em `../PROFYLA_MOBILE_PLAN.md`. Regras do projeto para agentes: `AGENTS.md`.

## Rodando

```bash
npm install
cp .env.example .env          # EXPO_PUBLIC_API_URL e EXPO_PUBLIC_WEB_URL
npx expo start                # a, i ou w; Expo Go não basta para o calendário: use um development build
```

A API (`../profyla_api`) precisa subir com o ambiente explícito, porque o `.env` dela tem `RAILS_ENV=production`:

```bash
RAILS_ENV=development FRONTEND_URL=http://localhost:8081 bundle exec rails server -p 3000
```

- Emulador Android: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`. Celular físico: o IP da máquina na rede.
- Usuária de demonstração (seeds): `candidata@profyla.com` / `Talento@123`.

## Verificação

```bash
npm run typecheck && npm run lint && npm test
npx expo-doctor
npx expo export --platform android      # confere o bundle nativo
```

Fluxos ponta a ponta (Maestro, sem custo) em `maestro/`: `maestro test maestro/`. Distribuição interna: `docs/DISTRIBUICAO.md`.

## Estrutura

| Pasta | O que tem |
|---|---|
| `src/app` | Rotas (Expo Router). Grupos `(auth)`, `(consent)`, `(onboarding)`, `(tabs)` protegidos por `Stack.Protected` conforme o estado da sessão |
| `src/api` | Cliente HTTP (devise_token_auth com rotação de token), DTOs, fila de mutações |
| `src/features` | Sessão, microfluxos, onboarding, importação de PDF, vagas, candidaturas, testes, notificações, perfil |
| `src/gestures` | Cartões deslizáveis (regras puras testáveis em `decide.ts`) |
| `src/ui` | Design system (tokens, botões, folha inferior, avisos com "Desfazer") |
| `src/i18n` | Textos em pt-BR |

## Princípios

- Todo gesto é atalho: existe sempre um botão visível e uma `accessibilityAction` equivalente.
- Ações reversíveis têm 5 s de "Desfazer" antes de ir ao servidor; as irreversíveis (excluir conta) nunca são por gesto.
- Um assunto por tela; escolher é preferível a digitar.
- Sem custo: nenhuma dependência paga e nenhum serviço externo obrigatório.
