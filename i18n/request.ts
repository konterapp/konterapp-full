import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: {
      Metadata: (await import(`../messages/${locale}/Metadata.json`)).default,
      Navigation: (await import(`../messages/${locale}/Navigation.json`)).default,
      Common: (await import(`../messages/${locale}/Common.json`)).default,
      Login: (await import(`../messages/${locale}/Login.json`)).default,
      Admin: (await import(`../messages/${locale}/Admin.json`)).default,
      AdminMenu: (await import(`../messages/${locale}/AdminMenu.json`)).default,
      AdminRoles: (await import(`../messages/${locale}/AdminRoles.json`)).default,
      AdminUsers: (await import(`../messages/${locale}/AdminUsers.json`)).default,
    }
  };
});
