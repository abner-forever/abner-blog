---
name: "Sidebar Buttons"
description: "Add sidebar action layouts for quick access to common editor panels."
source_url: "https://app.grapesjs.com/docs-sdk/plugins/layout/sidebar-buttons"
metadata:
  tags: grapesjs, studio-sdk, plugins, layout, sidebar-buttons
---


# Sidebar Buttons

|               |              |
| ------------- | ------------ |
| Project types | `web``email` |
| Plan          | Free plan    |

Add a customizable sidebar to centralize key editor actions. Easily toggle panels like Layers, Blocks, and Assets for a more efficient workflow. Comes with predefined responsive layouts for tablet and mobile screens.

Install the Studio SDK plugins package:

```sh
npm i @grapesjs/studio-sdk-plugins

```

Import and use the plugin in your project:

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { layoutSidebarButtons } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        layoutSidebarButtons
      ],
  }}
/>

```

### Customization

You can customize the sidebar by adding your own buttons or extending the existing ones. Each responsive breakpoint can have its own unique set of controls to optimize the editing experience across different screen sizes.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { layoutSidebarButtons } from '@grapesjs/studio-sdk-plugins';
// ...
<StudioEditor
  options={{
      // ...
      plugins: [
        layoutSidebarButtons.init({
          sidebarButton({ id, buttonProps, breakpoint, createSidebarButton }) {
            // Skip updates to the sidebar buttons for layout with a breakpoint (tablet/mobile)
            if (breakpoint) return buttonProps;

            // Customize the button for 'panelBlocks'
            if (id === 'panelBlocks') {
              return createSidebarButton({
                layoutComponent: {
                  type: 'panelBlocks',
                  symbols: false,
                  blocks: ({ blocks }) => blocks.filter(block => block.category?.getLabel() === 'Basic')
                }
              });
              // Customize the button for 'panelPagesLayers'
            } else if (id === 'panelPagesLayers') {
              return createSidebarButton({
                label: 'Layers',
                layoutComponent: { type: 'panelLayers' }
              });
              // Show 'panelAssets' with another placer
            } else if (id === 'panelAssets') {
              return createSidebarButton({
                layoutCommand: { placer: { type: 'absolute', position: 'right' } }
              });
              // Hide 'panelGlobalStyles' button
            } else if (id === 'panelGlobalStyles') {
              return null;
            }

            // Return default button props
            return buttonProps;
          },
          sidebarButtons({ breakpoint, sidebarButtons, createSidebarButton }) {
            // Add a custom button for the default layout
            return !breakpoint
              ? [
                  ...sidebarButtons,
                  createSidebarButton({
                    id: 'customButton',
                    icon: 'flare',
                    layoutCommand: {
                      header: false,
                      placer: { type: 'dialog', title: 'Custom Dialog' }
                    },
                    layoutComponent: {
                      type: 'custom',
                      render: () => 'Custom layout'
                    }
                  })
                ]
              : sidebarButtons;
          },
          rootLayout({ breakpoint, rootLayout, sidebarButtons, createSidebarButton }) {
            if (breakpoint === 768) {
              return {
                ...rootLayout,
                children: [
                  { type: 'canvas' },
                  {
                    type: 'sidebarBottom',
                    style: { padding: '0 5px', alignItems: 'center', gap: 10, minHeight: 39 },
                    children: [
                      ...sidebarButtons,
                      createSidebarButton({
                        id: 'customButton',
                        icon: 'flare',
                        label: 'Custom',
                        layoutCommand: { placer: { type: 'absolute', position: 'right' } },
                        layoutComponent: {
                          type: 'custom',
                          render: () => 'Custom layout'
                        }
                      }),
                      { type: 'devices', style: { width: 100, marginLeft: 'auto' } }
                    ]
                  }
                ]
              };
            }
            return rootLayout;
          }
        }),
      ],
  }}
/>

```

0

0

### Plugin options

| Property             | Type             | Description                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| licenseKey           | string   | The license key for the plugin. This is optional, only required if the plugin is used outside of Studio SDK.**Example**```js
"your-license-key"

```                                                                                                                                                                                                                                   |
| sidebarButton        | function<!-- --> | Extend each sidebar button per breakpoint.**Example**```js
sidebarButton: ({ id, buttonProps, breakpoint, createSidebarButton }) => ({
  ...buttonProps,
  // custom icon for panelBlocks button
  icon: buttonProps.id === 'panelBlocks' ? '<svg ...>' : buttonProps.icon,
})

```                                                                                                        |
| sidebarButtons       | function | Add or filter the resultant buttons per breakpoint.**Example**```js
sidebarButtons: ({ breakpoint, sidebarButtons, createSidebarButton }) => {
  // Add a new button for the default layout
  return !breakpoint ? [...sidebarButtons, createSidebarButton({...})] sidebarButtons;
}

```                                                                                                 |
| sidebarLayoutCommand | function<!-- --> | Customize the layout command object of each sidebar button.**Example**```js
sidebarLayoutCommand: ({ layoutCommand }) => {
 if (layoutCommand.id === 'panelBlocks') {
   // Change the default placer to absolute right
   return {
     ...layoutCommand,
     placer: { type: 'absolute', position: 'right' }
   };
 }
 return layoutCommand;
}

```                                          |
| rootLayout           | function | Customize the resultant root layout per breakpoint.**Example**```js
rootLayout({ breakpoint, rootLayout, sidebarButtons, createSidebarButton }) {
 if (breakpoint === 768) {
   return {
     ...rootLayout,
     children: [
       { type: 'canvas' },
       { type: 'sidebarBottom', children: [ ...sidebarButtons, createSidebarButton({...}) ] }
     ]
   };
 }
 return rootLayout;
}

``` |
| breakpointTablet     | number<!-- -->   | Custom tablet breakpoint.**Default**```js
1024

```                                                                                                                                                                                                                                                                                                                                    |
| breakpointMobile     | number   | Custom mobile breakpoint.**Default**```js
768

```                                                                                                                                                                                                                                                                                                                                     |
