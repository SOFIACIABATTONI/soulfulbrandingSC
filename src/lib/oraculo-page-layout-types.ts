export type OraculoBlock =
  | { kind: "title"; text: string }
  | { kind: "sub_sub_header"; lines: string[]; boldFromLine?: number; align?: "center" }
  | { kind: "sub_header"; lines: string[] }
  | { kind: "text"; html: string; align?: "center"; size?: "sm"; variant?: "brandLines" }
  | { kind: "bulleted_list"; text: string; size?: "sm" }
  | { kind: "image"; src: string; alt?: string; href?: string; scale?: "compact" }
  | { kind: "audio" }
  | { kind: "video"; caption: string }
  | { kind: "payment_card" }
  | { kind: "form" }
  | { kind: "callout_image"; src: string }
  | { kind: "spacer"; size?: "lg" };
