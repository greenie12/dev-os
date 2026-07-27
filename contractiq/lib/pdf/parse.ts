import pdfParse from 'pdf-parse'

type PdfJsTextItem = { str: string; transform: number[] }
type PdfJsTextContent = { items: PdfJsTextItem[] }
type PdfJsPage = { getTextContent: () => Promise<PdfJsTextContent> }

// pdf-parse (v1.x) joins per-page render output with a plain "\n\n" — it never
// emits a form-feed or any other page-boundary marker into the concatenated
// `.text` field. So page boundaries are captured here as a side effect of the
// per-page `pagerender` callback (called once per page, strictly in order),
// rather than by trying to split the joined text back apart afterwards.
export async function extractContractText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const pages: string[] = []

  await pdfParse(buffer, {
    pagerender: (pageData: PdfJsPage) => {
      return pageData.getTextContent().then((textContent) => {
        let text = ''
        let lastY: number | null = null

        for (const item of textContent.items) {
          if (lastY !== null && lastY !== item.transform[5]) {
            text += '\n'
          }
          text += item.str
          lastY = item.transform[5]
        }

        pages.push(text.trim())
        return text
      })
    },
  })

  const text = pages.map((pageText, i) => `[PAGE ${i + 1}]\n${pageText}`).join('\n\n')

  return { text, pageCount: pages.length }
}
