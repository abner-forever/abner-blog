---
name: "Document"
description: "Use document mode for print-like layouts with document-oriented defaults."
source_url: "https://app.grapesjs.com/docs-sdk/project-types/document"
metadata:
  tags: grapesjs, studio-sdk, project-types, document
---


# Document

The Document project type extends the default [Web](web.md) project, offering a simplified setup for print-friendly HTML content. Ideal for layouts like invoices, reports, or badges, it ensures your designs remain consistent when exported for print.

To function correctly, this project type requires the [Printable plugin](../plugins/preset/printable.md).

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { presetPrintable, canvasFullSize } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        presetPrintable,
        canvasFullSize, // Optional
      ],
      project: {
        type: 'document', // Ensure the project type is set to 'document'
        // Custom default project for demo purpose
        default: {
          pages: [
            {
              name: 'Invoice',
              component: `<!DOCTYPE html>
                <html>
                  <body style="padding: 40px; font-family: Arial, Helvetica, sans-serif">
                    <h1>New Document</h1>
                    <p>Content of the document.</p>
                  </body>
                <html>
              `,
            }
          ]
        }
      },
      // Custom layout for demo purposes
      layout: {
        default: {
          type: 'row',
          height: '100%',
          children: [
            {
              type: 'sidebarLeft',
              children: { type: 'panelLayers', header: { label: 'Layers', collapsible: false, icon: 'layers' } }
            },
            {
              type: 'canvasSidebarTop',
              sidebarTop: {
                rightContainer: {
                  buttons: ({ items }) => [
                    {
                      id: 'print',
                      icon: '<svg viewBox="0 0 24 24"><path d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"/></svg>',
                      onClick: ({ editor }) => editor.runCommand('presetPrintable:print')
                    },
                    ...items.filter(item => !['showImportCode', 'fullscreen'].includes(item.id))
                  ]
                }
              }
            },
            { type: 'sidebarRight' }
          ]
        }
      },

  }}
/>

```

