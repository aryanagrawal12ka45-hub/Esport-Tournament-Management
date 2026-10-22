export const ROUTES = {
  command_center: 'command_center',
  bracket: 'bracket',
  academy: 'academy',
  vault: 'vault',
  schema: 'schema',
  query: 'query',
  plsql: 'plsql',
  integrity: 'integrity'
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
