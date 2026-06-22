---
name: "Email"
description: "Use email mode for MJML newsletter composition and email-oriented editing."
source_url: "https://app.grapesjs.com/docs-sdk/project-types/email"
metadata:
  tags: grapesjs, studio-sdk, project-types, email
---


# Email

Studio SDK lets you create various projects, including email templates for building newsletters using MJML.

```jsx
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';

// ...
<StudioEditor
  options={{
    // ...
    project: {
      type: 'email',
      // Custom default project for demo purpose
      default: {
          pages: [
            { component: '<mjml><mj-body><mj-section><mj-column><mj-text>My email</mj-text></mj-column></mj-section></mj-body></mjml>' },
          ]
      },
    }
  }}
/>

```

