import data from './site.json';

export type NavItem = { label: string; href: string };

export type LayoutConfig = {
  defaultTheme: 'dark' | 'light';
  accent: string;
  accentAlt: string;
  accentLight: string;
  accentAltLight: string;
  width: string;
  listStyle: 'rows' | 'cards';
  tocPosition: 'right' | 'hidden';
  excerptLines: number;
  showGrid: boolean;
  homeModules: string[];
};

export type SiteConfig = {
  title: string;
  tagline: string;
  description: string;
  email: string;
  github: string;
  bilibili: string;
  since: string;
  nav: NavItem[];
  layout: LayoutConfig;
};

export const site = data as SiteConfig;
export const layout = site.layout;

/** 生成每页注入的 CSS 变量：主题色、正文宽度等布局开关都在这里生效 */
export function cssVariables(): string {
  const l = site.layout;
  return [
    `:root{--width:${l.width};--accent:${l.accent};--accent-2:${l.accentAlt};}`,
    `html[data-theme="light"]{--accent:${l.accentLight};--accent-2:${l.accentAltLight};}`,
  ].join('');
}
