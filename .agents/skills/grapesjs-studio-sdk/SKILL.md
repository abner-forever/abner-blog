---
name: grapesjs-studio-sdk
description: Integration guidance for GrapesJS Studio SDK, fully customizable visual builder you can embed in your app. Use when building, configuring, extending, or troubleshooting Studio SDK projects, including setup, configuration, plugins, and project types.
metadata:
  tags: grapesjs, studio-sdk, visual-editor
---

# GrapesJS Studio SDK

GrapesJS Studio SDK is a fully customizable visual builder you can embed in your app to create:

- Website and landing pages
- Newsletters and email content
- Document editor

Use this skill for setup, configuration, plugin integration, and project type implementation.

## Installation

```bash
npm i @grapesjs/studio-sdk
```

## Initial Editor Load

React:

```tsx
import StudioEditor from "@grapesjs/studio-sdk/react";
import "@grapesjs/studio-sdk/style";
// ...
<StudioEditor
  options={{
    licenseKey: "LOCAL_LICENSE_KEY",
    project: {
      type: "web", // 'email' | 'document'
    },
  }}
/>;
```

JavaScript (other frameworks or vanilla):

```js
import createStudioEditor from "@grapesjs/studio-sdk";
import "@grapesjs/studio-sdk/style";
// ...
createStudioEditor({
  licenseKey: "LOCAL_LICENSE_KEY",
  project: {
    type: "web", // 'email' | 'document'
  },
});
```

## License Key Behavior

- On `localhost`, any string is valid for local development.
- On non-`localhost` domains, a valid `licenseKey` is required. More info: [rules/overview/licenses.md](rules/overview/licenses.md)

## Project Types

- [rules/project-types/email.md](rules/project-types/email.md) - Use email mode for MJML newsletter composition and email-oriented editing.
- [rules/project-types/web.md](rules/project-types/web.md) - Use web mode for websites and landing pages with multi-page content structures.
- [rules/project-types/document.md](rules/project-types/document.md) - Use document mode for print-like layouts with document-oriented defaults.

After the initial setup and project-type choice, configure persistence next:

To make the editor fully functional, the next important step is persistence: define how projects are loaded and saved, and how uploaded assets are stored and retrieved.

## Configuration

- [rules/configuration/overview.md](rules/configuration/overview.md) - Navigate all major configuration areas and how they fit together in an integration.
- [rules/configuration/projects.md](rules/configuration/projects.md) - Set up project initialization, storage of projects data, loading, saving, and export behavior.
- [rules/configuration/blocks.md](rules/configuration/blocks.md) - Define reusable block libraries, categories, the end-user can drop into the canvas.
- [rules/configuration/components/overview.md](rules/configuration/components/overview.md) - Understand component type registration, parsing rules, and custom component architecture.
- [rules/configuration/components/properties.md](rules/configuration/components/properties.md) - Reference the full component property model that controls structure, behavior, style, and export.
- [rules/configuration/components/methods.md](rules/configuration/components/methods.md) - Use component model/view APIs to inspect, mutate, and extend components programmatically.
- [rules/configuration/assets/overview.md](rules/configuration/assets/overview.md) - Configure asset upload, storage, and browsing behavior in the asset manager.
- [rules/configuration/assets/asset-providers.md](rules/configuration/assets/asset-providers.md) - Connect external asset services and define provider integrations for custom media sources.
- [rules/configuration/fonts.md](rules/configuration/fonts.md) - Configure available fonts, custom sources, and provider integrations for typography control.
- [rules/configuration/global-styles.md](rules/configuration/global-styles.md) - Define shared style controls editable by users and applied consistently across project content.
- [rules/configuration/layout/overview.md](rules/configuration/layout/overview.md) - Control panel placement and overall editor UI layout structure.
- [rules/configuration/layout/components.md](rules/configuration/layout/components.md) - Compose editor UI with Layout Components and their property options.
- [rules/configuration/pages.md](rules/configuration/pages.md) - Manage multi-page projects: create pages, switch context, and handle page-level editing.
- [rules/configuration/templates.md](rules/configuration/templates.md) - Configure template catalogs and template selection flows for new projects.
- [rules/configuration/themes.md](rules/configuration/themes.md) - Customize UI theme tokens, iconography, and visual styling of the editor interface.
- [rules/configuration/datasources/overview.md](rules/configuration/datasources/overview.md) - Bind structured data to content using records, variables, conditions, and repeatable output patterns.
- [rules/configuration/datasources/template-engines.md](rules/configuration/datasources/template-engines.md) - Integrate template engines and map data-binding syntax for rendering and import/export workflows.

