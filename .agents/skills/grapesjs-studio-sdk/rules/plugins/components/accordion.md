---
name: "Accordion"
description: "Provide accordion components with configurable sections and interaction behavior."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/components/accordion"
metadata:
  tags: grapesjs, studio-sdk, plugins, components, accordion
---


# Accordion

|               |              |
| ------------- | ------------ |
| Project types | `web`        |
| Plan          | Startup plan |

Accessible and customizable accordion component, allowing users to create collapsible content sections with smooth animations and keyboard navigation support.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { accordionComponent } from "@grapesjs/studio-sdk-plugins";
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        accordionComponent.init({
          block: { category: 'My Accordions' },
          blockGroup: { category: 'My Accordions' },
        })
      ],
      project: {
        default: {
          pages: [
            {
              name: 'Home',
              component: `
              <div class="demo-container">
                <h1>Single accordion</h1>

                <details data-gjs-type="accordion"></details>

                <h1>Single accordion open</h1>

                <details data-gjs-type="accordion" open>
                  <summary data-gjs-type="accordion-header">
                    <div>Accordion Header</div>
                    <div data-gjs-type="accordion-marker"></div>
                  </summary>
                  <div data-gjs-type="accordion-content">
                    <div>Accordion Content</div>
                  </div>
                </details>

                <h1>Accordion group</h1>

                <div class="cls-accordion-group" data-gjs-type="accordion-group"></div>

                <h1>Custom styles</h1>

                <div data-gjs-type="accordion-group" class="cls-accordion-group">
                  <details data-gjs-type="accordion">
                    <summary data-gjs-type="accordion-header" class="cls-summary">
                      <div>Accordion 1</div>
                      <div data-gjs-type="accordion-marker"></div>
                    </summary>
                    <div data-gjs-type="accordion-content" class="cls-content">
                      <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>
                    </div>
                  </details>
                  <details data-gjs-type="accordion">
                    <summary data-gjs-type="accordion-header" class="cls-summary">
                      <div>Accordion 2</div>
                      <div data-gjs-type="accordion-marker">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z" /></svg>
                      </div>
                    </summary>
                    <div data-gjs-type="accordion-content" class="cls-content">
                      <div>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                      </div>
                    </div>
                  </details>
                  <details data-gjs-type="accordion">
                    <summary data-gjs-type="accordion-header" class="cls-summary">
                      <div>Accordion 2</div>
                      <div data-gjs-type="accordion-marker">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>arrow-down-drop-circle</title><path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M7,10L12,15L17,10H7Z" /></svg>
                      </div>
                    </summary>
                    <div data-gjs-type="accordion-content" class="cls-content">
                      <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>
                    </div>
                  </details>
                </div>
              </div>

              <style>
                body { font-family: system-ui; }
                h1 { text-align: center }
                .demo-container { padding: 2rem; }

                .cls-accordion-group {
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                }
                .cls-summary {
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  background-color: #f9f9f9;
                  padding: 10px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                }
                .cls-content {
                  padding: 10px;
                }
              </style>
              `,
            }
          ]
        }
      }

  }}
/>

```

### Plugin options

| Property        | Type                                              | Description                                                                                                                                                                                       |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey      | string                                    | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                                 |
| block           | [Block](https://grapesjs.com/docs/api/block.html) | Additional Block properties of the accordion component. Pass `false` to avoid adding the block.**Example**```js
{
  "category": "Extra",
  "label": "My label"
}

```                                   |
| blockGroup      | [Block](https://grapesjs.com/docs/api/block.html) | Additional Block properties of the group accordion component. Pass `false` to avoid adding the block.**Example**```js
{
  "category": "Extra",
  "label": "My label"
}

```                             |
| toolbarIconOpen | string<!-- -->                                    | SVG toolbar button icon to toggle the accordion open state. You can pass an empty string to avoid adding the toolbar button.**Example**```js
"<svg viewBox='0 0 24 24'><path d='M12 9a3 3 0..."

``` |
