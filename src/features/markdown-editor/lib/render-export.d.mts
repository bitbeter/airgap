export type RenderDiagram = (source: string) => Promise<string>
export function renderExportBody(markdown: string, renderDiagram: RenderDiagram): Promise<string>
export function renderExportDocument(markdown: string, renderDiagram: RenderDiagram): Promise<{ body: string; html: string }>
