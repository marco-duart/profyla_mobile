# Distribuição interna (M-17)

Objetivo do G-M1: um APK de release instalado em aparelho real fazendo o fluxo completo contra a API de homologação. Sem custo, sem lojas.

## Gerar o APK (local, grátis)

Requisitos: JDK 17, Android SDK (command-line tools) e `ANDROID_HOME` configurado.

```bash
EXPO_PUBLIC_API_URL=https://<api-de-homologacao> EXPO_PUBLIC_WEB_URL=https://<site> \
  npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# APK em android/app/build/outputs/apk/release/app-release.apk
```

`android/` é gerado e não deve ser editado à mão nem versionado. O APK de release usa a chave de debug por padrão: serve só para testes internos. Para distribuir a mais gente, crie um keystore próprio (guarde fora do repositório) e configure a assinatura por um config plugin.

## Instalar

1. Passe o APK ao aparelho (cabo, link privado ou `adb install app-release.apk`).
2. Permita a instalação de fontes desconhecidas para o app usado na abertura.

## Checklist do G-M1

- [ ] A API de homologação aceita HTTPS e tem o domínio do app em `FRONTEND_URL`.
- [ ] E-mail de confirmação e redefinição de senha abrem o site; o botão "Voltar para o app" (`profyla://sign-in`) está no site (F-01).
- [ ] Cadastro, confirmação, onboarding e entrada funcionam em aparelho real.
- [ ] Importar PDF: arquivo ≤ 5 MB, revisão em cartões, aplicar.
- [ ] Vagas: candidatar por gesto **e** por botão; "Desfazer" em 5 s.
- [ ] Entrevista: confirmar e remarcar; adicionar ao calendário (permissão só de escrita) ou compartilhar o `.ics`.
- [ ] Teste DISC e Eneagrama por gesto **e** por botão; retomar após fechar o app.
- [ ] Notificações: marcar como lida e abrir o destino.
- [ ] Perfil: foto, exportar dados, revogar aviso dos testes, excluir conta (com senha).
- [ ] TalkBack: todas as ações de gesto aparecem no menu de ações; fonte 1,3× sem cortar texto; "Reduzir movimento" ligado.
- [ ] Sem internet: o app mostra o que está em cache e avisa; ações que precisam do servidor ficam desativadas.