## Plugins

- [rules/plugins/ai/overview.md](rules/plugins/ai/overview.md) - Understand overall AI plugin architecture and responsibilities between UI and backend.
- [rules/plugins/ai/ai-backend.md](rules/plugins/ai/ai-backend.md) - Implement backend-side AI handling, including request flow and streaming responses.
- [rules/plugins/ai/ai-chat.md](rules/plugins/ai/ai-chat.md) - Add and configure AI chat UI behavior inside the editor experience.
- [rules/plugins/asset-providers/google-fonts.md](rules/plugins/asset-providers/google-fonts.md) - Add Google Fonts as an asset provider for font discovery and insertion.
- [rules/plugins/asset-providers/youtube-asset-provider.md](rules/plugins/asset-providers/youtube-asset-provider.md) - Add YouTube as an asset source for selecting and embedding video media.
- [rules/plugins/canvas/absolute-mode.md](rules/plugins/canvas/absolute-mode.md) - Enable freeform absolute positioning for coordinate-based layout editing.
- [rules/plugins/canvas/emptyState.md](rules/plugins/canvas/emptyState.md) - Customize empty-state placeholders and onboarding hints inside canvas components.
- [rules/plugins/canvas/full-size.md](rules/plugins/canvas/full-size.md) - Enable full-size canvas mode for editing large layouts beyond viewport constraints.
- [rules/plugins/canvas/grid-mode.md](rules/plugins/canvas/grid-mode.md) - Enable visual CSS Grid editing controls directly in the canvas.
- [rules/plugins/components/accordion.md](rules/plugins/components/accordion.md) - Provide accordion components with configurable sections and interaction behavior.
- [rules/plugins/components/animation.md](rules/plugins/components/animation.md) - Add configurable animation behaviors for content transitions and effects.
- [rules/plugins/components/dialog.md](rules/plugins/components/dialog.md) - Provide dialog/modal components with configurable content and interaction options.
- [rules/plugins/components/flex.md](rules/plugins/components/flex.md) - Add flex-based layout blocks to speed up responsive row/column composition.
- [rules/plugins/components/fslightbox.md](rules/plugins/components/fslightbox.md) - Add FsLightbox-powered media viewing interactions.
- [rules/plugins/components/iconify.md](rules/plugins/components/iconify.md) - Integrate Iconify collections with picker-based icon insertion.
- [rules/plugins/components/lightGallery.md](rules/plugins/components/lightGallery.md) - Add LightGallery-powered gallery and media browsing components.
- [rules/plugins/components/listPages.md](rules/plugins/components/listPages.md) - Generate navigational page lists dynamically from the project page model.
- [rules/plugins/components/swiper.md](rules/plugins/components/swiper.md) - Add Swiper-based carousel/slider components with configurable behavior.
- [rules/plugins/components/table.md](rules/plugins/components/table.md) - Add enhanced table components with richer editing controls.
- [rules/plugins/custom-renderer/react.md](rules/plugins/custom-renderer/react.md) - Custom canvas renderer to build and render projects using your own React componenst.
- [rules/plugins/data-sources/ejs.md](rules/plugins/data-sources/ejs.md) - Use EJS as the template engine for data-source-driven rendering and export.
- [rules/plugins/data-sources/handlebars.md](rules/plugins/data-sources/handlebars.md) - Use Handlebars as the template engine for data-source-driven rendering and export.
- [rules/plugins/layout/sidebar-buttons.md](rules/plugins/layout/sidebar-buttons.md) - Add sidebar action layouts for quick access to common editor panels.
- [rules/plugins/preset/printable.md](rules/plugins/preset/printable.md) - Apply printable-oriented defaults and components for document-focused layouts.
- [rules/plugins/rte/prosemirror.md](rules/plugins/rte/prosemirror.md) - Replace the default rich-text editor with a ProseMirror integration.
- [rules/plugins/rte/tinymce.md](rules/plugins/rte/tinymce.md) - Replace the default rich-text editor with a TinyMCE integration.
