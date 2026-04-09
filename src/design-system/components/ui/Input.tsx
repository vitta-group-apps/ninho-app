/**
 * NINHO DESIGN SYSTEM — Input
 * Node Figma: 2565:21366 | Nitro™ Core v3.0
 *
 * Alias canônico de `TextInput` para compatibilidade com imports
 * `import { Input } from '@/design-system'`.
 *
 * Use TextInput diretamente para acesso a todos os slots (label, hint, error,
 * iconLeft, iconRight). Use Input quando precisar apenas do campo nu.
 */

export { TextInput as Input } from './TextInput';
export type { TextInputProps as InputProps, TextInputSize as InputSize } from './TextInput';
