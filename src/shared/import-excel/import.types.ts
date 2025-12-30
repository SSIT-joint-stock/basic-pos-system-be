export type NormalizeFn = (v: any) => string | null;

export type UniqueRule<T> = {
  field: keyof T;
  label: string; // "Email", "SĐT", "Code"
  normalize?: NormalizeFn; // normalize trước khi check (email lower, code upper...)
};
