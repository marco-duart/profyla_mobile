/** Link de uma notificação (caminho do site web) -> rota do app. null = sem destino (só marca como lida). */
export function linkToRoute(link: string | null | undefined): string | null {
  if (!link) return null;
  const application = link.match(/^\/candidate\/applications\/(\d+)\/?$/);
  if (application) return `/applications/${application[1]}`;
  const opportunity = link.match(/^\/candidate\/opportunities\/(\d+)\/?$/);
  if (opportunity) return `/jobs/${opportunity[1]}`;
  if (/^\/candidate\/applications\/?$/.test(link)) return "/(tabs)/applications";
  if (/^\/candidate\/opportunities\/?$/.test(link)) return "/(tabs)/jobs";
  if (/^\/candidate\/assessments\/?$/.test(link)) return "/(tabs)/assessments";
  if (/^\/candidate\/(account|curriculum)\/?$/.test(link)) return "/(tabs)/profile";
  return null;
}
