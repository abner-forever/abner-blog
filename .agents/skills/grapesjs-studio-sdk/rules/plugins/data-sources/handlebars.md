---
name: "Handlebars"
description: "Use Handlebars as the template engine for data-source-driven rendering and export."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/data-sources/handlebars"
metadata:
  tags: grapesjs, studio-sdk, plugins, data-sources, handlebars
---


# Handlebars

|               |              |
| ------------- | ------------ |
| Project types | `web``email` |
| Plan          | Startup plan |

This plugin enables importing and exporting your [Data Sources](../../configuration/datasources/overview.md) records using the [Handlebars](https://handlebarsjs.com/) template engine.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

The example below demonstrates how the editor can detect and extract Handlebars expressions from the content, and how it preserves them when exporting.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { dataSourceHandlebars } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
    // ...
    plugins: [
      dataSourceHandlebars
    ],
    dataSources: {
      globalData: {
        user: { firstName: 'Alice', isCustomer: true },
        products: [
          { name: 'Laptop Pro X15', price: 1200.0 },
          { name: 'Wireless Mouse M2', price: 25.99 }
        ]
      },
    },
    layout: {
      default: {
        type: 'row',
        style: { height: '100%' },
        children: [
          { type: 'sidebarLeft' },
          {
            type: 'canvasSidebarTop',
            sidebarTop: {
              rightContainer: {
                buttons: ({ items }) => [{
                  ...items.find(item => item.id === 'showCode'),
                  variant: 'outline',
                  label: 'Show code'
                }],
              },
            },
          },
          { type: 'sidebarRight' },
        ],
      },
    },
    project: {
      default: {
        pages: [
          {
            name: 'Demo',
            component: `
              <h1>Variable</h1>
              <div>Hello {{ globalData.user.data.firstName }}</div>

              <h1>Condition</h1>
              <div>
                Hey, {{#if globalData.user.data.isCustomer }}
                  welcome back {{ globalData.user.data.firstName }}!
                {{else}}
                  please register to see more!
                {{/if}}
              </div>

              <h1>Collection</h1>

              {{#each globalData.products.data }}
                <div>
                  <b>Product Name</b>: {{ this.name }} - <b>Price</b>: {{ this.price }}
                </div>
              {{/each}}
            `,
          }
        ]
      },

    },

  }}
/>

```

### Plugin options

| Property   | Type           | Description                                                                                                                                       |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey | string | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

``` |
