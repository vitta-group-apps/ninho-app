export type Json = any;
export type Tables<T extends keyof any = any> = any;
export interface Database { public: { Tables: { [_ in string]: any }; Views: { [_ in string]: any }; Functions: { [_ in string]: any }; Enums: { [_ in string]: any }; }; }
