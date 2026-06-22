---
name: "Web"
description: "Use web mode for websites and landing pages with multi-page content structures."
source_url: "https://app.grapesjs.com/docs-sdk/project-types/web"
metadata:
  tags: grapesjs, studio-sdk, project-types, web
---


# Web

Studio SDK allows you to create a wide range of web projects, including but not limited to websites, landing pages, and other web-based applications.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
    type: 'web',
    // Custom default project for demo purpose
    default: {
      pages: [
        { name: 'Home', component: '<h1>Home page</h1>' },
        { name: 'About', component: '<h1>About page</h1>' },
        { name: 'Contact', component: '<h1>Contact page</h1>' },
      ]
    },
    }
  }}
/>

```

