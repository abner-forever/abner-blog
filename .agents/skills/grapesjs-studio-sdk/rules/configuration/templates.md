---
name: "Templates"
description: "Configure template catalogs and template selection flows for new projects."
source_url: "https://app.grapesjs.com/docs-sdk/configuration/templates"
metadata:
  tags: grapesjs, studio-sdk, configuration, templates
---


# Templates

The Studio SDK includes a powerful Template Manager, enabling you to display available templates that users can select as starting points for their projects. The Template Manager utilizes the [PanelTemplates layout component](layout/components.md#paneltemplates), giving you full flexibility to decide how and where the templates are rendered within your application.

## Initialization

Customize the template-fetching logic by defining a handler using the `templates.onLoad` option. This handler should return an array of `TemplateItem` objects, representing the available templates.

The example below demonstrates how to add a button in the top-left corner of the editor to open the PanelTemplates within a dialog:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    layout: {
      default: {
        type: 'row',
        height: '100%',
        children: [
          {
            type: 'canvasSidebarTop',
            sidebarTop: {
              leftContainer: {
                buttons: ({ items }) => [
                  ...items,
                  {
                    id: 'openTemplatesButtonId',
                    size: 's',
                    icon: '<svg viewBox="0 0 24 24"><path d="M20 14H6C3.8 14 2 15.8 2 18S3.8 22 6 22H20C21.1 22 22 21.1 22 20V16C22 14.9 21.1 14 20 14M6 20C4.9 20 4 19.1 4 18S4.9 16 6 16 8 16.9 8 18 7.1 20 6 20M6.3 12L13 5.3C13.8 4.5 15 4.5 15.8 5.3L18.6 8.1C19.4 8.9 19.4 10.1 18.6 10.9L17.7 12H6.3M2 13.5V4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4V5.5L2 13.5Z" /></svg>',
                    onClick: ({ editor }) => {
                      editor.runCommand('studio:layoutToggle', {
                        id: 'my-templates-panel',
                        header: false,
                        placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
                        layout: {
                          type: 'panelTemplates',
                          content: { itemsPerRow: 3 },
                          onSelect: ({ loadTemplate, template }) => {
                            // Load the selected template to the current project
                            loadTemplate(template);
                            // Close the dialog layout
                            editor.runCommand('studio:layoutRemove', { id: 'my-templates-panel' })
                          }
                        }
                      });
                    }
                  }
                ]
              }
            },
            grow: true
          },
          { type: 'sidebarRight' }
        ]
      }
    },
    templates: {
      // The onLoad can be an asyncronous function, so you can fetch templates from your API
      onLoad: async () => [
        {
          id: 'template1',
          name: 'Template 1',
          data: {
            pages: [
              {
                name: 'Home',
                component: '<h1 class="title">Template 1</h1><style>.title { color: red; font-size: 10rem; text-align: center }</style>'
              }
            ]
          }
        },
        {
          id: 'template2',
          name: 'Template 2',
          data: {
            pages: [
              { component: '<h1 class="title">Template 2</h1><style>.title { color: blue; font-size: 10rem; text-align: center }</style>' }
            ]
          }
        },
        {
          id: 'template3',
          name: 'Template 3',
          data: {
            pages: [
              { component: '<h1 class="title">Template 3</h1><style>.title { color: green; font-size: 10rem; text-align: center }</style>' }
            ]
          }
        },
        {
          id: 'template4',
          name: 'Template 4',
          data: {
            pages: [
              { component: '<h1 class="title">Template 4</h1><style>.title { color: violet; font-size: 10rem; text-align: center }</style>' }
            ]
          }
        },
      ]
    }

  }}
/>

```

tip

`template.data` is the GrapesJS project data JSON. You can always get the current data from an existing project in Studio via `editor.getProjectData()`.

warning

Templates returned by the custom onLoad handler are shared across all panelTemplates instances. To have different templates in each panel, use the [templates prop](layout/components.md#paneltemplates) instead.

In this example, instead of using a button, we open the dialog when the editor loads:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor =>
        editor.onReady(() => {
          editor.runCommand('studio:layoutToggle', {
            id: 'my-templates-panel',
            header: false,
            placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
            layout: {
              type: 'panelTemplates',
              content: { itemsPerRow: 3 },
              onSelect: ({ loadTemplate, template }) => {
                loadTemplate(template);
                editor.runCommand('studio:layoutRemove', { id: 'my-templates-panel' })
              }
            }
          });
        })
    ],
    templates: {
      onLoad: async () => [
        {
          id: 'template1',
          name: 'Template 1',
          data: {
            pages: [
              {
                name: 'Home',
                component: '<h1 class="title">Template 1</h1><style>.title { color: red; font-size: 10rem; text-align: center }</style>'
              }
            ]
          }
        },
        {
          id: 'template2',
          name: 'Template 2',
          data: {
            pages: [
              { component: '<h1 class="title">Template 2</h1><style>.title { color: blue; font-size: 10rem; text-align: center }</style>' }
            ]
          }
        },
        {
          id: 'template3',
          name: 'Template 3',
          data: {
            pages: [
              { component: '<h1 class="title">Template 3</h1><style>.title { color: green; font-size: 10rem; text-align: center }</style>' }
            ]
          }
        },
        {
          id: 'template4',
          name: 'Template 4',
          data: {
            pages: [
              { component: '<h1 class="title">Template 4</h1><style>.title { color: violet; font-size: 10rem; text-align: center }</style>' }
            ]
          }
        },
      ]
    }

  }}
/>

```

## Properties

### TemplatesConfig properties

Show properties

| Property | Type             | Description                                                                                                                                                                                                                                                                                                                                   |
| -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onLoad   | function | Provide a custom handler for loading list of available templates to display in the templates layout panel. It should return an array of TemplateItems.**Example**```js
onLoad: async ({editor, fetchCommunityTemplates}) => {
  const response = await fetch('TEMPLATES_URL');
  const templates = await response.json();
  return templates;
}

``` |

### TemplateItem properties

Show properties

| Property | Type           | Description                                                                                                                                                                                                                                                                                      |
| -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| id\*     | string<!-- --> | Unique id for this template item.**Example**```js
"template1"

```                                                                                                                                                                                                                                  |
| name\*   | string | Name displayed for this template item.**Example**```js
"Template 1"

```                                                                                                                                                                                                                            |
| media    | string<!-- --> | A thumbnail URL for this template.**Example**```js
"https://example.com/template1.jpg"

```                                                                                                                                                                                                         |
| author   | object | An object containing the name of the author and optionally a link to his socials/website.**Example**```js
{
  "name": "GrapesJS",
  "link": "grapesjs.com"
}

```                                                                                                                                      |
| data\*   | object<!-- --> | GrapesJS project data that will be loaded when the user selects this template.**Example**```js
{
  "pages": [
    {
      "name": "Home",
      "component": "<h1 class=\"red-bg\">Red background template</h1><style>.red-bg { color: white; background: red; height: 100dvh; }</style>"
    }
  ]
}

``` |

## I18n

The labels of the templates panel can be translated into different languages:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      editor =>
        editor.onReady(() => {
          editor.runCommand('studio:layoutToggle', {
            id: 'my-templates-panel',
            header: false,
            placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
            layout: {
              type: 'panelTemplates',
              content: { itemsPerRow: 3 },
            }
          });
        })
    ],
    templates: {
      // return empty array
      onLoad: async () => []
    },
    i18n: {
      locales: {
        en: {
          templates: {
            notFound: 'No templates found'
          }
        }
      }
    }
  }}
/>

```

