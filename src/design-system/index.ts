/**
 * NINHO DESIGN SYSTEM — Index
 * Para uso em src/design-system/index.ts no repositório
 *
 * Importar no app:
 *   import { Button, Input } from '@/design-system';
 *   import '@/design-system/tokens/tokens.css';
 */

export { Button }   from './components/ui/Button';
export { Badge }    from './components/ui/Badge';
export { Chip }     from './components/ui/Chip';
export { Tag }      from './components/ui/Tag';
export { Text }     from './components/ui/Text';
export { Card }     from './components/ui/Card';
export { Divider }  from './components/ui/Divider';
export { Avatar }   from './components/ui/Avatar';
export { Alert }    from './components/ui/Alert';

export type { ButtonProps, ButtonVariant, ButtonSize }    from './components/ui/Button';
export type { BadgeProps, BadgeVariant, BadgeSize }       from './components/ui/Badge';
export type { ChipProps }                                 from './components/ui/Chip';
export type { TagProps, TagVariant }                      from './components/ui/Tag';
export type { TextProps, TextVariant, TextColor }         from './components/ui/Text';
export type { CardProps, CardVariant }                    from './components/ui/Card';
export type { DividerProps }                              from './components/ui/Divider';
export type { AvatarProps, AvatarSize }                   from './components/ui/Avatar';
export type { AlertProps, AlertVariant }                  from './components/ui/Alert';
