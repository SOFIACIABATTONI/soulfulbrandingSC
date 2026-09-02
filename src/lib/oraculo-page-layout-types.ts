export type OraculoBlock =
  | { kind: "title"; text: string }
  | { kind: "sub_sub_header"; lines: string[]; boldFromLine?: number }
  | { kind: "sub_header"; lines: string[] }
  | { kind: "text"; html: string }
  | { kind: "bulleted_list"; text: string }
  | { kind: "image"; src: string; alt?: string; href?: string }
  | { kind: "audio" }
  | { kind: "video"; caption: string }
  | { kind: "form" }
  | { kind: "callout_image"; src: string };
