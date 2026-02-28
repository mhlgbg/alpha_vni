// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi } /* : { strapi: Core.Strapi } */) {
    console.log(Object.keys((strapi as any).apis ?? {}));
    console.log('HAS API me:', !!(strapi as any).apis?.me);
    console.log('HAS API auth-extended:', !!(strapi as any).apis?.['auth-extended']);

    const stack = (strapi as any)?.server?.router?.stack ?? [];

    const matchedPaths = Array.from(
      new Set(
        stack
          .map((layer: any) => layer?.path)
          .filter((path: unknown) => typeof path === 'string' && path.includes('/me'))
      )
    );

    if (matchedPaths.length === 0) {
      strapi.log.info('[bootstrap] Routes containing "/me": none found');
      return;
    }

    strapi.log.info('[bootstrap] Routes containing "/me":');
    matchedPaths.forEach((path) => {
      strapi.log.info(`- ${path}`);
    });

    const authMatchedPaths = Array.from(
      new Set(
        stack
          .map((layer: any) => layer?.path)
          .filter((path: unknown) => typeof path === 'string' && path.includes('/auth'))
      )
    );

    if (authMatchedPaths.length === 0) {
      strapi.log.info('[bootstrap] Routes containing "/auth": none found');
      return;
    }

    strapi.log.info('[bootstrap] Routes containing "/auth":');
    authMatchedPaths.forEach((path) => {
      strapi.log.info(`- ${path}`);
    });
  },
};
